import { createContext, useContext, type ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

interface SettingsContextType {
    currency: string;
    setCurrency: (currency: string) => void;
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (seen: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [currency, setCurrency] = useLocalStorage<string>('vault_currency', '$');
    const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage<boolean>('vault_has_seen_onboarding', false);

    return (
        <SettingsContext.Provider value={{ currency, setCurrency, hasSeenOnboarding, setHasSeenOnboarding }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
