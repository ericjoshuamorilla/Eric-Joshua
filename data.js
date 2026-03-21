// data.js — NEU Library · Data Layer
// localStorage (instant) + Firestore (persistent, cross-device)
// Every visitor login, user record, and log is synced to Firebase Firestore.

const DB = {
  USERS_KEY:    'neu_lib_users',
  LOGS_KEY:     'neu_lib_logs',
  SETTINGS_KEY: 'neu_lib_settings',

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  },
  _set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  },

  // ── FIRESTORE ─────────────────────────────────────────────
  _db() {
    try {
      if (!window.firebase || !firebase.apps.length) return null;
      return firebase.firestore();
    } catch(e) { return null; }
  },

  // ── SETTINGS ──────────────────────────────────────────────
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.SETTINGS_KEY)) || {
        schoolYear:'2024-2025', semester:'1st',
        openingTime:'08:00', closingTime:'21:00',
        purposes:['Reading Books','Research in Thesis','Use of Computer','Doing Assignments']
      };
    } catch { return {schoolYear:'2024-2025',semester:'1st',openingTime:'08:00',closingTime:'21:00',purposes:['Reading Books','Research in Thesis','Use of Computer','Doing Assignments']}; }
  },
  saveSettings(s) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(s));
    const db = this._db();
    if (db) db.collection('settings').doc('main').set(s).catch(()=>{});
  },

  // ── USERS ─────────────────────────────────────────────────
  getUsers() { return this._get(this.USERS_KEY); },
  saveUsers(u) { this._set(this.USERS_KEY, u); },
  getUserByRFID(rfid) { return this.getUsers().find(u => u.rfidTagNumber === rfid.trim()) || null; },
  getUserBySchoolId(id) { return this.getUsers().find(u => u.schoolId === id.trim()) || null; },
  getUserByID(id) { return this.getUsers().find(u => u.id === id) || null; },
  getUserByEmail(email) { return this.getUsers().find(u => (u.institutionalEmail||'').toLowerCase() === (email||'').toLowerCase()) || null; },

  upsertUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    this.saveUsers(users);
    // Sync to Firestore
    const db = this._db();
    if (db) db.collection('users').doc(user.id).set(user, {merge:true}).catch(()=>{});
    return user;
  },

  toggleBlock(id) {
    const users = this.getUsers();
    const u = users.find(u => u.id === id);
    if (u) {
      u.isBlocked = !u.isBlocked;
      this.saveUsers(users);
      const db = this._db();
      if (db) db.collection('users').doc(id).update({isBlocked: u.isBlocked}).catch(()=>{});
    }
    return u;
  },

  // ── VISIT LOGS ────────────────────────────────────────────
  getLogs() { return this._get(this.LOGS_KEY); },
  saveLogs(l) { this._set(this.LOGS_KEY, l); },

  addLog(log) {
    log.id        = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
    log.timestamp = new Date().toISOString();
    log.createdAt = log.timestamp;
    // Save locally immediately
    const logs = this.getLogs();
    logs.unshift(log);
    this.saveLogs(logs);
    // Sync to Firestore
    const db = this._db();
    if (db) {
      db.collection('visit_logs').doc(log.id).set(log)
        .then(() => console.log('[DB] Visit synced:', log.userName))
        .catch(e => console.warn('[DB] Firestore sync failed:', e.message));
    }
    return log;
  },

  getLogsInRange(start, end) {
    return this.getLogs().filter(l => {
      const t = new Date(l.timestamp); return t >= start && t <= end;
    });
  },

  // ── LOAD FROM FIRESTORE (admin dashboard on load) ─────────
  async loadFromFirestore() {
    const db = this._db();
    if (!db) { console.warn('[DB] Firestore not available'); return false; }
    try {
      // Load users
      const uSnap = await db.collection('users').get();
      if (!uSnap.empty) this.saveUsers(uSnap.docs.map(d => d.data()));

      // Load recent logs
      const lSnap = await db.collection('visit_logs')
        .orderBy('timestamp','desc').limit(1000).get();
      if (!lSnap.empty) this.saveLogs(lSnap.docs.map(d => d.data()));

      // Load settings
      const sSnap = await db.collection('settings').doc('main').get();
      if (sSnap.exists) localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(sSnap.data()));

      console.log('[DB] Loaded from Firestore:', uSnap.size, 'users,', lSnap.size, 'logs');
      return true;
    } catch(e) {
      console.warn('[DB] loadFromFirestore error:', e.message);
      return false;
    }
  },

  // ── REAL-TIME LISTENER (live dashboard updates) ────────────
  listenToLogs(cb) {
    const db = this._db();
    if (!db) return ()=>{};
    return db.collection('visit_logs').orderBy('timestamp','desc').limit(500)
      .onSnapshot(snap => {
        const logs = snap.docs.map(d => d.data());
        this.saveLogs(logs);
        if (cb) cb(logs);
      }, e => console.warn('[DB] listenToLogs:', e.message));
  },

  listenToUsers(cb) {
    const db = this._db();
    if (!db) return ()=>{};
    return db.collection('users')
      .onSnapshot(snap => {
        const users = snap.docs.map(d => d.data());
        this.saveUsers(users);
        if (cb) cb(users);
      }, e => console.warn('[DB] listenToUsers:', e.message));
  },

  // ── IMPORT / EXPORT ───────────────────────────────────────
  exportJSON() {
    const data = {
      exported_at: new Date().toISOString(), version:'2.0',
      users: this.getUsers(), visit_logs: this.getLogs(), settings: this.getSettings()
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `NEU-Library-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  },

  importJSON(file, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.users)      this.saveUsers(data.users);
        if (data.visit_logs) this.saveLogs(data.visit_logs);
        if (data.settings)   this.saveSettings(data.settings);
        // Push to Firestore
        const db = this._db();
        if (db) {
          const batch = db.batch();
          (data.users||[]).forEach(u => batch.set(db.collection('users').doc(u.id), u));
          (data.visit_logs||[]).slice(0,500).forEach(l => batch.set(db.collection('visit_logs').doc(l.id), l));
          batch.commit().catch(()=>{});
        }
        cb(null, data);
      } catch(err) { cb(err, null); }
    };
    reader.readAsText(file);
  },

  seedIfEmpty() {
    if (this.getUsers().length > 0) return;
    const cols = ['College of Accountancy','College of Business Administration','College of Informatics and Computing Studies','College of Engineering and Architecture','College of Nursing','College of Education','College of Arts and Sciences'];
    const purposes = ['Reading Books','Research in Thesis','Use of Computer','Doing Assignments'];
    const types = ['Student','Faculty','Staff','Alumni'];
    const names = ['Maria Santos','Juan dela Cruz','Ana Reyes','Carlo Bautista','Liza Flores','Marco Garcia','Jenny Lim','Paolo Cruz','Christine Tan','Miguel Rivera'];
    const users = names.map((name,i) => ({
      id:`user_${String(i+1).padStart(3,'0')}`, name,
      schoolId:`${20+(i%4)}-${String(1000+i).padStart(4,'0')}`,
      rfidTagNumber:`NEU${String(10000+i).padStart(6,'0')}`,
      institutionalEmail:name.toLowerCase().replace(/ /g,'.')+'@neu.edu.ph',
      userType:types[i%types.length], affiliation:cols[i%cols.length],
      role:'visitor', isBlocked:i===3
    }));
    this.saveUsers(users);
    const logs = [];
    for (let d=0;d<14;d++) {
      for (let j=0;j<3+Math.floor(Math.random()*8);j++) {
        const v=users[Math.floor(Math.random()*users.length)];
        const date=new Date(); date.setDate(date.getDate()-d);
        date.setHours(8+Math.floor(Math.random()*10),Math.floor(Math.random()*60));
        logs.push({id:`log_seed_${d}_${j}`,userId:v.id,userName:v.name,userAffiliation:v.affiliation,userType:v.userType,rfidTagNumber:v.rfidTagNumber,purposeOfVisit:purposes[Math.floor(Math.random()*purposes.length)],schoolYear:'2024-2025',semester:'1st',timestamp:date.toISOString(),createdAt:date.toISOString()});
      }
    }
    logs.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    this.saveLogs(logs);
  }
};

DB.seedIfEmpty();
