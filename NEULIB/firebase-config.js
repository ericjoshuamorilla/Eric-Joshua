// firebase-config.js
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider - restricted to NEU domain
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: 'neu.edu.ph' // Restrict to NEU institutional domain
});
