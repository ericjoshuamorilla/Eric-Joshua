// ============================================================
//  auth.js  —  NEU Library · Shared Auth & RBAC Module
//  Google Sign-In only · @neu.edu.ph domain enforced
//  @gmail.com and all other domains are REJECTED
// ============================================================

// ── FIREBASE CONFIG ──────────────────────────────────────────
// Replace with your real Firebase project values.
// Firebase Console → Project Settings → Your apps → Web app
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ── AUTHORISED ADMIN EMAILS ──────────────────────────────────
// These two accounts have BOTH roles (Regular User + Admin).
// They choose which role to use after sign-in.
const ADMIN_EMAILS = [
  "jcesperanza@neu.edu.ph",
  "ericjoshua.morilla@neu.edu.ph"
];

// ── SESSION STORAGE KEYS ─────────────────────────────────────
const _SK  = 'neu_session';     // { uid, email, name, photo }
const _ARK = 'neu_active_role'; // 'admin' | 'user'

// ── FIREBASE SINGLETON ───────────────────────────────────────
let _auth, _provider;

function _initFirebase() {
  if (_auth) return _auth;
  try {
    const app = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp(FIREBASE_CONFIG);
    _auth = firebase.auth();
    _provider = new firebase.auth.GoogleAuthProvider();
    // hd hint restricts the account-picker UI to @neu.edu.ph accounts.
    // We also do a hard server-side check after sign-in (isNEUEmail).
    _provider.setCustomParameters({ hd: 'neu.edu.ph', prompt: 'select_account' });
    return _auth;
  } catch (e) {
    console.error('[Auth] Firebase init error:', e);
    return null;
  }
}

// ── PUBLIC Auth OBJECT ────────────────────────────────────────
const Auth = {

  // ── SIGN IN / OUT ──────────────────────────────────────────

  /** Open Google Sign-In popup. Returns Firebase UserCredential. */
  signIn() {
    const auth = _initFirebase();
    if (!auth) return Promise.reject(new Error('Firebase not ready'));
    return auth.signInWithPopup(_provider);
  },

  /** Sign out of Firebase and clear all session data. */
  async signOut() {
    const auth = _initFirebase();
    if (auth) await auth.signOut().catch(() => {});
    sessionStorage.removeItem(_SK);
    sessionStorage.removeItem(_ARK);
  },

  /** Returns the current Firebase User object, or null. */
  currentUser() {
    const auth = _initFirebase();
    return auth ? auth.currentUser : null;
  },

  /** Subscribe to Firebase auth-state changes. Returns unsubscribe fn. */
  onAuthStateChanged(cb) {
    const auth = _initFirebase();
    if (!auth) { setTimeout(() => cb(null), 0); return () => {}; }
    return auth.onAuthStateChanged(cb);
  },

  // ── DOMAIN VALIDATION ──────────────────────────────────────

  /**
   * Returns true ONLY for @neu.edu.ph addresses.
   * @gmail.com, @yahoo.com, etc. all return false.
   */
  isNEUEmail(email) {
    return (email || '').toLowerCase().trim().endsWith('@neu.edu.ph');
  },

  // ── ROLE CHECKS ────────────────────────────────────────────

  /** Returns true if the email is one of the two authorised admin accounts. */
  isAdmin(email) {
    return ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
  },

  // ── ACTIVE ROLE (chosen per session) ──────────────────────

  /** Returns 'admin', 'user', or null (not yet chosen). */
  getActiveRole() {
    return sessionStorage.getItem(_ARK) || null;
  },

  /** Set the role the user chose for this session. */
  setActiveRole(role) {
    sessionStorage.setItem(_ARK, role);
  },

  /** Clear role choice (e.g. when going back to role picker). */
  clearActiveRole() {
    sessionStorage.removeItem(_ARK);
  },

  // ── SESSION PERSISTENCE ────────────────────────────────────

  /** Persist minimal user info for use across pages. */
  saveSession(fbUser) {
    const s = {
      uid:   fbUser.uid,
      email: fbUser.email,
      name:  fbUser.displayName || fbUser.email.split('@')[0],
      photo: fbUser.photoURL || null
    };
    sessionStorage.setItem(_SK, JSON.stringify(s));
    return s;
  },

  /** Retrieve the saved session object, or null. */
  getSession() {
    try { return JSON.parse(sessionStorage.getItem(_SK)) || null; }
    catch { return null; }
  },

  // ── LOCAL DB SYNC ──────────────────────────────────────────

  /**
   * Create or update a user record in localStorage when they sign in with Google.
   * This keeps the DB in sync with real Google account data (name, photo).
   */
  ensureUserRecord(fbUser) {
    if (typeof DB === 'undefined') return null;
    const existing = DB.getUserByID(fbUser.uid);
    if (!existing) {
      DB.upsertUser({
        id:                 fbUser.uid,
        name:               fbUser.displayName || fbUser.email.split('@')[0],
        schoolId:           '',
        rfidTagNumber:      '',
        institutionalEmail: fbUser.email,
        userType:           'Faculty',
        affiliation:        '',
        role:               Auth.isAdmin(fbUser.email) ? 'admin' : 'visitor',
        isBlocked:          false,
        photoURL:           fbUser.photoURL || null
      });
    } else {
      // Keep display name and photo fresh
      let changed = false;
      if (fbUser.displayName && existing.name !== fbUser.displayName) {
        existing.name = fbUser.displayName; changed = true;
      }
      if (fbUser.photoURL && existing.photoURL !== fbUser.photoURL) {
        existing.photoURL = fbUser.photoURL; changed = true;
      }
      if (changed) DB.upsertUser(existing);
    }
    return DB.getUserByID(fbUser.uid);
  }
};
