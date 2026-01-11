import { createContext, useContext, type ReactNode } from 'react';
import { useData } from './DataContext';
import type { AppSettings } from '../services/CloudStorage';

interface SettingsContextType {
    currency: string;
    setCurrency: (currency: string) => void;
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (seen: boolean) => void;
    loading: boolean;
    goalPreferences: Required<NonNullable<AppSettings['goalPreferences']>>;
    setGoalPreferences: (prefs: AppSettings['goalPreferences']) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { data, updateData, isLoading } = useData();
    // Defensive coding: Ensure settings object exists
    const settings = data.settings || { currency: '$', hasSeenOnboarding: false, theme: 'classic' };

    // Derived state for easier consumption
    const currency = settings.currency || '$';
    const hasSeenOnboarding = settings.hasSeenOnboarding || false;

    // Default Goal Preferences
    const goalPreferences = {
        defaultCalculationMethod: settings.goalPreferences?.defaultCalculationMethod || 'dynamic',
        defaultRecoveryStrategy: settings.goalPreferences?.defaultRecoveryStrategy || 'spread'
    };

    const setCurrency = (newCurrency: string) => {
        updateData({
            settings: { ...settings, currency: newCurrency }
        });
    };

    const setHasSeenOnboarding = (seen: boolean) => {
        updateData({
            settings: { ...settings, hasSeenOnboarding: seen }
        });
        localStorage.setItem('vault_has_seen_onboarding', JSON.stringify(seen));
    };

    const setGoalPreferences = (prefs: AppSettings['goalPreferences']) => {
        updateData({
            settings: {
                ...settings,
                goalPreferences: { ...goalPreferences, ...prefs }
            }
        });
    };

    return (
        <SettingsContext.Provider value={{
            currency,
            setCurrency,
            hasSeenOnboarding,
            setHasSeenOnboarding,
            loading: isLoading,
            goalPreferences,
            setGoalPreferences
        }}>
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
