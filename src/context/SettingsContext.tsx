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
        if (!user) {
            setLoading(false);
            return;
        }

        const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');

        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCurrencyState(data.currency || '$');
                setHasSeenOnboardingState(data.hasSeenOnboarding || false);
            } else {
                // Doc doesn't exist, try to migrate from local storage or set defaults
                const localCurrency = localStorage.getItem('vault_currency');
                const localOnboarding = localStorage.getItem('vault_has_seen_onboarding');

                // If we have local data, use it, otherwise valid defaults
                // Note: localOnboarding string 'true' need parsing
                const initialCurrency = localCurrency ? JSON.parse(localCurrency) : '$';
                const initialOnboarding = localOnboarding ? JSON.parse(localOnboarding) : false;

                // Create the doc
                setDoc(settingsRef, {
                    currency: initialCurrency,
                    hasSeenOnboarding: initialOnboarding
                }).catch(err => console.error("Error creating settings doc", err));

                // Optimistic update
                setCurrencyState(initialCurrency);
                setHasSeenOnboardingState(initialOnboarding);
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
        updateDoc(settingsRef, { currency: newCurrency }).catch(err => {
            // Fallback if doc doesn't exist (rare edge case if onSnapshot hasn't fired creation yet)
            setDoc(settingsRef, { currency: newCurrency }, { merge: true });
        });
        setCurrencyState(newCurrency); // Optimistic
    };

    const setHasSeenOnboarding = (seen: boolean) => {
        if (!user) return;
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
        updateDoc(settingsRef, { hasSeenOnboarding: seen }).catch(err => {
            setDoc(settingsRef, { hasSeenOnboarding: seen }, { merge: true });
        });
        setHasSeenOnboardingState(seen);
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
