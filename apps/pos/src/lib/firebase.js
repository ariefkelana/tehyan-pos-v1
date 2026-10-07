import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJWcsBpWWY0MrxTpG0kNoiOC5L40nltxM",
  authDomain: "tehyan-depok.firebaseapp.com",
  projectId: "tehyan-depok",
  storageBucket: "tehyan-depok.firebasestorage.app",
  messagingSenderId: "712782568316",
  appId: "1:712782568316:web:a82799e4210a31647a62f9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
