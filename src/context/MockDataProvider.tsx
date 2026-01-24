import { useState, type ReactNode } from 'react';
import { DataContext } from './DataContext';
import { INITIAL_DATA, type AppData } from '../services/CloudStorage';

export const MockDataProvider = ({ children }: { children: ReactNode }) => {
    // Start with clean initial data
    const [data, setData] = useState<AppData>(INITIAL_DATA);

    // Always report as loaded and not saving
    const isLoading = false;
    const isSaving = false;
    const isOfflineMode = false;

    const updateData = (updates: Partial<AppData>) => {
        setData(prev => ({
            ...prev,
            ...updates
        }));
    };

    const resetData = async () => {
        setData(INITIAL_DATA);
    };

    return (
        <DataContext.Provider value={{
            data,
            updateData,
            isLoading,
            isSaving,
            isOfflineMode,
            resetData
        }}>
            {children}
        </DataContext.Provider>
    );
};
