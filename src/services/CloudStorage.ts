import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Transaction, Project, ScheduledTransaction, Preset, ProjectionsData } from '../types';

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
        goalPreferences?: {
            defaultCalculationMethod: 'dynamic' | 'static';
            defaultRecoveryStrategy: 'spread' | 'catch_up';
        };
    };
    goals: any[];
    funds: any[];
    credits: any[];
    projections: ProjectionsData;
    version: number;
    lastUpdated: number;
}

export type AppSettings = AppData['settings'];

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
    projections: {
        simulatedTransactions: [],
        categoryBudgets: {},
        simulatedCreditPayments: [],
        simulatedGoalContributions: [],
        simulatedFundTransfers: {},
        excludedIds: [],
        activeView: 'structure',
        toggles: {
            includeGlobalBalance: true,
            includeFundsInBalance: false,
            autoIncludeScheduled: true
        }
    },
    version: 3,
    lastUpdated: Date.now()
};

export const CloudStorage = {
    // Return a function to unsubscribe
    subscribeToMasterDoc(uid: string, onData: (data: AppData | null) => void, onError: (error: any) => void) {
        const docRef = doc(db, 'users', uid, 'data', 'master');

        console.log(`[CloudStorage] Subscribing to ${docRef.path}`);

        return onSnapshot(docRef,
            (snapshot) => {
                const source = snapshot.metadata.fromCache ? "local cache" : "server";
                console.log(`[CloudStorage] Data received from ${source}`);

                if (snapshot.exists()) {
                    onData(snapshot.data() as AppData);
                } else {
                    console.log("[CloudStorage] Document does not exist");
                    onData(null);
                }
            },
            (error) => {
                console.error("[CloudStorage] Snapshot Error:", error);

                if (error.code === 'permission-denied') {
                    console.error("CRITICAL: Permission Denied. Check Firestore Rules/Auth.");
                }

                onError(error);
            }
        );
    },

    // Kept for backward compatibility if needed, but subscribe is preferred
    async fetchMasterDoc(uid: string): Promise<AppData | null> {
        return new Promise((resolve, reject) => {
            const docRef = doc(db, 'users', uid, 'data', 'master');
            // One-time fetch wrapper around snapshot to leverage cache
            const unsub = onSnapshot(docRef,
                (snap) => {
                    unsub();
                    if (snap.exists()) resolve(snap.data() as AppData);
                    else resolve(null);
                },
                (err) => {
                    unsub();
                    reject(err);
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
            console.log("[CloudStorage] Master Doc Saved Successfully");
        } catch (error: any) {
            console.error("Error saving master doc:", error);
            if (error.code === 'permission-denied') {
                // Trigger global alert or handler?
                throw new Error("Permiso denegado al guardar. ¿Estás logueado?");
            }
            throw error;
        }
    },

    // --- Offline Capabilities ---
    saveLocalBackup(uid: string, data: AppData) {
        try {
            localStorage.setItem(`vaultly_data_${uid}`, JSON.stringify(data));
            console.log("[CloudStorage] Local Backup Saved");
        } catch (e) {
            console.error("Local Backup Failed (Quota?)", e);
        }
    },

    loadLocalBackup(uid: string): AppData | null {
        try {
            const raw = localStorage.getItem(`vaultly_data_${uid}`);
            if (!raw) return null;
            return JSON.parse(raw) as AppData;
        } catch (e) {
            console.error("Local Backup Corrupted", e);
            return null;
        }
    }
};
