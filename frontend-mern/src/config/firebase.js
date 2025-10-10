import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAHkQ2fH78BdQGw-NetufYfGCohCpI4u64",
  authDomain: "dashboard-c3caf.firebaseapp.com",
  projectId: "dashboard-c3caf",
  storageBucket: "dashboard-c3caf.firebasestorage.app",
  messagingSenderId: "528433435525",
  appId: "1:528433435525:web:70564df33705ecd345eaec",
  measurementId: "G-80C0XVMKXL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  analytics
};
