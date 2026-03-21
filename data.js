// data.js — NEU Library core data layer (localStorage + JSON export)
// Schema matches original Firebase structure exactly

const DB = {
  USERS_KEY: 'neu_lib_users',
  LOGS_KEY: 'neu_lib_logs',
  SETTINGS_KEY: 'neu_lib_settings',

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  // ── SETTINGS ──────────────────────────────────────────
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.SETTINGS_KEY)) || {
        schoolYear: '2024-2025', semester: '1st',
        openingTime: '08:00', closingTime: '21:00',
        purposes: ['Reading Books','Research in Thesis','Use of Computer','Doing Assignments']
      };
    } catch { return {}; }
  },
  saveSettings(s) { localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(s)); },

  // ── USERS ─────────────────────────────────────────────
  getUsers() { return this._get(this.USERS_KEY); },
  saveUsers(u) { this._set(this.USERS_KEY, u); },
  getUserByRFID(rfid) { return this.getUsers().find(u => u.rfidTagNumber === rfid.trim()) || null; },
  getUserBySchoolId(id) { return this.getUsers().find(u => u.schoolId === id.trim()) || null; },
  getUserByID(id) { return this.getUsers().find(u => u.id === id) || null; },
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
    if (u) { u.isBlocked = !u.isBlocked; this.saveUsers(users); }
    return u;
  },

  // ── VISIT LOGS ────────────────────────────────────────
  getLogs() { return this._get(this.LOGS_KEY); },
  saveLogs(l) { this._set(this.LOGS_KEY, l); },
  addLog(log) {
    const logs = this.getLogs();
    log.id = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
    log.timestamp = new Date().toISOString();
    log.createdAt = log.timestamp;
    logs.unshift(log);
    this.saveLogs(logs);
    return log;
  },
  getLogsInRange(start, end) {
    return this.getLogs().filter(l => {
      const t = new Date(l.timestamp); return t >= start && t <= end;
    });
  },

  // ── IMPORT / EXPORT ───────────────────────────────────
  exportJSON() {
    const data = {
      exported_at: new Date().toISOString(), version: '1.0',
      users: this.getUsers(), visit_logs: this.getLogs(),
      settings: this.getSettings()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEU-Library-Backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  },
  importJSON(file, cb) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.users) this.saveUsers(data.users);
        if (data.visit_logs) this.saveLogs(data.visit_logs);
        if (data.settings) this.saveSettings(data.settings);
        cb(null, data);
      } catch(err) { cb(err, null); }
    };
    reader.readAsText(file);
  },

  // ── SEED DEMO DATA ────────────────────────────────────
  seedIfEmpty() {
    if (this.getUsers().length > 0) return;
    const colleges = {
      "Undergraduate Colleges": [
        "College of Accountancy","College of Business Administration",
        "College of Informatics and Computing Studies","College of Engineering and Architecture",
        "College of Nursing","College of Education","College of Arts and Sciences"
      ],
      "Professional and Graduate Schools": ["College of Law","School of Graduate Studies"]
    };
    const allColleges = [...colleges["Undergraduate Colleges"], ...colleges["Professional and Graduate Schools"]];
    const purposes = ['Reading Books','Research in Thesis','Use of Computer','Doing Assignments'];
    const userTypes = ['Student','Faculty','Staff','Alumni'];
    const names = ['Maria Santos','Juan dela Cruz','Ana Reyes','Carlo Bautista','Liza Flores','Marco Garcia','Jenny Lim','Paolo Cruz','Christine Tan','Miguel Rivera'];

    const users = [
      { id:'admin_001', name:'Library Administrator', schoolId:'ADM-0001', rfidTagNumber:'ADMIN001',
        institutionalEmail:'admin@neu.edu.ph', userType:'Staff', affiliation:'Library',
        role:'admin', isBlocked:false },
      ...names.map((name,i) => ({
        id:`user_${String(i+1).padStart(3,'0')}`,
        name, schoolId:`${20+(i%4)}-${String(1000+i).padStart(4,'0')}`,
        rfidTagNumber:`NEU${String(10000+i).padStart(6,'0')}`,
        institutionalEmail: name.toLowerCase().replace(/ /g,'.') + '@neu.edu.ph',
        userType: userTypes[i % userTypes.length],
        affiliation: allColleges[i % allColleges.length],
        role:'visitor', isBlocked: i === 3
      }))
    ];
    this.saveUsers(users);

    const logs = [];
    for (let d = 0; d < 30; d++) {
      const count = 3 + Math.floor(Math.random() * 14);
      for (let j = 0; j < count; j++) {
        const v = users[1 + Math.floor(Math.random() * (users.length-1))];
        const date = new Date(); date.setDate(date.getDate()-d);
        date.setHours(8+Math.floor(Math.random()*10), Math.floor(Math.random()*60));
        logs.push({
          id:`log_seed_${d}_${j}`, userId:v.id, userName:v.name,
          userAffiliation:v.affiliation, userType:v.userType,
          rfidTagNumber:v.rfidTagNumber, purposeOfVisit:purposes[Math.floor(Math.random()*purposes.length)],
          schoolYear:'2024-2025', semester:'1st',
          timestamp:date.toISOString(), createdAt:date.toISOString()
        });
      }
    }
    logs.sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp));
    this.saveLogs(logs);
  }
};

DB.seedIfEmpty();
