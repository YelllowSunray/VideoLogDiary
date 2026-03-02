import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyA_5A21hkxZ352U0ct_KQpEht-ajen7Erc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "videodiaryapp-29d8f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "videodiaryapp-29d8f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "videodiaryapp-29d8f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "140940682941",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:140940682941:web:9adee3a5af1a1e40c0b9d4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-FSYHC1B48C",
};

let app: FirebaseApp;

function getApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase should only be used on the client");
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export const auth = () => getAuth(getApp());
export const db = () => getFirestore(getApp());
export const storage = () => getStorage(getApp());
