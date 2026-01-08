import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
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
        try {
            const fileRef = ref(storage, `users/${uid}/master.json`);
            const url = await getDownloadURL(fileRef);

            // Bypass browser cache to ensure freshness on load
            const response = await fetch(url, { cache: 'no-store' });

            if (!response.ok) {
                if (response.status === 404) return null; // File doesn't exist yet
                throw new Error(`Storage fetch failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data as AppData;
        } catch (error: any) {
            // Handle "Object not found" specifically from Firebase SDK
            if (error.code === 'storage/object-not-found') {
                return null;
            }
            console.error("Error fetching master doc from Storage:", error);
            // Return null to allow DataContext to initialize with default data locally
            // Ideally we should differentiate between "Network Error" (use cache) and "Not Found"
            // But for now, returning null initiates the "New/Offline" flow in DataContext
            return null;
        }
    },

    async saveMasterDoc(uid: string, data: AppData): Promise<void> {
        try {
            const fileRef = ref(storage, `users/${uid}/master.json`);
            const jsonString = JSON.stringify({
                ...data,
                lastUpdated: Date.now()
            });
            const blob = new Blob([jsonString], { type: 'application/json' });

            await uploadBytes(fileRef, blob);
            // console.log("Master Doc uploaded to Storage");
        } catch (error) {
            console.error("Error saving master doc to Storage:", error);
            throw error;
        }
    }
};
