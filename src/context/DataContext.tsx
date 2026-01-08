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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [data, setData] = useState<AppData>(INITIAL_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Timer ref for debounce
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial Load
    useEffect(() => {
        if (!user) {
            setData(INITIAL_DATA);
            setIsLoading(false);
            return;
        }

        const load = async () => {
            setIsLoading(true);
            try {
                const cloudData = await CloudStorage.fetchMasterDoc(user.uid);

                if (cloudData) {
                    // Deep merge to ensure all fields exist even if cloud doc is partial/old
                    const mergedData = {
                        ...INITIAL_DATA,
                        ...cloudData,
                        // Ensure nested objects are also merged if they exist
                        settings: { ...INITIAL_DATA.settings, ...(cloudData.settings || {}) },
                        categories: { ...INITIAL_DATA.categories, ...(cloudData.categories || {}) }
                    };
                    setData(mergedData);
                    console.log("[DataContext] Master Doc Loaded:", mergedData);
                } else {
                    // New user or empty doc
                    console.log("[DataContext] No master doc found, creating new...");
                    setData(INITIAL_DATA);
                    // Force save immediately to create the doc
                    await CloudStorage.saveMasterDoc(user.uid, INITIAL_DATA);
                }
            } catch (error) {
                console.error("Failed to load master doc, defaulting to empty", error);
                toast.warning("Modo Offline: Usando datos locales");
                setData(INITIAL_DATA);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [user]);

    // Save Function with Debounce
    const triggerSave = (newData: AppData) => {
        if (!user) return;

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

    return (
        <DataContext.Provider value={{ data, updateData, isLoading, isSaving }}>
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
