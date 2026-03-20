// data.js — NEU Library | Firebase Firestore Backend
// Replace localStorage with real-time Firestore sync

const DB = {
  // Firestore collections
  COLLECTIONS: {
    users: 'neu_lib_users',
    logs: 'neu_lib_visit_logs', 
    settings: 'neu_lib_settings'
  },

  // ── FIRESTORE INIT ──────────────────────────────────────
  async init() {
    if (!window.firebase || !firebase.apps.length) {
      throw new Error('Firebase not initialized. Check your config.');
    }
    this.db = firebase.firestore();
    await this.seedIfEmpty();
    return this;
  },

  // ── SETTINGS ────────────────────────────────────────────
  async getSettings() {
    try {
      const doc = await this.db.collection(this.COLLECTIONS.settings).doc('global').get();
      return doc.exists ? doc.data() : {
        schoolYear: '2024-2025', 
        semester: '1st',
        openingTime: '08:00', 
        closingTime: '21:00',
        purposes: ['Reading Books','Research in Thesis','Use of Computer','Doing Assignments']
      };
    } catch(e) {
      console.error('[DB] getSettings error:', e);
      return {};
    }
  },

  async saveSettings(settings) {
    try {
      await this.db.collection(this.COLLECTIONS.settings).doc('global').set(settings);
      return true;
    } catch(e) {
      console.error('[DB] saveSettings error:', e);
      return false;
    }
  },

  // ── USERS ───────────────────────────────────────────────
  async getUsers() {
    try {
      const snapshot = await this.db.collection(this.COLLECTIONS.users).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch(e) {
      console.error('[DB] getUsers error:', e);
      return [];
    }
  },

  async getUserByID(id) {
    try {
      const doc = await this.db.collection(this.COLLECTIONS.users).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch(e) {
      console.error('[DB] getUserByID error:', e);
      return null;
    }
  },

  async getUserByRFID(rfid) {
    try {
      const snapshot = await this.db.collection(this.COLLECTIONS.users)
        .where('rfidTagNumber', '==', rfid.trim()).limit(1).get();
      return snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
    } catch(e) {
      return null;
    }
  },

  async getUserBySchoolId(schoolId) {
    try {
      const snapshot = await this.db.collection(this.COLLECTIONS.users)
        .where('schoolId', '==', schoolId.trim()).limit(1).get();
      return snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
    } catch(e) {
      return null;
    }
  },

  async upsertUser(user) {
    try {
      await this.db.collection(this.COLLECTIONS.users).doc(user.id).set(user, { merge: true });
      return true;
    } catch(e) {
      console.error('[DB] upsertUser error:', e);
      return false;
    }
  },

  async toggleBlock(id) {
    try {
      const user = await this.getUserByID(id);
      if (!user) return null;
      const updated = { ...user, isBlocked: !user.isBlocked };
      await this.upsertUser(updated);
      return updated;
    } catch(e) {
      console.error('[DB] toggleBlock error:', e);
      return null;
    }
  },

  // ── VISIT LOGS ──────────────────────────────────────────
  async getLogs() {
    try {
      const snapshot = await this.db.collection(this.COLLECTIONS.logs)
        .orderBy('timestamp', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch(e) {
      console.error('[DB] getLogs error:', e);
      return [];
    }
  },

  async getLogsInRange(start, end) {
    try {
      const snapshot = await this.db.collection(this.COLLECTIONS.logs)
        .where('timestamp', '>=', start.toISOString())
        .where('timestamp', '<=', end.toISOString())
        .orderBy('timestamp', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch(e) {
      console.error('[DB] getLogsInRange error:', e);
      return [];
    }
  },

  async addLog(log) {
    try {
      log.id = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
      log.timestamp = firebase.firestore.Timestamp.now();
      log.createdAt = log.timestamp;
      await this.db.collection(this.COLLECTIONS.logs).add(log);
      return log;
    } catch(e) {
      console.error('[DB] addLog error:', e);
      return null;
    }
  },

  // ── IMPORT/EXPORT ───────────────────────────────────────
  async exportJSON() {
    const data = {
      exported_at: new Date().toISOString(), 
      version: '2.0-firebase',
      users: await this.getUsers(),
      visit_logs: await this.getLogs(),
      settings: await this.getSettings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEU-Library-Firestore-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); 
    URL.revokeObjectURL(url);
  },

  async importJSON(file, cb) {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.users) {
            for (const user of data.users) {
              await this.upsertUser(user);
            }
          }
          if (data.visit_logs) {
            for (const log of data.visit_logs) {
              await this.addLog(log);
            }
          }
          if (data.settings) {
            await this.saveSettings(data.settings);
          }
          cb(null, data);
        } catch(err) { 
          cb(err, null); 
        }
      };
      reader.readAsText(file);
    } catch(e) {
      cb(e, null);
    }
  },

  // ── SEED DATA (runs once) ───────────────────────────────
  async seedIfEmpty() {
    try {
      const settingsDoc = await this.db.collection(this.COLLECTIONS.settings).doc('global').get();
      if (!settingsDoc.exists) {
        await this.saveSettings({
          schoolYear: '2024-2025', semester: '1st',
          openingTime: '08:00', closingTime: '21:00',
          purposes: ['Reading Books','Research in Thesis','Use of Computer','Doing Assignments']
        });
      }

      const usersSnap = await this.db.collection(this.COLLECTIONS.users).limit(1).get();
      if (usersSnap.empty) {
        // Seed admin user first
        await this.upsertUser({
          id: 'admin_001',
          name: 'Library Administrator',
          schoolId: 'ADM-0001',
          rfidTagNumber: 'ADMIN001',
          institutionalEmail: 'admin@neu.edu.ph',
          userType: 'Staff',
          affiliation: 'Library',
          role: 'admin',
          isBlocked: false
        });
      }
    } catch(e) {
      console.error('[DB] seedIfEmpty error:', e);
    }
  }
};

// Auto-init when Firebase loads
if (window.firebase) {
  DB.init().catch(console.error);
}
