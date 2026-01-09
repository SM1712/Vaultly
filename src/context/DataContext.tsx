import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { AppData } from '../services/CloudStorage';
import { CloudStorage, INITIAL_DATA } from '../services/CloudStorage';
import { toast } from 'sonner';

interface DataContextType {
    data: AppData;
    updateData: (newData: Partial<AppData>) => void;
    isLoading: boolean;
    isSaving: boolean;
    resetData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [data, setData] = useState<AppData>(INITIAL_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isError, setIsError] = useState(false);

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
        setIsError(false);

        // Real-time subscription
        const unsubscribe = CloudStorage.subscribeToMasterDoc(
            user.uid,
            (cloudData) => {
                if (cloudData) {
                    // Deep merge to ensure all fields exist
                    const mergedData = {
                        ...INITIAL_DATA,
                        ...cloudData,
                        settings: { ...INITIAL_DATA.settings, ...(cloudData.settings || {}) },
                        categories: { ...INITIAL_DATA.categories, ...(cloudData.categories || {}) }
                    };
                    setData(mergedData);
                } else {
                    // Start fresh if document truly doesn't exist
                    console.log("[DataContext] New user setup initialized");
                    setData(INITIAL_DATA);
                    // Only auto-save default data if we are SURE it's a new user (null returned), not an error
                    // But to be safe, we wait for user interaction or handle it explicitly.
                    // Let's safe-create it only if we have confirmed "null" (not error)
                    CloudStorage.saveMasterDoc(user.uid, INITIAL_DATA)
                        .catch(err => {
                            console.error("Failed to create initial doc:", err);
                            setIsError(true);
                        });
                }
                setIsLoading(false);
                setIsError(false); // Clear error on successful data rx
            },
            (error) => {
                console.error("[DataContext] Sync Error:", error);
                setIsError(true); // BLOCK SAVING
                toast.error("Error de sincronización. Cambios no se guardarán en la nube.");
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Save Function with Debounce
    const triggerSave = (newData: AppData) => {
        if (!user) return;

        // CRITICAL: Protection against overwriting cloud data with empty local data if load failed
        if (isError) {
            console.warn("[DataContext] Save blocked due to sync error state");
            toast.error("No se puede guardar: Error de conexión previo");
            return;
        }

        setIsSaving(true);
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await CloudStorage.saveMasterDoc(user.uid, newData);
                setIsSaving(false);
                console.log("Auto-saved to cloud");
            } catch (error) {
                console.error("Auto-save failed", error);
                setIsSaving(false);
                toast.error("Error al guardar cambios");
            }
        }, 2000); // 2 second debounce
    };

    const updateData = (updates: Partial<AppData>) => {
        setData(prev => {
            const next = { ...prev, ...updates };
            triggerSave(next);
            return next;
        });
    };

    const resetData = async () => {
        if (!user) return;
        try {
            setIsSaving(true);
            await CloudStorage.saveMasterDoc(user.uid, INITIAL_DATA);
            setData(INITIAL_DATA);
            toast.success("Mundo reinstalado desde cero.");
        } catch (error) {
            console.error("Failed to nuke data:", error);
            toast.error("Fallo en la detonación. Los datos persisten.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DataContext.Provider value={{ data, updateData, isLoading, isSaving, resetData }}>
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
