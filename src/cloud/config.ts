/// <reference types="vite/client" />
// Safety interlock: enable ONLY after publishing and testing database.rules.json.
// Public build flag, never a secret. Defaults to no SDK/network access; see FIREBASE.md.
export const FIREBASE_SYNC_ENABLED = import.meta.env?.VITE_FIREBASE_SYNC_ENABLED === 'true';

// The supplied databaseURL was wrapped as '@url:`https://…`'.
// This is the explicitly extracted URL, not a repaired/accepted wrapper token.
export const firebaseConfig = {
  apiKey: 'AIzaSyC6RzHAc1eSogAdfY6rajsSdI8Qq7aA3io',
  authDomain: 'percival2-4650c.firebaseapp.com',
  databaseURL: 'https://percival2-4650c-default-rtdb.firebaseio.com',
  projectId: 'percival2-4650c',
  storageBucket: 'percival2-4650c.firebasestorage.app',
  messagingSenderId: '108827787475',
  appId: '1:108827787475:web:aa0cbb0327820f8993d426',
};
const databaseURL = new URL(firebaseConfig.databaseURL);
if (databaseURL.protocol !== 'https:' || databaseURL.hostname !== `${firebaseConfig.projectId}-default-rtdb.firebaseio.com` || databaseURL.pathname !== '/' || databaseURL.search || databaseURL.hash || databaseURL.username || databaseURL.password) {
  throw new Error('URL pública do Firebase inválida.');
}
