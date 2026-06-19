import { createContext, useContext, type ReactNode, useEffect } from 'react';
import { useData } from './DataContext';
import type { AppSettings } from '../services/CloudStorage';
import type { EmailNotificationSettings, AccessibilitySettings, SpendingLimitsSettings, CategoryBudgetRule } from '../types';

export const resolveBudgetRules = (
    globalAmount: number,
    rules: Record<string, CategoryBudgetRule>,
    categoriesList: string[]
): Record<string, number> => {
    const resolved: Record<string, number> = {};
    
    // 1. Resolve percent_global rules
    categoriesList.forEach(cat => {
        const rule = rules[cat];
        if (rule && rule.type === 'percent_global') {
            resolved[cat] = Math.max(0, (globalAmount * rule.value) / 100);
        }
    });

    // 2. Resolve fixed rules
    categoriesList.forEach(cat => {
        const rule = rules[cat];
        if (rule && rule.type === 'fixed') {
            resolved[cat] = Math.max(0, rule.value);
        }
    });

    // Round all values to 2 decimal places
    const finalBudgets: Record<string, number> = {};
    Object.entries(resolved).forEach(([cat, val]) => {
        if (val > 0) {
            finalBudgets[cat] = Number(val.toFixed(2));
        }
    });

    return finalBudgets;
};

interface SettingsContextType {
    currency: string;
    setCurrency: (currency: string) => void;
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (seen: boolean) => void;
    loading: boolean;
    goalPreferences: Required<NonNullable<AppSettings['goalPreferences']>>;
    setGoalPreferences: (prefs: AppSettings['goalPreferences']) => void;
    emailNotifications: EmailNotificationSettings;
    updateEmailNotifications: (prefs: Partial<EmailNotificationSettings>) => void;
    accessibility: AccessibilitySettings;
    updateAccessibility: (prefs: Partial<AccessibilitySettings>) => void;
    spendingLimits: SpendingLimitsSettings;
    updateSpendingLimits: (prefs: Partial<SpendingLimitsSettings>) => void;
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

    // Default Email Preferences
    const emailNotifications: EmailNotificationSettings = {
        enabled: settings.emailNotifications?.enabled || false,
        onGoalReached: settings.emailNotifications?.onGoalReached !== false,
        onBudgetExceeded: settings.emailNotifications?.onBudgetExceeded !== false,
        onProjectInvitation: settings.emailNotifications?.onProjectInvitation !== false,
        onWeeklySummary: !!settings.emailNotifications?.onWeeklySummary,
        onWeeklyBudgetControl: settings.emailNotifications?.onWeeklyBudgetControl !== false,
        frequency: settings.emailNotifications?.frequency || 'instant',
        theme: settings.emailNotifications?.theme || 'oscuro'
    };

    // Default Accessibility Settings
    const accessibility: AccessibilitySettings = {
        fontSize: settings.accessibility?.fontSize || 'medium',
        spacing: settings.accessibility?.spacing || 'standard',
        highContrast: !!settings.accessibility?.highContrast,
        soundEffects: settings.accessibility?.soundEffects !== false
    };

    // Derived category limits by dynamically resolving rules
    const expenseCats = data.categories?.expense || [];
    const globalConfig = settings.spendingLimits?.global || { enabled: false, amount: 0, period: 'monthly' };
    const rulesConfig = settings.spendingLimits?.rules || {};
    
    const globalAmount = globalConfig.enabled ? globalConfig.amount : 0;
    const resolvedCategories = resolveBudgetRules(globalAmount, rulesConfig, expenseCats);

    const spendingLimits: SpendingLimitsSettings = {
        global: globalConfig,
        rules: rulesConfig,
        categories: resolvedCategories
    };

    // Apply accessibility options dynamically
    useEffect(() => {
        const root = document.documentElement;
        
        // Font size class/attribute
        root.setAttribute('data-font-size', accessibility.fontSize);
        
        // Spacing class/attribute
        root.setAttribute('data-spacing', accessibility.spacing);
        
        // High contrast class/attribute
        if (accessibility.highContrast) {
            root.classList.add('high-contrast');
            root.setAttribute('data-high-contrast', 'true');
        } else {
            root.classList.remove('high-contrast');
            root.removeAttribute('data-high-contrast');
        }
    }, [accessibility.fontSize, accessibility.spacing, accessibility.highContrast]);

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

    const updateEmailNotifications = (prefs: Partial<EmailNotificationSettings>) => {
        updateData({
            settings: {
                ...settings,
                emailNotifications: { ...emailNotifications, ...prefs }
            }
        });
    };

    const updateAccessibility = (prefs: Partial<AccessibilitySettings>) => {
        updateData({
            settings: {
                ...settings,
                accessibility: { ...accessibility, ...prefs }
            }
        });
    };

    const updateSpendingLimits = (prefs: Partial<SpendingLimitsSettings>) => {
        const newGlobal = prefs.global || spendingLimits.global;
        const newRules = prefs.rules || spendingLimits.rules;
        
        const expenseCats = data.categories?.expense || [];
        const globalAmount = newGlobal.enabled ? newGlobal.amount : 0;
        
        // Resolve absolute amounts
        const resolvedCategories = resolveBudgetRules(globalAmount, newRules, expenseCats);
        
        const nextLimits = {
            global: newGlobal,
            rules: newRules,
            categories: resolvedCategories
        };

        // Sync resolved category limits back to data.projections.categoryBudgets as Record<string, string>
        const categoryBudgetsStr: Record<string, string> = {};
        Object.entries(resolvedCategories).forEach(([cat, amt]) => {
            if (amt > 0) {
                categoryBudgetsStr[cat] = amt.toString();
            }
        });

        updateData({
            settings: {
                ...settings,
                spendingLimits: nextLimits
            },
            projections: {
                ...(data.projections || {
                    simulatedTransactions: [],
                    categoryBudgets: {},
                    simulatedCreditPayments: [],
                    simulatedGoalContributions: [],
                    simulatedFundTransfers: {},
                    toggles: {
                        includeGlobalBalance: true,
                        includeFundsInBalance: false,
                        autoIncludeScheduled: true
                    }
                }),
                categoryBudgets: categoryBudgetsStr
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
            setGoalPreferences,
            emailNotifications,
            updateEmailNotifications,
            accessibility,
            updateAccessibility,
            spendingLimits,
            updateSpendingLimits
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

