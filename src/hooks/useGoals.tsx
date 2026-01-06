import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import type { Goal } from '../types';

export const useGoals = () => {
    const [goals, setGoals] = useLocalStorage<Goal[]>('vault_goals', []);

    // Migration: Backfill history for legacy goals with balance but no history
    useEffect(() => {
        const needsMigration = goals.some(g => g.currentAmount > 0 && (!g.history || g.history.length === 0));

        if (needsMigration) {
            setGoals(prev => prev.map(g => {
                if (g.currentAmount > 0 && (!g.history || g.history.length === 0)) {
                    // Create an initial deposit history entry
                    const migrationDate = g.lastContributionDate || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
                    return {
                        ...g,
                        history: [{
                            id: crypto.randomUUID(),
                            date: migrationDate,
                            amount: g.currentAmount,
                            type: 'deposit',
                            note: 'Saldo inicial (Migración)'
                        }]
                    };
                }
                return g;
            }));
        }
    }, [goals, setGoals]);

    const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>) => {
        const newGoal: Goal = {
            ...goal,
            id: crypto.randomUUID(),
            currentAmount: 0,
            history: []
        };
        setGoals((prev) => [newGoal, ...prev]);
    };

    const deleteGoal = (id: string) => {
        setGoals((prev) => prev.filter((g) => g.id !== id));
    };

    const addContribution = (id: string, amount: number, note?: string) => {
        setGoals((prev) => prev.map(g => {
            if (g.id === id) {
                const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
                const newHistoryItem = {
                    id: crypto.randomUUID(),
                    date: today,
                    amount: amount,
                    type: 'deposit' as const,
                    note: note || 'Contribución manual'
                };

                const history = g.history ? [...g.history, newHistoryItem] : [newHistoryItem];

                return {
                    ...g,
                    currentAmount: g.currentAmount + amount,
                    lastContributionDate: today,
                    history
                };
            }
            return g;
        }));
    };

    const withdraw = (id: string, amount: number, note?: string) => {
        setGoals((prev) => prev.map(g => {
            if (g.id === id) {
                const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
                const newHistoryItem = {
                    id: crypto.randomUUID(),
                    date: today,
                    amount: amount,
                    type: 'withdrawal' as const,
                    note: note || 'Retiro de fondos'
                };

                const history = g.history ? [...g.history, newHistoryItem] : [newHistoryItem];

                return {
                    ...g,
                    currentAmount: Math.max(0, g.currentAmount - amount),
                    history
                };
            }
            return g;
        }));
    };

    // Deprecated/Alias for backward compatibility or simplify to just call addContribution
    const contributeToGoal = (id: string, amount: number) => {
        addContribution(id, amount, 'Cuota Mensual');
    };

    // Calculate net contribution for a specific month (Deposits - Withdrawals)
    const getMonthlyContribution = (goal: Goal, date: Date) => {
        if (!goal.history) return 0;

        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();

        return goal.history.reduce((acc, item) => {

            // Check if item belongs to the target month/year
            // We use local time components from the history string YYYY-MM-DD
            const [y, m] = item.date.split('-').map(Number);
            // item.date represents YYYY-MM-DD. split gives [YYYY, MM, DD]. MM is 1-indexed.
            // date.getMonth() is 0-indexed.

            if (y === targetYear && (m - 1) === targetMonth) {
                return item.type === 'deposit' ? acc + item.amount : acc - item.amount;
            }
            return acc;
        }, 0);
    };

    const isGoalPaidThisMonth = (goal: Goal) => {
        // Use current date for "This Month" check
        const now = new Date();
        const monthlyQuota = goal.targetAmount / goal.months;
        const netContribution = getMonthlyContribution(goal, now);

        // It is paid if net contribution this month >= quota
        // AND the goal is not already fully completed (optional check, but good for UX)
        // But strictly for the quota:
        return netContribution >= (monthlyQuota - 0.01); // Tolerance for small floats
    };

    const canPayQuota = (goal: Goal, availableBalance: number) => {
        if (isGoalPaidThisMonth(goal)) return false;
        const monthlyAmount = goal.targetAmount / goal.months;
        return availableBalance >= monthlyAmount;
    };

    const getTotalSavingsAtDate = (date: Date) => {
        return goals.reduce((acc, goal) => {
            // After migration, if no history, balance is 0 or it's new empty goal
            if (!goal.history || goal.history.length === 0) return acc;

            // Sum contributions up to the end of the selected month
            // We want the status at the END of the selected month
            // e.g. Selected = Jan 2026 -> Include all up to Jan 31, 2026
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const goalTotal = goal.history.reduce((hAcc, item) => {
                const itemDate = new Date(item.date);
                // Compare just dates to be safe from timezones or use YYYY-MM-DD string comp
                // item.date is YYYY-MM-DD string. 
                // endOfMonth is Date object.
                // Let's convert itemDate strictly to midnight or just compare strings?
                // Date object comparison is fine if we are careful.
                // itemDate from '2025-01-01' will be 00:00 local time usually or UTC depending on browser
                // endOfMonth is last day of month. 

                if (itemDate <= endOfMonth) {
                    return item.type === 'deposit'
                        ? hAcc + item.amount
                        : hAcc - item.amount;
                }
                return hAcc;
            }, 0);

            return acc + Math.max(0, goalTotal);
        }, 0);
    };

    return {
        goals,
        addGoal,
        deleteGoal,
        contributeToGoal,
        addContribution,
        withdraw,
        isGoalPaidThisMonth,
        canPayQuota,
        getTotalSavingsAtDate
    };
};
