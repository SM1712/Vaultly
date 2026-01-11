import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { AppData } from '../services/CloudStorage';
import { CloudStorage, INITIAL_DATA } from '../services/CloudStorage';
import { toast } from 'sonner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface DataContextType {
    data: AppData;
    updateData: (newData: Partial<AppData>) => void;
    isLoading: boolean;
    isSaving: boolean;
    isOfflineMode: boolean; // Computed: !isOnline or needsSync
    resetData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);


export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const isOnline = useNetworkStatus();

    const [data, setData] = useState<AppData>(INITIAL_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // "Dirty" flag: True if we have local changes not yet in cloud
    const [needsSync, setNeedsSync] = useState(false);

    // Timer ref for debounce
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial Load & Realtime Sync
    useEffect(() => {
        if (!user) {
            setData(INITIAL_DATA);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // 1. Try to load local backup immediately for speed (Optimistic Load)
        const localBackup = CloudStorage.loadLocalBackup(user.uid);
        if (localBackup) {
            console.log("[DataContext] Loaded local backup (Optimistic)");
            setData(localBackup);
            // Don't turn off loading yet, wait for cloud confirmation or timeout
        }

        // 2. Subscribe to Cloud
        const unsubscribe = CloudStorage.subscribeToMasterDoc(
            user.uid,
            (cloudData) => {
                if (cloudData) {
                    // Deep merge
                    const mergedData = {
                        ...INITIAL_DATA,
                        ...cloudData,
                        settings: { ...INITIAL_DATA.settings, ...(cloudData.settings || {}) },
                        categories: { ...INITIAL_DATA.categories, ...(cloudData.categories || {}) }
                    };

                    // Conflict Resolution: (Simple for now: Cloud wins if newer)
                    // TODO: Improve this if needed. For now, we trust cloud as source of truth on connect.
                    setData(mergedData);

                    // Also update local backup to match cloud
                    CloudStorage.saveLocalBackup(user.uid, mergedData);
                } else {
                    // Start fresh or use local if it was a new user
                    if (!localBackup) {
                        console.log("[DataContext] New user setup");
                        setData(INITIAL_DATA);
                        CloudStorage.saveMasterDoc(user.uid, INITIAL_DATA).catch(console.error);
                    }
                }
                setIsLoading(false);
                setNeedsSync(false); // We are in sync
            },
            (error) => {
                console.error("[DataContext] Sync/Connection Error:", error);
                // If we have local backup, we are fine, just offline/error mode
                if (localBackup) {
                    toast("Modo Offline: Usando datos locales");
                } else {
                    toast.error("Error de conexión y sin datos locales.");
                }
                setIsLoading(false);
                // We keep needsSync state as is, or assume we might need sync later
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Save Function with Debounce & Offline Support
    const triggerSave = (newData: AppData) => {
        if (!user) return;

        // 1. ALWAYS Save Local Immediately
        CloudStorage.saveLocalBackup(user.uid, newData);

        setIsSaving(true);
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            if (!navigator.onLine) {
                console.log("[DataContext] Offline. Marked for sync.");
                setNeedsSync(true);
                setIsSaving(false);
                return;
            }

            try {
                await CloudStorage.saveMasterDoc(user.uid, newData);
                setIsSaving(false);
                setNeedsSync(false);
                console.log("Auto-saved to cloud");
            } catch (error) {
                console.error("Auto-save failed (Network?)", error);
                setNeedsSync(true); // Mark as dirty
                setIsSaving(false);
                // Silent fail/retry later is better than error spam
            }
        }, 2000); // 2 second debounce
    };

    // Auto-Sync when coming back Online
    useEffect(() => {
        if (isOnline && needsSync && user) {
            console.log("[DataContext] Back Online! Syncing pending changes...");
            toast.info("Conexión restaurada. Sincronizando...");
            triggerSave(data); // Try saving current state to cloud
        }
    }, [isOnline, needsSync, user, data]);

    const updateData = (updates: Partial<AppData>) => {
        setData(prev => {
            const next = { ...prev, ...updates };
            // Update state immediately
            triggerSave(next);
            return next;
        });
    };

    const resetData = async () => {
        if (!user) return;
        try {
            setIsSaving(true);
            await CloudStorage.saveMasterDoc(user.uid, INITIAL_DATA);
            CloudStorage.saveLocalBackup(user.uid, INITIAL_DATA);
            setData(INITIAL_DATA);
            toast.success("Mundo reinstalado desde cero.");
        } catch (error) {
            console.error("Failed to nuke data:", error);
            toast.error("Fallo en la detonación.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DataContext.Provider value={{
            data,
            updateData,
            isLoading,
            isSaving,
            isOfflineMode: needsSync || !isOnline,
            resetData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
