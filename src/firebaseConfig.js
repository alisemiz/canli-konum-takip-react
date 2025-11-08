// DOSYA: src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// 1. getAuth'u import et
import { getAuth } from "firebase/auth";

// .env dosyanızdan VITE_ ile başlayan değişkenleri çeker
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSender: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// 2. Hem 'db'yi (veritabanı) hem de 'auth'u (kimlik doğrulama) export et
export const db = getFirestore(app);
export const auth = getAuth(app);
