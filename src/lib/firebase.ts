import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAqUzObMbnenCmuXeTan2V87YjAQ4HQ30s",
    authDomain: "vaultly-ce7e1.firebaseapp.com",
    projectId: "vaultly-ce7e1",
    storageBucket: "vaultly-ce7e1.firebasestorage.app",
    messagingSenderId: "",
    appId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with robust persistence settings
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});
