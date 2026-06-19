import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useData } from './DataContext';
import type { UserProfile, Achievement, Quest } from '../types';
import { 
    ACHIEVEMENTS, 
    calculateNextLevelXP, 
    calculatePathNextLevelXP, 
    getTitleForLevel, 
    calculateArchetype, 
    generateDefaultQuests,
    getPathTitle,
    DAILY_QUEST_TEMPLATES,
    WEEKLY_QUEST_TEMPLATES,
    SAGA_TEMPLATES
} from './GamificationConstants';
import { useLocalNotifications } from '../hooks/useLocalNotifications';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { RelicToastContent } from '../components/gamification/RelicToast';

interface GamificationContextType {
    profile: UserProfile;
    addXp: (amount: number, path?: 'saving' | 'discipline' | 'growth') => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    checkAchievement: (triggerId: string, data?: any) => void;
    recalculateLevel: () => void;
    achievements: Achievement[];
    claimQuestXp: (questId: string) => void;
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
    currentTitle: getTitleForLevel(1),
    unlockedAchievements: [],
    stats: {
        totalTransactions: 0,
        perfectBudgetMonths: 0,
        savingsStreak: 0,
    },
    savingLevel: 1,
    savingXP: 0,
    disciplineLevel: 1,
    disciplineXP: 0,
    growthLevel: 1,
    growthXP: 0,
    activeQuests: generateDefaultQuests(),
    lastQuestRefresh: new Date().toISOString()
};

// Play short retro-synth chime sounds for rewards and status upgrades
const playChime = (type: 'levelup' | 'relic') => {
    try {
        const audio = new Audio(
            type === 'levelup' 
                ? 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav' // majestic chime
                : 'https://assets.mixkit.co/active_storage/sfx/2017/2017-84.wav' // crystal unlock
        );
        audio.volume = 0.20;
        audio.play().catch(() => {});
    } catch (e) {
        console.error("Audio chime error", e);
    }
};

// Safely migrate old data structures to support the new features
const ensureProfileDefaults = (loaded: any): UserProfile => {
    const merged = { ...INITIAL_PROFILE, ...loaded };
    
    if (merged.savingLevel === undefined) merged.savingLevel = 1;
    if (merged.savingXP === undefined) merged.savingXP = 0;
    if (merged.disciplineLevel === undefined) merged.disciplineLevel = 1;
    if (merged.disciplineXP === undefined) merged.disciplineXP = 0;
    if (merged.growthLevel === undefined) merged.growthLevel = 1;
    if (merged.growthXP === undefined) merged.growthXP = 0;
    
    if (!merged.activeQuests || merged.activeQuests.length === 0) {
        merged.activeQuests = generateDefaultQuests();
    }
    
    if (!merged.lastQuestRefresh) {
        merged.lastQuestRefresh = new Date().toISOString();
    }
    
    return merged;
};

// Refresh quests on a daily and weekly calendar basis
const checkQuestRefresh = (profile: UserProfile): UserProfile => {
    if (!profile.lastQuestRefresh) return { ...profile, lastQuestRefresh: new Date().toISOString() };
    
    const last = new Date(profile.lastQuestRefresh);
    const now = new Date();
    
    const isSameDay = last.getDate() === now.getDate() &&
                      last.getMonth() === now.getMonth() &&
                      last.getFullYear() === now.getFullYear();
                      
    if (isSameDay) return profile;
    
    // Refresh daily quests
    let updatedQuests = (profile.activeQuests || generateDefaultQuests()).map(q => {
        if (q.type === 'daily') {
            return {
                ...q,
                current: q.id === 'daily_login' ? 1 : 0, // Login auto-completed
                completed: q.id === 'daily_login',
                claimed: false
            };
        }
        return q;
    });
    
    // Check if week number has changed
    const getWeekNumber = (d: Date) => {
        const onejan = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    };
    
    const isSameWeek = getWeekNumber(last) === getWeekNumber(now) && last.getFullYear() === now.getFullYear();
    
    if (!isSameWeek) {
        // Refresh weekly quests too
        updatedQuests = updatedQuests.map(q => {
            if (q.type === 'weekly') {
                return {
                    ...q,
                    current: 0,
                    completed: false,
                    claimed: false
                };
            }
            return q;
        });
    }
    
    return {
        ...profile,
        activeQuests: updatedQuests,
        lastQuestRefresh: now.toISOString()
    };
};

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { data: appData } = useData();
    const { notifyLevelUp } = useLocalNotifications();

    const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
    const [levelUpState, setLevelUpState] = useState({ isOpen: false, level: 0, title: '' });
    const [isLoading, setIsLoading] = useState(true);

    const profileRef = useRef(profile);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveProfileToCloud = useCallback((updatedProfile: UserProfile) => {
        if (!user) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await setDoc(doc(db, 'users', user.uid), { gamification: updatedProfile }, { merge: true });
                console.log("[GamificationContext] Profile saved to cloud");
            } catch (e) {
                console.error("Error saving gamification profile", e);
            }
        }, 1000);
    }, [user]);

    const syncProfile = useCallback((updater: UserProfile | ((prev: UserProfile) => UserProfile)) => {
        setProfile(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            const updated = {
                ...next,
                lastUpdated: Date.now()
            };
            profileRef.current = updated;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // 1. Listen to Firestore changes and verify structure
    useEffect(() => {
        if (!user) {
            setProfile(INITIAL_PROFILE);
            setIsLoading(false);
            return;
        }

        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.gamification) {
                    const cloudProfile = ensureProfileDefaults(data.gamification);
                    
                    // Check if local backup is newer to prevent overwriting local changes
                    const localSaved = localStorage.getItem(STORAGE_KEY);
                    if (localSaved) {
                        try {
                            const localProfile = JSON.parse(localSaved);
                            if (localProfile.lastUpdated && cloudProfile.lastUpdated && localProfile.lastUpdated > cloudProfile.lastUpdated) {
                                console.log("[GamificationContext] Local backup is newer than cloud. Using local and scheduling sync.");
                                syncProfile(localProfile);
                                saveProfileToCloud(localProfile);
                                setIsLoading(false);
                                return;
                            }
                        } catch (e) {
                            // Ignore corrupt local
                        }
                    }

                    const verified = checkQuestRefresh(cloudProfile);
                    syncProfile(verified);
                } else {
                    migrateLocalToCloud(user.uid);
                }
            } else {
                migrateLocalToCloud(user.uid);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const migrateLocalToCloud = async (uid: string) => {
        const localSaved = localStorage.getItem(STORAGE_KEY);
        let profileToSave = INITIAL_PROFILE;

        if (localSaved) {
            try {
                const parsed = JSON.parse(localSaved);
                profileToSave = ensureProfileDefaults({ ...INITIAL_PROFILE, ...parsed });
                console.log("Migrating local gamification to cloud...");
                toast.info("Sincronizando progreso en la nube...");
            } catch (e) {
                console.error("Local storage invalid", e);
            }
        }

        try {
            await setDoc(doc(db, 'users', uid), { gamification: profileToSave }, { merge: true });
        } catch (e) {
            console.error("Error saving initial gamification", e);
        }
    };

    const addXp = useCallback((amount: number, path?: 'saving' | 'discipline' | 'growth') => {
        if (isLoading) return;
        const currentProfile = profileRef.current;
        
        let { 
            currentXP, level, nextLevelXP,
            savingLevel = 1, savingXP = 0,
            disciplineLevel = 1, disciplineXP = 0,
            growthLevel = 1, growthXP = 0
        } = currentProfile;
        
        // Auto-assign path if not specified
        const pathAssigned = path || 'discipline';

        // 1. Add XP to specific path
        if (pathAssigned === 'saving') {
            savingXP += amount;
            while (savingXP >= calculatePathNextLevelXP(savingLevel)) {
                savingXP -= calculatePathNextLevelXP(savingLevel);
                savingLevel++;
                toast.info(`🌟 ¡Senda del Ahorro Ascendió! Nivel ${savingLevel}`);
            }
        } else if (pathAssigned === 'discipline') {
            disciplineXP += amount;
            while (disciplineXP >= calculatePathNextLevelXP(disciplineLevel)) {
                disciplineXP -= calculatePathNextLevelXP(disciplineLevel);
                disciplineLevel++;
                toast.info(`🌟 ¡Senda de Disciplina Ascendió! Nivel ${disciplineLevel}`);
            }
        } else if (pathAssigned === 'growth') {
            growthXP += amount;
            while (growthXP >= calculatePathNextLevelXP(growthLevel)) {
                growthXP -= calculatePathNextLevelXP(growthLevel);
                growthLevel++;
                toast.info(`🌟 ¡Senda de Crecimiento Ascendió! Nivel ${growthLevel}`);
            }
        }

        // 2. Sum global XP
        currentXP += amount;

        // 3. Process global Level Up
        let leveledUp = false;
        while (currentXP >= nextLevelXP) {
            currentXP -= nextLevelXP;
            level++;
            nextLevelXP = calculateNextLevelXP(level);
            leveledUp = true;
        }

        const newTitle = getTitleForLevel(level);

        if (leveledUp) {
            playChime('levelup');
            notifyLevelUp(level, newTitle);
            setLevelUpState({ isOpen: true, level, title: newTitle });
        }

        const updatedProfile: UserProfile = {
            ...currentProfile,
            level,
            currentXP,
            nextLevelXP,
            currentTitle: newTitle,
            savingLevel,
            savingXP,
            disciplineLevel,
            disciplineXP,
            growthLevel,
            growthXP
        };

        syncProfile(updatedProfile);

        saveProfileToCloud(updatedProfile);
    }, [notifyLevelUp, isLoading, user, syncProfile]);

    const unlockAchievement = useCallback((achievementId: string) => {
        if (isLoading) return;
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

        syncProfile(updatedProfile);

        saveProfileToCloud(updatedProfile);

        // Play crystal sound and call custom Sonner Relic Toast Content
        playChime('relic');
        toast.custom((t) => (
            <RelicToastContent
                toastId={t}
                title={achievement.title}
                xpReward={achievement.xpReward}
                relicIcon={achievement.icon}
                rarity={achievement.rarity}
                lore={achievement.relicLore}
                onClose={() => toast.dismiss(t)}
            />
        ), {
            duration: 6000,
            position: 'top-center'
        });

        // Add corresponding Path XP
        const pType = achievement.pathType !== 'general' ? achievement.pathType : undefined;
        addXp(achievement.xpReward, pType);
    }, [addXp, isLoading, user, syncProfile]);

    // Check and update progress of active quests and sagas
    const checkQuestProgress = useCallback((trigger: string, amount: number = 1, extraData?: any) => {
        if (isLoading) return;
        const currentProfile = profileRef.current;
        if (!currentProfile.activeQuests) return;
        
        let questsChanged = false;
        const updatedQuests = currentProfile.activeQuests.map((q: Quest) => {
            if (q.completed) return q;
            
            let newCurrent = q.current;
            let completed: boolean = q.completed;
            
            if (q.type === 'daily') {
                if (q.id === 'daily_tx' && trigger === 'TRANSACTION_ADDED') {
                    newCurrent = Math.min(q.target, q.current + amount);
                }
            } else if (q.type === 'weekly') {
                if (q.id === 'weekly_save' && (trigger === 'GOAL_CONTRIBUTION' || trigger === 'FUND_DEPOSIT')) {
                    newCurrent = Math.min(q.target, q.current + amount);
                }
                if (q.id === 'weekly_check' && (trigger === 'PROJECTIONS_VIEWED' || trigger === 'CALENDAR_VIEWED')) {
                    newCurrent = Math.min(q.target, q.current + amount);
                }
                if (q.id === 'weekly_repay' && trigger === 'CREDIT_PAYMENT') {
                    newCurrent = Math.min(q.target, q.current + amount);
                }
            } else if (q.type === 'saga') {
                if (q.id === 'saga_card') {
                    if (trigger === 'PROJECTIONS_VIEWED' && q.current === 0) {
                        newCurrent = 1;
                        toast.info("Saga de la Tarjeta: ¡Paso 1 completado!");
                    }
                    if (trigger === 'CREDIT_PAYMENT' && q.current === 1) {
                        newCurrent = 2;
                        toast.info("Saga de la Tarjeta: ¡Paso 2 completado!");
                    }
                    if (trigger === 'BUDGET_CHECK' && q.current === 2) {
                        const { income, expense } = extraData || { income: 0, expense: 0 };
                        // debt/expenses ratio under 70% of income
                        if (income > 0 && (expense / income) <= 0.70) {
                            newCurrent = 3;
                            completed = true;
                            // Trigger saga unlock Relic!
                            setTimeout(() => unlockAchievement('saga_card_complete'), 200);
                        }
                    }
                } else if (q.id === 'saga_builder' && trigger === 'PROJECT_FUNDED') {
                    newCurrent = Math.min(q.target, q.current + amount);
                    if (newCurrent >= q.target) {
                        completed = true;
                        setTimeout(() => unlockAchievement('saga_builder_complete'), 200);
                    }
                } else if (q.id === 'saga_shield' && trigger === 'FUND_DEPOSIT') {
                    newCurrent = Math.min(q.target, q.current + amount);
                    if (newCurrent >= q.target) {
                        completed = true;
                        setTimeout(() => unlockAchievement('saga_shield_complete'), 200);
                    }
                }
            }
            
            if (newCurrent >= q.target) {
                completed = true;
            }
            
            if (newCurrent !== q.current || completed !== q.completed) {
                questsChanged = true;
                return { ...q, current: newCurrent, completed };
            }
            return q;
        });
        
        if (questsChanged) {
            const updatedProfile = { ...currentProfile, activeQuests: updatedQuests };
            syncProfile(updatedProfile);
            saveProfileToCloud(updatedProfile);
        }
    }, [isLoading, unlockAchievement, user, syncProfile]);

    const claimQuestXp = useCallback((questId: string) => {
        if (isLoading) return;
        const currentProfile = profileRef.current;
        if (!currentProfile.activeQuests) return;
        
        const quest = currentProfile.activeQuests.find(q => q.id === questId && q.completed && !q.claimed);
        if (!quest) return;

        const xpAmt = quest.xpReward;
        const xpType = quest.xpType;
        const qTitle = quest.title;

        const updatedQuests = currentProfile.activeQuests.map(q => {
            if (q.id === questId) {
                return { ...q, claimed: true };
            }
            return q;
        });

        const updatedProfile = { ...currentProfile, activeQuests: updatedQuests };
        syncProfile(updatedProfile);
        
        toast.success(`✨ ¡Misión Completada!`, {
            description: `${qTitle} - Ganaste +${xpAmt} XP de ${xpType === 'saving' ? 'Ahorro' : xpType === 'discipline' ? 'Disciplina' : 'Crecimiento'}`
        });
        playChime('relic');

        // Add XP directly to path
        addXp(xpAmt, xpType);
    }, [isLoading, addXp, syncProfile]);

    // Triggers for context-aware achievements and quests
    const checkAchievement = useCallback((trigger: string, data?: any) => {
        if (isLoading) return;
        const currentProfile = profileRef.current;
        const currentStats = { ...currentProfile.stats };
        let statsChanged = false;

        switch (trigger) {
            case 'TRANSACTION_ADDED':
                currentStats.totalTransactions += 1;
                statsChanged = true;
                
                // Track Relics
                if (currentStats.totalTransactions === 1) unlockAchievement('first_steps');
                if (currentStats.totalTransactions === 100) unlockAchievement('data_hoarder');
                
                const hour = new Date().getHours();
                if (hour >= 1 && hour <= 4) unlockAchievement('night_owl');
                
                // Track Path Base XP
                addXp(5, 'discipline');
                
                // Track Quests
                checkQuestProgress('TRANSACTION_ADDED', 1);

                // Inspect sub relations
                if (data) {
                    if (data.relatedTo) {
                        if (data.relatedTo.type === 'credit') {
                            addXp(15, 'growth');
                            checkQuestProgress('CREDIT_PAYMENT', 1);
                        } else if (data.relatedTo.type === 'goal') {
                            addXp(20, 'saving');
                            checkQuestProgress('GOAL_CONTRIBUTION', 1);
                        } else if (data.relatedTo.type === 'fund') {
                            addXp(15, 'saving');
                            checkQuestProgress('FUND_DEPOSIT', 1);
                        }
                    }
                }
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
                    
                    // Saga Check
                    checkQuestProgress('BUDGET_CHECK', 1, data);
                }
                break;
                
            case 'PROJECTIONS_VIEWED':
            case 'CALENDAR_VIEWED':
                checkQuestProgress(trigger, 1);
                break;

            case 'PROJECT_FUNDED':
                addXp(25, 'growth');
                checkQuestProgress('PROJECT_FUNDED', 1);
                break;
        }

        if (statsChanged) {
            const updatedProfile = { ...currentProfile, stats: currentStats };
            syncProfile(updatedProfile);
            saveProfileToCloud(updatedProfile);
        }
    }, [unlockAchievement, checkQuestProgress, addXp, isLoading, user, syncProfile]);

    const recalculateLevel = useCallback(() => {
        if (!appData) {
            toast.error("Datos no disponibles.");
            return;
        }

        const currentProfile = profileRef.current;
        const fixedStats = {
            ...currentProfile.stats,
            totalTransactions: appData.transactions.length
        };

        const recoveredAchievements = [...currentProfile.unlockedAchievements];
        const ensureUnlocked = (id: string) => {
            if (!recoveredAchievements.some(u => u.achievementId === id)) {
                recoveredAchievements.push({ achievementId: id, unlockedAt: new Date().toISOString() });
            }
        };

        if (fixedStats.totalTransactions >= 1) ensureUnlocked('first_steps');
        if (fixedStats.totalTransactions >= 100) ensureUnlocked('data_hoarder');

        // Reset paths
        let calculatedSavingXP = 0;
        let calculatedDisciplineXP = 0;
        let calculatedGrowthXP = 0;

        // Recalculate Ledger XP by Path
        appData.transactions.forEach(t => {
            if (t.type === 'income') {
                calculatedDisciplineXP += 10;
            } else if (t.type === 'expense') {
                calculatedDisciplineXP += 5;
                if (t.category === 'Créditos' || t.category === 'Deudas' || t.description?.toLowerCase().includes('crédito') || t.description?.toLowerCase().includes('abono')) {
                    calculatedGrowthXP += 15;
                }
            }
        });

        // Add XP from existing goals contributions
        if (appData.goals) {
            appData.goals.forEach(g => {
                if (g.currentAmount > 0) {
                    calculatedSavingXP += 20 * Math.ceil(g.currentAmount / 50);
                }
                if (g.currentAmount >= g.targetAmount) {
                    calculatedSavingXP += 500; // savings_warrior reward
                }
            });
        }

        // Add XP from projects
        if (appData.projects) {
            appData.projects.forEach(p => {
                if (p.transactions) {
                    calculatedGrowthXP += 25 * p.transactions.length;
                }
            });
        }

        // Add Relics rewards to paths
        recoveredAchievements.forEach(ua => {
            const ach = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
            if (ach) {
                if (ach.pathType === 'saving') calculatedSavingXP += ach.xpReward;
                else if (ach.pathType === 'discipline') calculatedDisciplineXP += ach.xpReward;
                else if (ach.pathType === 'growth') calculatedGrowthXP += ach.xpReward;
            }
        });

        // Compute Path Levels
        let savingLevel = 1;
        while (calculatedSavingXP >= calculatePathNextLevelXP(savingLevel)) {
            calculatedSavingXP -= calculatePathNextLevelXP(savingLevel);
            savingLevel++;
        }

        let disciplineLevel = 1;
        while (calculatedDisciplineXP >= calculatePathNextLevelXP(disciplineLevel)) {
            calculatedDisciplineXP -= calculatePathNextLevelXP(disciplineLevel);
            disciplineLevel++;
        }

        let growthLevel = 1;
        while (calculatedGrowthXP >= calculatePathNextLevelXP(growthLevel)) {
            calculatedGrowthXP -= calculatePathNextLevelXP(growthLevel);
            growthLevel++;
        }

        // Sum global level
        const totalXP = calculatedSavingXP + calculatedDisciplineXP + calculatedGrowthXP;
        let newLevel = 1;
        let nextXP = calculateNextLevelXP(newLevel);
        let calcGlobalXP = totalXP;

        while (calcGlobalXP >= nextXP) {
            calcGlobalXP -= nextXP;
            newLevel++;
            nextXP = calculateNextLevelXP(newLevel);
        }

        const newTitle = getTitleForLevel(newLevel);

        const newProfile = {
            ...currentProfile,
            level: newLevel,
            currentXP: calcGlobalXP,
            nextLevelXP: nextXP,
            currentTitle: newTitle,
            unlockedAchievements: recoveredAchievements,
            stats: fixedStats,
            savingLevel,
            savingXP: calculatedSavingXP,
            disciplineLevel,
            disciplineXP: calculatedDisciplineXP,
            growthLevel,
            growthXP: calculatedGrowthXP,
            activeQuests: generateDefaultQuests() // Reset to fresh
        };

        syncProfile(newProfile);
        saveProfileToCloud(newProfile);
        toast.success(`Nivel de Sabiduría corregido: ${newLevel}`);
    }, [appData, user, syncProfile]);

    const updateProfile = useCallback((updates: Partial<UserProfile>) => {
        syncProfile(prev => {
            const newProfile = { ...prev, ...updates };
            saveProfileToCloud(newProfile);
            return newProfile;
        });
    }, [user, syncProfile, saveProfileToCloud]);

    return (
        <GamificationContext.Provider value={{
            profile,
            addXp,
            updateProfile,
            checkAchievement,
            recalculateLevel,
            achievements: ACHIEVEMENTS,
            claimQuestXp,
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
