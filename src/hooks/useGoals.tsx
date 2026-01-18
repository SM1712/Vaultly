import { useData } from '../context/DataContext';
import type { Goal } from '../types';
import { toCents, fromCents, safeAdd, safeSub } from '../utils/financialUtils';
import { isBefore, isEqual, endOfDay, parseISO } from 'date-fns';

export const useGoals = () => {
    const { data, updateData } = useData();
    const goals: Goal[] = data.goals || [];

    // --- Helpers defined first to avoid ReferenceError ---
    const getattrContributionsThisMonth = (goal: Goal, date: Date) => {
        if (!goal.history) return 0;
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();

        let totalCents = 0;
        goal.history.forEach(item => {
            const [y, m] = item.date.split('-').map(Number);
            if (y === targetYear && (m - 1) === targetMonth) {
                if (item.type === 'deposit') totalCents += toCents(item.amount);
                else totalCents -= toCents(item.amount);
            }
        });
        return fromCents(totalCents);
    }

    // --- Actions ---

    const addGoal = (goalData: Omit<Goal, 'id' | 'currentAmount' | 'history'>) => {
        const newGoal: Goal = {
            id: crypto.randomUUID(),
            ...goalData,
            currentAmount: 0,
            recoveryStrategy: 'spread',
            history: []
        };
        updateData({ goals: [...goals, newGoal] });
    };

    const updateGoal = (id: string, updates: Partial<Goal>) => {
        const newGoals = goals.map(g => g.id === id ? { ...g, ...updates } : g);
        updateData({ goals: newGoals });
    };

    const deleteGoal = (id: string) => {
        const newGoals = goals.filter(g => g.id !== id);
        updateData({ goals: newGoals });
    };

    const addContribution = (id: string, amount: number, note?: string) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const today = new Date().toISOString().split('T')[0];
        const newHistoryItem = {
            id: crypto.randomUUID(),
            date: today,
            amount: amount,
            type: 'deposit' as const,
            note: note || 'Contribución manual'
        };

        const history = goal.history ? [...goal.history, newHistoryItem] : [newHistoryItem];

        // Safe Add
        const newAmount = safeAdd(goal.currentAmount || 0, amount);

        const updatedGoal = {
            ...goal,
            currentAmount: newAmount,
            lastContributionDate: today,
            history
        };

        updateGoal(id, updatedGoal);
    };

    const withdraw = (id: string, amount: number, note?: string, recoveryStrategy?: 'spread' | 'catch_up') => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const today = new Date().toISOString().split('T')[0];
        const newHistoryItem = {
            id: crypto.randomUUID(),
            date: today,
            amount: amount,
            type: 'withdrawal' as const,
            note: note || 'Retiro de fondos'
        };

        const history = goal.history ? [...goal.history, newHistoryItem] : [newHistoryItem];

        // Safe Sub
        const newAmount = Math.max(0, safeSub(goal.currentAmount || 0, amount));

        const updatedGoal = {
            ...goal,
            currentAmount: newAmount,
            recoveryStrategy: recoveryStrategy || goal.recoveryStrategy,
            history
        };

        updateGoal(id, updatedGoal);
    };

    const contributeToGoal = (id: string, amount: number) => {
        addContribution(id, amount, 'Cuota Mensual');
    };

    // --- Deterministic Random Helper ---
    const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const getGoalMonthlyWeights = (goal: Goal): number[] => {
        const start = new Date(goal.startDate);
        const end = new Date(goal.deadline);
        const totalMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);

        // Generate a seed from goal.id
        const seedBase = goal.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const weights = [];
        for (let i = 0; i < totalMonths; i++) {
            const r = pseudoRandom(seedBase + i);
            const weight = 0.8 + (r * 0.6); // Range [0.8, 1.4]
            weights.push(weight);
        }
        return weights;
    };

    // Calculate dynamic monthly quota based on Strategy
    const getMonthlyQuota = (goal: Goal, referenceDate: Date = new Date(), simulatedAdditionalAmount: number = 0): number => {
        if (!goal.deadline) return 0;

        const today = new Date(referenceDate);
        const deadlineDate = new Date(goal.deadline);
        const startDate = new Date(goal.startDate);

        const currentAmount = safeAdd(goal.currentAmount || 0, simulatedAdditionalAmount);
        const remainingAmount = Math.max(0, safeSub(goal.targetAmount, currentAmount));

        if (remainingAmount <= 0) return 0;

        // DYNAMIC NON-LINEAR DISTRIBUTION
        if (goal.calculationMethod === 'dynamic') {
            const weights = getGoalMonthlyWeights(goal);
            const monthsPassed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());

            if (monthsPassed >= weights.length) return remainingAmount;

            const currentIndex = Math.max(0, monthsPassed);
            let sumRemainingWeights = 0;
            for (let i = currentIndex; i < weights.length; i++) {
                sumRemainingWeights += weights[i];
            }

            if (sumRemainingWeights === 0) return remainingAmount;

            const currentWeight = weights[currentIndex];

            // Contributions check
            const isCurrentMonth = today.getMonth() === new Date().getMonth() && today.getFullYear() === new Date().getFullYear();
            const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, today) : 0;
            const startOfMonthRemaining = safeAdd(remainingAmount, contributionsThisMonth);

            const allocationShare = currentWeight / sumRemainingWeights;
            const quotaTotalForMonth = startOfMonthRemaining * allocationShare;

            return Math.ceil(quotaTotalForMonth * 100) / 100;
        }

        // LINEAR / LEGACY LOGIC
        const yearsDiff = deadlineDate.getFullYear() - today.getFullYear();
        const monthsDiff = deadlineDate.getMonth() - today.getMonth();
        let monthsRemaining = Math.max(1, (yearsDiff * 12) + monthsDiff);

        // STRATEGY: SPREAD (Default)
        if (goal.recoveryStrategy === 'spread' || !goal.recoveryStrategy) {
            const isCurrentMonth = today.getMonth() === new Date().getMonth() && today.getFullYear() === new Date().getFullYear();
            const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, today) : 0;
            const startOfMonthRemaining = safeAdd(remainingAmount, contributionsThisMonth);

            const amount = startOfMonthRemaining / monthsRemaining;
            return Math.ceil(amount * 100) / 100;
        }

        // STRATEGY: CATCH UP
        const totalMonths = Math.max(1, (deadlineDate.getFullYear() - startDate.getFullYear()) * 12 + (deadlineDate.getMonth() - startDate.getMonth()) + 1);
        const monthsPassed = Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth()));

        const idealPerMonth = goal.targetAmount / totalMonths;
        const idealCumulative = idealPerMonth * monthsPassed;

        const isCurrentMonth = today.getMonth() === new Date().getMonth() && today.getFullYear() === new Date().getFullYear();
        const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, today) : 0;
        const startOfMonthCurrent = safeSub(currentAmount, contributionsThisMonth);

        const deficit = Math.max(0, idealCumulative - startOfMonthCurrent);
        const amount = idealPerMonth + deficit;

        return Math.ceil(amount * 100) / 100;
    };

    const isGoalPaidThisMonth = (goal: Goal) => {
        const nav = new Date();
        const contributionsThisMonth = getattrContributionsThisMonth(goal, nav);
        const required = getMonthlyQuota(goal);
        return contributionsThisMonth >= (required * 0.95);
    };

    const getTotalSavingsAtDate = (date: Date) => {
        // Robust End of Period
        const endOfPeriod = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));

        const totalCents = goals.reduce((accCents, goal) => {
            if (!goal.history || goal.history.length === 0) return accCents;

            let gTotalCents = 0;
            goal.history.forEach(item => {
                const iDate = parseISO(item.date);
                if (isBefore(iDate, endOfPeriod) || isEqual(iDate, endOfPeriod)) {
                    if (item.type === 'deposit') gTotalCents += toCents(item.amount);
                    else gTotalCents -= toCents(item.amount);
                }
            });
            return accCents + Math.max(0, gTotalCents);
        }, 0);

        return fromCents(totalCents);
    };

    const getMonthsRemaining = (goal: Goal) => {
        if (!goal.deadline) return 0;
        const today = new Date();
        const deadlineDate = new Date(goal.deadline);
        const yearsDiff = deadlineDate.getFullYear() - today.getFullYear();
        const monthsDiff = deadlineDate.getMonth() - today.getMonth();
        return Math.max(0, (yearsDiff * 12) + monthsDiff);
    };

    return {
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        addContribution,
        withdraw,
        getMonthlyQuota,
        isGoalPaidThisMonth,
        getTotalSavingsAtDate,
        getMonthsRemaining
    };
};
