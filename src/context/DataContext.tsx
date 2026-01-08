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

                // Artificial delay to let user see "Checking cloud..."
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (cloudData) {
                    setData(cloudData);
                    console.log("[DataContext] Master Doc Loaded:", cloudData);
                } else {
                    // New user or empty doc: Save initial data to create file
                    console.log("[DataContext] No master doc found, creating new...");
                    await CloudStorage.saveMasterDoc(user.uid, INITIAL_DATA);
                    setData(INITIAL_DATA);
                }
            } catch (error) {
                console.error("Failed to load master doc", error);
                toast.error("Error al cargar datos de la nube");
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
