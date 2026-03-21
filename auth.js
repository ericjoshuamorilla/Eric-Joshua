// ================================================================
//  auth.js  —  NEU Library  |  Firebase Auth + Google Sign-In
//  No password · No typing · Click → Google handles everything
//  Only @neu.edu.ph accounts accepted · @gmail.com rejected
// ================================================================
//
//  ⚠️  ONE-TIME SETUP — fill in your Firebase project values below.
//
//  How to get these values:
//  1. Go to https://console.firebase.google.com
//  2. Create a project (or open an existing one)
//  3. Click the gear icon → Project Settings → Your apps
//  4. Click the </> Web icon → register the app → copy the config
//  5. In Firebase Console → Authentication → Sign-in method → enable Google
//  6. In Firebase Console → Authentication → Settings → Authorized domains
//     → Add your GitHub Pages domain  (e.g. yourusername.github.io)
//
// ================================================================

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAHxgfWkXhOl-cFXrqvQAWC_SLkn_cJGS8",
  authDomain:        "neulib-fc97e.firebaseapp.com",
  projectId:         "neulib-fc97e",
  storageBucket:     "neulib-fc97e.firebasestorage.app",
  messagingSenderId: "992375306505",
  appId:             "1:992375306505:web:ed6f114890a981c09ffbd8"
};

// ── Authorised admin accounts (both roles: user + admin) ─────
const ADMIN_EMAILS = [
  "jcesperanza@neu.edu.ph",
  "ericjoshua.morilla@neu.edu.ph"
];

// ── Session keys ─────────────────────────────────────────────
const _SK  = "neu_session";      // { uid, email, name, photo }
const _ARK = "neu_active_role";  // "admin" | "user"

// ── Firebase singleton ───────────────────────────────────────
let _fbAuth = null;
let _fbProvider = null;

function _initFirebase() {
  if (_fbAuth) return _fbAuth;
  try {
    const app = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp(FIREBASE_CONFIG);
    _fbAuth = firebase.auth();
    _fbProvider = new firebase.auth.GoogleAuthProvider();
    // hd hint nudges Google's account picker to show @neu.edu.ph accounts first.
    // We still do a hard domain check after sign-in.
    _fbProvider.setCustomParameters({ hd: "neu.edu.ph", prompt: "select_account" });
    return _fbAuth;
  } catch (e) {
    console.error("[Auth] Firebase init error:", e);
    return null;
  }
}

// ── Public Auth object ────────────────────────────────────────
const Auth = {

  // ── Domain / role checks ────────────────────────────────────

  /** Returns true ONLY for @neu.edu.ph — @gmail.com → false */
  isNEUEmail(email) {
    return (email || "").toLowerCase().trim().endsWith("@neu.edu.ph");
  },

  /** Returns true if email is one of the two authorised admin accounts */
  isAdmin(email) {
    return ADMIN_EMAILS.includes((email || "").toLowerCase().trim());
  },

  // ── Firebase auth ───────────────────────────────────────────

  /** Open Google Sign-In popup. Returns Firebase UserCredential. */
  signIn() {
    const auth = _initFirebase();
    if (!auth) return Promise.reject(new Error("Firebase not ready. Check your config in auth.js."));
    return auth.signInWithPopup(_fbProvider);
  },

  /** Get redirect result after signInWithRedirect completes. */
  getRedirectResult() {
    const auth = _initFirebase();
    if (!auth) return Promise.resolve(null);
    return auth.getRedirectResult();
  },

  /** Sign out of Firebase and clear local session. */
  async signOut() {
    const auth = _initFirebase();
    if (auth) await auth.signOut().catch(() => {});
    localStorage.removeItem(_SK);
    localStorage.removeItem(_ARK);
  },

  /** Returns the current Firebase User, or null. */
  currentUser() {
    const auth = _initFirebase();
    return auth ? auth.currentUser : null;
  },

  /** Subscribe to auth state changes. Returns unsubscribe fn. */
  onAuthStateChanged(cb) {
    const auth = _initFirebase();
    if (!auth) { setTimeout(() => cb(null), 0); return () => {}; }
    return auth.onAuthStateChanged(cb);
  },

  // ── Session helpers ─────────────────────────────────────────

  saveSession(fbUser) {
    const s = {
      uid:   fbUser.uid,
      email: fbUser.email,
      name:  fbUser.displayName || fbUser.email.split("@")[0],
      photo: fbUser.photoURL || null
    };
    localStorage.setItem(_SK, JSON.stringify(s));
    return s;
  },

  getSession() {
    try { return JSON.parse(localStorage.getItem(_SK)) || null; }
    catch { return null; }
  },

  // ── Active role ─────────────────────────────────────────────

  getActiveRole()   { return localStorage.getItem(_ARK) || null; },
  setActiveRole(r)  { localStorage.setItem(_ARK, r); },
  clearActiveRole() { localStorage.removeItem(_ARK); },

  // ── Local DB sync ───────────────────────────────────────────

  /** Ensure a localStorage user record exists for this Google account. */
  ensureUserRecord(fbUser) {
    if (typeof DB === "undefined") return null;
    const existing = DB.getUserByID(fbUser.uid);
    if (!existing) {
      DB.upsertUser({
        id:                 fbUser.uid,
        name:               fbUser.displayName || fbUser.email.split("@")[0],
        schoolId:           "",
        rfidTagNumber:      "",
        institutionalEmail: fbUser.email,
        userType:           "Faculty",
        affiliation:        "",
        role:               Auth.isAdmin(fbUser.email) ? "admin" : "visitor",
        isBlocked:          false,
        photoURL:           fbUser.photoURL || null
      });
    } else {
      let changed = false;
      if (fbUser.displayName && existing.name     !== fbUser.displayName) { existing.name     = fbUser.displayName; changed = true; }
      if (fbUser.photoURL    && existing.photoURL !== fbUser.photoURL)    { existing.photoURL = fbUser.photoURL;    changed = true; }
      if (changed) DB.upsertUser(existing);
    }
    return DB.getUserByID(fbUser.uid);
  }
};
