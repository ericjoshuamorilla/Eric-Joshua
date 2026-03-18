# NEU Library Visitor Log System

A complete Firebase-powered library visitor management system for New Era University.

## 📁 Project Files

```
neu-library/
├── index.html          → Visitor Terminal (RFID + Google Sign-In)
├── admin.html          → Admin Dashboard (Stats + User Management + PDF Export)
├── firebase-config.js  → Firebase configuration (YOU MUST EDIT THIS)
└── firestore.rules     → Firestore security rules (deploy to Firebase)
```

---

## 🚀 Setup Instructions

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project" → Name it `neu-library`
3. Disable Google Analytics (optional) → Create project

### Step 2: Enable Authentication
1. In Firebase Console → **Authentication** → **Get started**
2. Click **Sign-in method** → Enable **Google**
3. Set Project support email → Save

### Step 3: Create Firestore Database
1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Production mode** → Select region (asia-southeast1 for PH)
3. Done

### Step 4: Get Firebase Config
1. Firebase Console → Project Settings (gear icon) → **Your apps**
2. Click **Web** icon `</>`
3. Register app as `neu-library-web`
4. Copy the `firebaseConfig` object

### Step 5: Edit firebase-config.js
Replace the placeholder values with your actual Firebase config:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "neu-library-xxxxx.firebaseapp.com",
  projectId: "neu-library-xxxxx",
  storageBucket: "neu-library-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Step 6: Deploy Firestore Security Rules
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init: `firebase init firestore`
4. Copy contents of `firestore.rules` to your `firestore.rules` file
5. Deploy: `firebase deploy --only firestore:rules`

### Step 7: Create the First Admin User
1. Open `index.html` in browser
2. Sign in with your NEU admin Google account
3. This creates your user document in Firestore
4. Go to Firebase Console → Firestore → `users` collection
5. Find your user document → Edit → Set `role` field to `"admin"`
6. Now you can access `admin.html`

### Step 8: Register Visitor RFID Cards
In Firestore, each user document needs:
```json
{
  "name": "Juan dela Cruz",
  "email": "jdelacruz@neu.edu.ph",
  "rfid_tag": "AB12345678",  // ← The RFID card's output string
  "college": "College of Engineering",
  "role": "visitor",
  "is_blocked": false
}
```

---

## 🗄️ Firestore Database Schema

### Collection: `users`
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Full name |
| `email` | string | NEU institutional email |
| `rfid_tag` | string | RFID card output string |
| `college` | string | College or Office |
| `role` | string | `"visitor"` or `"admin"` |
| `is_blocked` | boolean | Access control flag |
| `created_at` | timestamp | Registration date |

### Collection: `visit_logs`
| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Firebase Auth UID |
| `user_name` | string | Visitor name (denormalized) |
| `college` | string | College/Office (denormalized) |
| `purpose` | string | Purpose of visit |
| `timestamp` | timestamp | Check-in date & time |
| `date_str` | string | Human-readable date string |

**Purpose values:** `Reading Books`, `Research / Thesis`, `Use of Computer`, `Doing Assignments`

---

## 🔒 Authentication Rules

- Only `@neu.edu.ph` emails are allowed
- Gmail (`@gmail.com`) accounts are **blocked** by the `hd` (hosted domain) parameter
- Users with `role: "admin"` are redirected to `admin.html`
- Users with `is_blocked: true` cannot log visits

---

## 📡 RFID Scanner Setup

The system uses **keyboard emulation mode** (HID) — the scanner types the card ID as if it were a keyboard:

1. Connect USB RFID scanner to the terminal computer
2. The `index.html` page auto-captures the scanner output
3. Tap a card → scanner sends the card ID string + Enter key
4. System looks up the card ID in the `users` collection

**Testing without hardware:** Click the scan zone and manually type an RFID number + Enter

---

## 📊 Admin Dashboard Features

- **Statistics** filtered by Today / This Week / This Month / Custom Range
- **Purpose breakdown** with visual bar charts
- **Paginated visit logs** (15 per page)
- **User management** with Block/Unblock toggle
- **PDF export** with summary stats and full log table

---

## 🌐 Hosting on GitHub Pages

1. Push all files to a GitHub repository
2. Go to Settings → Pages → Source: `main` branch, root `/`
3. Your site will be live at `https://yourusername.github.io/repo-name/`

> ⚠️ Add your GitHub Pages domain to Firebase Console:
> Authentication → Settings → Authorized domains → Add domain

---

## 🛠️ Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript (no build tools needed)
- **Backend:** Firebase (Auth + Firestore)
- **PDF:** jsPDF + jsPDF-AutoTable (CDN)
- **Fonts:** Google Fonts (Bebas Neue, DM Sans, DM Mono)
