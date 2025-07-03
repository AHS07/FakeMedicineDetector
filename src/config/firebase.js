// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVHHHw47Sab9P-ujcJNag3VmZgvVxxkwA",
  authDomain: "fake-medicine-detector.firebaseapp.com",
  projectId: "fake-medicine-detector",
  storageBucket: "fake-medicine-detector.firebasestorage.app",
  messagingSenderId: "321664293704",
  appId: "1:321664293704:web:1168970800baf271d4b17d",
  measurementId: "G-LYT8MR18BP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export the Firebase instances
export { app, db, auth, storage };

// Make services available globally
window.db = db;
window.auth = auth;
window.storage = storage; 