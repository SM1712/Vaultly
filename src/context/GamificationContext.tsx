import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useData } from './DataContext';
import type { UserProfile, Achievement } from '../types';
import { ACHIEVEMENTS, calculateNextLevelXP, getTitleForLevel, TITLES } from './GamificationConstants';
import { useLocalNotifications } from '../hooks/useLocalNotifications';
import { toast } from 'sonner';

interface GamificationContextType {
    profile: UserProfile;
    addXp: (amount: number) => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    checkAchievement: (triggerId: string, data?: any) => void;
    recalculateLevel: () => void;
    achievements: Achievement[];
    levelUpModal: {
        isOpen: boolean;
        level: number;
        title: string;
        close: () => void;
    };
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const STORAGE_KEY = 'vaultly_user_profile';

const INITIAL_PROFILE: UserProfile = {
    level: 1,
    currentXP: 0,
    nextLevelXP: calculateNextLevelXP(1),
    currentTitle: TITLES[0].label,
    unlockedAchievements: [],
    stats: {
        totalTransactions: 0,
        perfectBudgetMonths: 0,
        savingsStreak: 0,
    },
};

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
    const { data: appData } = useData();
    const { notifyAchievement, notifyLevelUp } = useLocalNotifications();

    // Lazy initialization to prevent race conditions (fixes "Level 1 reset" bug)
    const [profile, setProfile] = useState<UserProfile>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return { ...INITIAL_PROFILE, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Error parsing profile", e);
                return INITIAL_PROFILE;
            }
        }
        return INITIAL_PROFILE;
    });

    const [levelUpState, setLevelUpState] = useState({ isOpen: false, level: 0, title: '' });

    // Ref to access current profile in stable functions without re-creating them
    const profileRef = useRef(profile);
    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    const saveProfile = (newProfile: UserProfile) => {
        setProfile(newProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    };

    const addXp = useCallback((amount: number) => {
        let { currentXP, level, nextLevelXP } = profileRef.current;
        currentXP += amount;

        let leveledUp = false;
        while (currentXP >= nextLevelXP) {
            currentXP -= nextLevelXP;
            level++;
            nextLevelXP = calculateNextLevelXP(level);
            leveledUp = true;
        }

        const newTitle = getTitleForLevel(level);

        if (leveledUp) {
            notifyLevelUp(level, newTitle);
            setLevelUpState({ isOpen: true, level, title: newTitle });
        }

        const updatedProfile = {
            ...profileRef.current,
            level,
            currentXP,
            nextLevelXP,
            currentTitle: newTitle
        };

        // Update Ref immediately to prevent race conditions
        profileRef.current = updatedProfile;
        saveProfile(updatedProfile);
    }, [notifyLevelUp]);

    const unlockAchievement = useCallback((achievementId: string) => {
        const currentProfile = profileRef.current;
        if (currentProfile.unlockedAchievements.some(a => a.achievementId === achievementId)) return;

        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        const newUnlock = {
            achievementId,
            unlockedAt: new Date().toISOString()
        };

        const updatedProfile = {
            ...currentProfile,
            unlockedAchievements: [...currentProfile.unlockedAchievements, newUnlock]
        };

        // Update Ref immediately so addXp sees the new achievement
        profileRef.current = updatedProfile;
        saveProfile(updatedProfile);

        notifyAchievement(achievement.title, achievement.xpReward);
        addXp(achievement.xpReward);
    }, [notifyAchievement, addXp]);

    const checkAchievement = useCallback((trigger: string, data?: any) => {
        const currentProfile = profileRef.current;
        const currentStats = { ...currentProfile.stats };
        let statsChanged = false;

        switch (trigger) {
            case 'TRANSACTION_ADDED':
                currentStats.totalTransactions += 1;
                statsChanged = true;
                if (currentStats.totalTransactions === 1) unlockAchievement('first_steps');
                if (currentStats.totalTransactions === 100) unlockAchievement('data_hoarder');
                const hour = new Date().getHours();
                if (hour >= 1 && hour <= 4) unlockAchievement('night_owl');
                break;

            case 'GOAL_CREATED':
                unlockAchievement('saver_init');
                break;

            case 'BACKUP_RESTORED':
                unlockAchievement('feedback_loop');
                break;

            case 'GOAL_COMPLETED':
                unlockAchievement('savings_warrior');
                break;

            case 'BUDGET_CHECK':
                if (data && data.income > 0 && data.expense > 0) {
                    const ratio = data.expense / data.income;
                    if (ratio <= 0.8) unlockAchievement('smart_saver');
                    if (data.income > 5000 && ratio < 0.3) unlockAchievement('wealth_builder');
                }
                break;
        }

        if (statsChanged) {
            saveProfile({ ...currentProfile, stats: currentStats });
        }
    }, [unlockAchievement]);

    const recalculateLevel = useCallback(() => {
        if (!appData) {
            toast.error("Datos no disponibles.");
            return;
        }

        const currentProfile = profileRef.current;
        // Fix Stats
        const fixedStats = {
            ...currentProfile.stats,
            totalTransactions: appData.transactions.length
        };

        // Recover potentially lost achievements based on real data
        const recoveredAchievements = [...currentProfile.unlockedAchievements];
        const ensureUnlocked = (id: string) => {
            if (!recoveredAchievements.some(u => u.achievementId === id)) {
                recoveredAchievements.push({ achievementId: id, unlockedAt: new Date().toISOString() });
            }
        };

        if (fixedStats.totalTransactions >= 1) ensureUnlocked('first_steps');
        if (fixedStats.totalTransactions >= 100) ensureUnlocked('data_hoarder');

        let calculatedXP = 0;

        // Ledger XP
        appData.transactions.forEach(t => {
            if (t.type === 'income') calculatedXP += 10;
            else if (t.type === 'expense') calculatedXP += 5;
        });

        // Achievements XP
        recoveredAchievements.forEach(ua => {
            const ach = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
            if (ach) calculatedXP += ach.xpReward;
        });

        // Calculate Level
        let newLevel = 1;
        let nextXP = calculateNextLevelXP(newLevel);

        // Logic fix: XP curve uses TOTAL XP accumulation.
        // Current logic: while (currentXP >= nextXP) { currentXP -= nextXP; level++ }
        // This means levels reset XP to 0. 
        // If my previous logic was cumulative, this might be why users feel "low level".
        // But RPGs often do "Current level progress".
        // My implementation uses "Relative XP for this level" (currentXP resets).
        // Recalculation logic MUST match addXP logic.
        // addXP: currentXP -= nextLevelXP.
        // recalculateLevel: calculatedXP -= nextXP.
        // This is consistent.

        while (calculatedXP >= nextXP) {
            calculatedXP -= nextXP;
            newLevel++;
            nextXP = calculateNextLevelXP(newLevel);
        }

        const newTitle = getTitleForLevel(newLevel);

        const newProfile = {
            ...currentProfile,
            level: newLevel,
            currentXP: calculatedXP,
            nextLevelXP: nextXP,
            currentTitle: newTitle,
            unlockedAchievements: recoveredAchievements,
            stats: fixedStats
        };

        saveProfile(newProfile);
        toast.success(`Nivel corregido: ${newLevel}`);
    }, [appData]);


    const updateProfile = useCallback((updates: Partial<UserProfile>) => {
        const newProfile = { ...profileRef.current, ...updates };
        profileRef.current = newProfile;
        saveProfile(newProfile);
    }, []);

    return (
        <GamificationContext.Provider value={{
            profile,
            addXp,
            updateProfile,
            checkAchievement,
            recalculateLevel,
            achievements: ACHIEVEMENTS,
            levelUpModal: {
                isOpen: levelUpState.isOpen,
                level: levelUpState.level,
                title: levelUpState.title,
                close: () => setLevelUpState(prev => ({ ...prev, isOpen: false }))
            }
        }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
