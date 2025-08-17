// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "shiftflow-b9vy2",
  appId: "1:105000499276:web:5f7ffc2aa825b9b2e59ce9",
  storageBucket: "shiftflow-b9vy2.firebasestorage.app",
  apiKey: "AIzaSyAqzCNkNYZ2t461fGor4Jas3uZEogpnZTk",
  authDomain: "shiftflow-b9vy2.firebaseapp.com",
  messagingSenderId: "105000499276",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
