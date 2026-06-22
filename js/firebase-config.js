/* ============================================================
   Kamir Group — Firebase web configuration
   ------------------------------------------------------------
   These values are NOT secrets. Firebase web API keys are meant
   to be embedded in client code; access is controlled by the
   Firestore security rules (firestore.rules) and the Google Auth
   provider settings, NOT by hiding this key.

   HOW TO FILL THIS IN:
   1. Firebase console -> Project settings (gear icon) -> "Your apps"
   2. Add / select a Web app (</>), then copy the firebaseConfig object
   3. Paste the values below, replacing every "REPLACE_..." string.
   ============================================================ */
window.KAMIR_FIREBASE_CONFIG = {
  apiKey: "REPLACE_API_KEY",
  authDomain: "REPLACE_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_PROJECT_ID",
  storageBucket: "REPLACE_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_SENDER_ID",
  appId: "REPLACE_APP_ID"
};
