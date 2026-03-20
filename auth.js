// =============================================================
//  auth.js  —  NEU Library · Auth & RBAC
//  Uses Google Identity Services (GSI) — one-click Google Sign-In
//  No Firebase · No password · No email typing · Works on GitHub Pages
//
//  SETUP (one-time, 5 minutes):
//  1. Go to https://console.cloud.google.com
//  2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
//  3. Application type: Web application
//  4. Authorized JavaScript origins: https://YOUR-USERNAME.github.io
//  5. Paste the Client ID below (replace YOUR_GOOGLE_CLIENT_ID)
// =============================================================

const GOOGLE_CLIENT_ID = '893098672005-scu9icgbapne34q51j0o8029mkfbbfvo.apps.googleusercontent.com';
// ── ADMIN EMAILS ─────────────────────────────────────────────
// Both hold BOTH roles. After sign-in they choose which to use.
const ADMIN_EMAILS = [
  'jcesperanza@neu.edu.ph',
  'ericjoshua.morilla@neu.edu.ph'
];

// ── SESSION KEYS ─────────────────────────────────────────────
const _SK  = 'neu_session';     // { email, name, photo, sub }
const _ARK = 'neu_active_role'; // 'admin' | 'user'

// ── PUBLIC Auth OBJECT ────────────────────────────────────────
const Auth = {

  // ── DOMAIN & ROLE CHECKS ─────────────────────────────────
  isNEUEmail(email) {
    return (email || '').toLowerCase().trim().endsWith('@neu.edu.ph');
  },
  isAdmin(email) {
    return ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
  },

  // ── SESSION ───────────────────────────────────────────────
  saveSession(data) {
    sessionStorage.setItem(_SK, JSON.stringify(data));
  },
  getSession() {
    try { return JSON.parse(sessionStorage.getItem(_SK)) || null; }
    catch { return null; }
  },
  clearSession() {
    sessionStorage.removeItem(_SK);
    sessionStorage.removeItem(_ARK);
  },

  // ── ACTIVE ROLE ───────────────────────────────────────────
  getActiveRole()  { return sessionStorage.getItem(_ARK) || null; },
  setActiveRole(r) { sessionStorage.setItem(_ARK, r); },
  clearActiveRole(){ sessionStorage.removeItem(_ARK); },

  // ── SIGN OUT ──────────────────────────────────────────────
  signOut() {
    // Revoke Google credential so the account picker shows next time
    const sess = this.getSession();
    if (sess?.sub && window.google?.accounts?.id) {
      try { google.accounts.id.revoke(sess.sub, () => {}); } catch(_) {}
    }
    this.clearSession();
  },

  // ── PROCESS GSI JWT CREDENTIAL ───────────────────────────
  /**
   * Called by the GSI callback after user clicks the Google button.
   * Decodes the JWT, validates @neu.edu.ph domain, saves session.
   * Returns the session object or throws a user-friendly Error.
   */
  processCredential(credentialResponse) {
    const token = credentialResponse.credential;
    // Decode JWT payload (base64url middle section) — no signature verify needed
    // because the token came directly from Google's own button callback
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    const email = (payload.email || '').toLowerCase().trim();
    const name  = payload.name || email.split('@')[0];
    const photo = payload.picture || null;
    const sub   = payload.sub; // Google user ID

    // ── Domain guard ────────────────────────────────────────
    if (!this.isNEUEmail(email)) {
      throw new Error(
        '@gmail.com and personal accounts are not allowed.\nUse your @neu.edu.ph institutional account.'
      );
    }

    const session = { email, name, photo, sub };
    this.saveSession(session);
    this.ensureUserRecord(session);
    return session;
  },

  // ── LOCAL DB SYNC ─────────────────────────────────────────
  ensureUserRecord(session) {
    if (typeof DB === 'undefined') return;
    const id = 'gsi_' + session.sub;
    const existing = DB.getUserByID(id);
    if (!existing) {
      DB.upsertUser({
        id,
        name:               session.name,
        schoolId:           '',
        rfidTagNumber:      '',
        institutionalEmail: session.email,
        userType:           'Faculty',
        affiliation:        '',
        role:               Auth.isAdmin(session.email) ? 'admin' : 'visitor',
        isBlocked:          false,
        photoURL:           session.photo
      });
    } else {
      // Keep name and photo fresh
      let changed = false;
      if (session.name  && existing.name     !== session.name)  { existing.name     = session.name;  changed = true; }
      if (session.photo && existing.photoURL !== session.photo) { existing.photoURL = session.photo; changed = true; }
      if (changed) DB.upsertUser(existing);
    }
    return DB.getUserByID(id);
  },

  getSessionUser() {
    const s = this.getSession();
    if (!s) return null;
    return DB.getUserByID('gsi_' + s.sub) || null;
  },

  // ── GSI INITIALISATION ────────────────────────────────────
  /**
   * Initialises the Google Identity Services library.
   * @param {function} callback  Called with (session, error) after sign-in attempt.
   * @param {boolean}  autoSelect  Show One Tap / auto-select if a session exists.
   */
  initGSI(callback, autoSelect = false) {
    if (!window.google?.accounts?.id) {
      console.warn('[Auth] GSI library not loaded yet.');
      return;
    }

    google.accounts.id.initialize({
      client_id:   GOOGLE_CLIENT_ID,
      callback:    (credResp) => {
        try {
          const sess = Auth.processCredential(credResp);
          callback(sess, null);
        } catch (err) {
          callback(null, err);
        }
      },
      auto_select: autoSelect,
      // Restrict account chooser to @neu.edu.ph — users still see all
      // their Google accounts but the hint nudges them to the right one
      hosted_domain: 'neu.edu.ph',
    });

    // Prompt One Tap if autoSelect is requested
    if (autoSelect) {
      google.accounts.id.prompt();
    }
  },

  /**
   * Render a styled Google Sign-In button into a container element.
   * @param {string|HTMLElement} container  CSS selector or DOM element
   * @param {'large'|'medium'|'small'} size
   */
  renderButton(container, size = 'large') {
    if (!window.google?.accounts?.id) return;
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!el) return;
    google.accounts.id.renderButton(el, {
      type:  'standard',
      theme: 'outline',
      size,
      text:  'signin_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: el.offsetWidth || 320,
    });
  }
};
