import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAqUzObMbnenCmuXeTan2V87YjAQ4HQ30s",
    authDomain: "vaultly-ce7e1.firebaseapp.com",
    projectId: "vaultly-ce7e1",
    storageBucket: "vaultly-ce7e1.firebasestorage.app",
    messagingSenderId: "605463352120",
    appId: "1:605463352120:web:c89758482492ee935b67cd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
