import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transaction, Project, ScheduledTransaction, Preset } from '../types';

export interface AppData {
    transactions: Transaction[];
    categories: {
        income: string[];
        expense: string[];
    };
    projects: Project[];
    scheduledTransactions: ScheduledTransaction[];
    presets: Preset[];
    settings: {
        currency: string;
        theme: string;
        hasSeenOnboarding: boolean;
    };
    goals: any[];
    funds: any[];
    credits: any[];
    version: number;
    lastUpdated: number;
}

export const INITIAL_DATA: AppData = {
    transactions: [],
    categories: {
        income: ['Salario', 'Freelance', 'Inversiones', 'Regalos', 'Ventas', 'Otros'],
        expense: ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Vivienda', 'Salud', 'Educación', 'Otros']
    },
    projects: [],
    scheduledTransactions: [],
    presets: [],
    settings: {
        currency: '$',
        theme: 'classic',
        hasSeenOnboarding: false
    },
    goals: [],
    funds: [],
    credits: [],
    version: 2,
    lastUpdated: Date.now()
};

export const CloudStorage = {
    async fetchMasterDoc(uid: string): Promise<AppData | null> {
        return new Promise((resolve) => {
            const docRef = doc(db, 'users', uid, 'data', 'master');

            // onSnapshot gives us the most robust offline support.
            // It fires immediately with cache if available, or waits for server.
            // If offline and no cache, it works too (fires 'doesn't exist').
            const unsubscribe = onSnapshot(docRef,
                (snapshot) => {
                    unsubscribe(); // We only need the first value
                    if (snapshot.exists()) {
                        resolve(snapshot.data() as AppData);
                    } else {
                        resolve(null);
                    }
                },
                (error) => {
                    console.warn("Snapshot error (likely offline with no cache):", error);
                    unsubscribe();
                    resolve(null); // Fallback to empty/new data on critical failure
                }
            );
        });
    },

    async saveMasterDoc(uid: string, data: AppData): Promise<void> {
        try {
            const docRef = doc(db, 'users', uid, 'data', 'master');
            await setDoc(docRef, {
                ...data,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error("Error saving master doc:", error);
            throw error;
        }
    }
};
