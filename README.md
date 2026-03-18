# NEU Library Visitor Log System
### No backend. No Firebase. Just HTML + CSS + JS.

Data is stored in **localStorage** and exported/imported as **JSON files**.

---

## 📁 Files

```
neu-library/
├── index.html   → Visitor Terminal (RFID tap + manual ID entry)
├── admin.html   → Admin Dashboard (stats, logs, user management, PDF & JSON export)
├── data.js      → Core data layer (localStorage + JSON import/export)
└── README.md    → This file
```

---

## 🚀 How to Run

**Option A — Open locally:**
Just open `index.html` in any browser. No server needed.

**Option B — GitHub Pages:**
1. Push all 4 files to a GitHub repo
2. Settings → Pages → Source: `main` branch, root `/`
3. Live at `https://yourusername.github.io/repo-name/`

---

## 🔑 Admin Login

Default credentials (change in `admin.html` line with `const CREDS`):
- **Username:** `admin`
- **Password:** `neu2024`

---

## 📡 RFID Scanner Setup

The terminal uses **keyboard emulation mode (HID)**:
1. Plug in any USB RFID scanner
2. Open `index.html` — the page auto-captures scanner output
3. Tap a card → scanner sends the card ID string → system looks it up

**Testing without hardware:** Type the RFID number in the manual input field.

---

## 🗄️ Data Structure

### Users (stored in localStorage as `neu_lib_users`)
```json
{
  "id": "user_001",
  "name": "Maria Santos",
  "email": "msantos@neu.edu.ph",
  "rfid_tag": "NEU010000",
  "college": "College of Engineering",
  "role": "visitor",
  "is_blocked": false
}
```

### Visit Logs (stored in localStorage as `neu_lib_logs`)
```json
{
  "id": "log_1700000000000_abc12",
  "user_id": "user_001",
  "user_name": "Maria Santos",
  "college": "College of Engineering",
  "purpose": "Reading Books",
  "timestamp": "2024-11-14T09:30:00.000Z"
}
```

**Purpose values:** `Reading Books` · `Research / Thesis` · `Use of Computer` · `Doing Assignments`

---

## 💾 JSON Import / Export

### Export
- Admin Dashboard → **↓ Export JSON** button
- Downloads a `.json` file with all users + visit logs

### Import
- Admin Dashboard → **↑ Import JSON** button
- Select a previously exported `.json` file
- Merges/overwrites data in localStorage

This is how data is **shared between computers** (e.g., export at end of day, import on another terminal).

---

## 📊 Admin Dashboard Features

- Filter stats: **Today / This Week / This Month / Custom Range**
- Purpose breakdown with visual progress bars
- Paginated visit log table (15 per page)
- Add / Edit users via modal form
- Block / Unblock visitor access
- **↓ PDF** — exports a formatted report with summary + full log table
- **↓ Export JSON** — full data backup
- **↑ Import JSON** — restore from backup

---

## 🔧 Customization

**Change admin password** — edit `admin.html`:
```js
const CREDS = { admin: 'your-new-password' };
```

**Add more admin accounts:**
```js
const CREDS = { admin: 'pass1', librarian: 'pass2' };
```

**Pre-register users** — edit the `seedIfEmpty()` function in `data.js`, or add users through the Admin Dashboard → User Management → **+ Add User**.

**Clear all demo data** — open browser DevTools → Application → Local Storage → delete `neu_lib_users` and `neu_lib_logs`, then refresh.
