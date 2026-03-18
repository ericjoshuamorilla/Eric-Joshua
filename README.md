# NEU Library Visitor Log
### Rebuilt from original Next.js app — pure HTML/CSS/JS, no Firebase, no backend

---

## 📁 Files
```
index.html     → Home / landing page
terminal.html  → Visitor Check-in Terminal (multi-step flow)
admin.html     → Admin Dashboard (stats, charts, user management, settings)
data.js        → localStorage data layer + JSON import/export
```

---

## 🚀 Run
Open `index.html` in a browser. Works offline. No install needed.

**GitHub Pages:** Push all 4 files → Settings → Pages → `main` branch `/`

---

## 🔑 Admin Login
- Username: `admin`
- Password: `neu2024`

To change: edit `const CREDS = { admin: 'neu2024' }` in `admin.html`

---

## 📡 RFID
Connect any USB RFID scanner (keyboard emulation / HID mode).
Tap a card → scanned string auto-captured on the terminal page.
Manual fallback input also available.

---

## 💾 Data Sync Between Computers
1. Admin Dashboard → **Export JSON** → saves `.json` file
2. On another machine → **Import JSON** → loads all data

---

## 🗂 Firestore Schema (replicated in localStorage)
### users
`id, name, schoolId, rfidTagNumber, institutionalEmail, userType, affiliation, role, isBlocked`

### visit_logs
`id, userId, userName, userAffiliation, userType, rfidTagNumber, purposeOfVisit, schoolYear, semester, timestamp, createdAt`

### settings
`purposes[], schoolYear, semester, openingTime, closingTime`
