// data.js — NEU Library core data layer (no backend, JSON-based)

const DB = {
  USERS_KEY: 'neu_lib_users',
  LOGS_KEY: 'neu_lib_logs',
  SESSION_KEY: 'neu_lib_session',

  // ── raw storage ──────────────────────────────────────
  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // ── USERS ─────────────────────────────────────────────
  getUsers() { return this._get(this.USERS_KEY); },
  saveUsers(users) { this._set(this.USERS_KEY, users); },

  getUserByRFID(rfid) {
    return this.getUsers().find(u => u.rfid_tag === rfid.trim()) || null;
  },
  getUserByID(id) {
    return this.getUsers().find(u => u.id === id) || null;
  },
  upsertUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    this.saveUsers(users);
  },
  toggleBlock(id) {
    const users = this.getUsers();
    const u = users.find(u => u.id === id);
    if (u) { u.is_blocked = !u.is_blocked; this.saveUsers(users); }
    return u;
  },

  // ── VISIT LOGS ────────────────────────────────────────
  getLogs() { return this._get(this.LOGS_KEY); },
  saveLogs(logs) { this._set(this.LOGS_KEY, logs); },
  addLog(log) {
    const logs = this.getLogs();
    log.id = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    log.timestamp = new Date().toISOString();
    logs.unshift(log);
    this.saveLogs(logs);
    return log;
  },
  getLogsInRange(start, end) {
    return this.getLogs().filter(l => {
      const t = new Date(l.timestamp);
      return t >= start && t <= end;
    });
  },

  // ── SESSION ───────────────────────────────────────────
  getSession() {
    try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)) || null; }
    catch { return null; }
  },
  setSession(user) {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  },
  clearSession() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  // ── IMPORT / EXPORT ───────────────────────────────────
  exportJSON() {
    const data = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      users: this.getUsers(),
      visit_logs: this.getLogs()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEU-Library-Data-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  importJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.users) this.saveUsers(data.users);
        if (data.visit_logs) this.saveLogs(data.visit_logs);
        callback(null, data);
      } catch (err) {
        callback(err, null);
      }
    };
    reader.readAsText(file);
  },

  // ── SEED DEMO DATA ────────────────────────────────────
  seedIfEmpty() {
    if (this.getUsers().length > 0) return;

    const colleges = ['College of Engineering','College of Nursing','College of Business','College of Education','College of IT'];
    const purposes = ['Reading Books','Research / Thesis','Use of Computer','Doing Assignments'];
    const names = ['Maria Santos','Juan dela Cruz','Ana Reyes','Carlo Bautista','Liza Flores',
                   'Marco Garcia','Jenny Lim','Paolo Cruz','Christine Tan','Miguel Rivera'];

    const users = [
      { id: 'admin_001', name: 'Library Admin', email: 'admin@neu.edu.ph', rfid_tag: 'ADMIN001', college: 'Library', role: 'admin', is_blocked: false },
      ...names.map((name, i) => ({
        id: `user_${String(i+1).padStart(3,'0')}`,
        name, email: name.toLowerCase().replace(/ /g,'.') + '@neu.edu.ph',
        rfid_tag: `NEU${String(10000+i).padStart(6,'0')}`,
        college: colleges[i % colleges.length],
        role: 'visitor',
        is_blocked: i === 3
      }))
    ];
    this.saveUsers(users);

    // seed 30 days of logs
    const logs = [];
    for (let d = 0; d < 30; d++) {
      const count = 3 + Math.floor(Math.random() * 12);
      for (let j = 0; j < count; j++) {
        const visitor = users[1 + Math.floor(Math.random() * (users.length - 1))];
        const date = new Date(); date.setDate(date.getDate() - d);
        date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
        logs.push({
          id: `log_seed_${d}_${j}`,
          user_id: visitor.id,
          user_name: visitor.name,
          college: visitor.college,
          purpose: purposes[Math.floor(Math.random() * purposes.length)],
          timestamp: date.toISOString()
        });
      }
    }
    this.saveLogs(logs);
  }
};

// Seed on first load
DB.seedIfEmpty();
