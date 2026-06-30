import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAG5OBQSRWDIZafzWjHdAxFUuqf3FAsF8M",
  authDomain: "adultos-43e23.firebaseapp.com",
  projectId: "adultos-43e23",
  storageBucket: "adultos-43e23.firebasestorage.app",
  messagingSenderId: "49140549225",
  appId: "1:49140549225:web:f75fa39b3579ec5d7044f8"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {}, "ai-studio-0ba6ccd5-6e72-4b98-905b-d1ae26b07d4f");
export const auth = getAuth(app);
