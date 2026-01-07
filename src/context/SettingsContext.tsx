import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

interface SettingsContextType {
    currency: string;
    setCurrency: (currency: string) => void;
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (seen: boolean) => void;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [currency, setCurrencyState] = useState('$');
    const [hasSeenOnboarding, setHasSeenOnboardingState] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Immediate Local Check (prevents flash)
        const localOnboarding = localStorage.getItem('vault_has_seen_onboarding');
        const localCurrency = localStorage.getItem('vault_currency');

        if (localOnboarding) {
            setHasSeenOnboardingState(JSON.parse(localOnboarding));
        }
        if (localCurrency) {
            setCurrencyState(JSON.parse(localCurrency));
        }

        if (!user) {
            setLoading(false);
            return;
        }

        // 2. Sync with Firebase
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');

        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Update state
                if (data.currency) {
                    setCurrencyState(data.currency);
                    localStorage.setItem('vault_currency', JSON.stringify(data.currency));
                }

                // Only update from DB if true, to avoid overwriting a local 'true' with a DB 'false' during sync gaps
                if (data.hasSeenOnboarding === true) {
                    setHasSeenOnboardingState(true);
                    localStorage.setItem('vault_has_seen_onboarding', 'true');
                }
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching settings", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const setCurrency = (newCurrency: string) => {
        if (!user) return;
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
        updateDoc(settingsRef, { currency: newCurrency }).catch(() => {
            // Fallback if doc doesn't exist (rare edge case if onSnapshot hasn't fired creation yet)
            setDoc(settingsRef, { currency: newCurrency }, { merge: true });
        });
        setCurrencyState(newCurrency); // Optimistic
    };

    const setHasSeenOnboarding = async (seen: boolean) => {
        // 1. Instant Local Update
        setHasSeenOnboardingState(seen);
        localStorage.setItem('vault_has_seen_onboarding', JSON.stringify(seen));

        if (!user) return;

        // 2. Background Remote Update
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
        try {
            await setDoc(settingsRef, { hasSeenOnboarding: seen }, { merge: true });
        } catch (error) {
            console.error("Failed to sync onboarding to DB", error);
        }
    };

    return (
        <SettingsContext.Provider value={{ currency, setCurrency, hasSeenOnboarding, setHasSeenOnboarding, loading }}>
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
