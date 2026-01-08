import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transaction } from '../types';

export interface AppData {
    transactions: Transaction[];
    categories: {
        income: string[];
        expense: string[];
    };
    goals: any[]; // Define specific type if available
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
    goals: [],
    funds: [],
    credits: [],
    version: 1,
    lastUpdated: Date.now()
};

export const CloudStorage = {
    async fetchMasterDoc(uid: string): Promise<AppData | null> {
        try {
            const docRef = doc(db, 'users', uid, 'data', 'master');
            const snapshot = await getDoc(docRef);

            if (snapshot.exists()) {
                return snapshot.data() as AppData;
            }
            return null;
        } catch (error) {
            console.error("Error fetching master doc:", error);
            throw error;
        }
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
