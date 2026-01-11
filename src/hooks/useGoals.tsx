import { useData } from '../context/DataContext';
import type { Goal } from '../types';

export const useGoals = () => {
    const { data, updateData } = useData();
    const goals: Goal[] = data.goals || [];

    // --- Helpers defined first to avoid ReferenceError ---
    const getattrContributionsThisMonth = (goal: Goal, date: Date) => {
        if (!goal.history) return 0;
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();

        return goal.history.reduce((acc, item) => {
            const [y, m] = item.date.split('-').map(Number);
            if (y === targetYear && (m - 1) === targetMonth) {
                return item.type === 'deposit' ? acc + item.amount : acc - item.amount;
            }
            return acc;
        }, 0);
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
        const updatedGoal = {
            ...goal,
            currentAmount: (goal.currentAmount || 0) + amount,
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
        const updatedGoal = {
            ...goal,
            currentAmount: Math.max(0, (goal.currentAmount || 0) - amount),
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
            // Variation between 0.8 and 1.4 for dynamism
            // We use sin/cos for a "wave" like feel rather than pure chaos if desired, or just random
            // User requested variability: "200, 150, 180, 250" -> Random-ish
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

        const currentAmount = (goal.currentAmount || 0) + simulatedAdditionalAmount;
        const remainingAmount = Math.max(0, goal.targetAmount - currentAmount);

        if (remainingAmount <= 0) return 0;

        // DYNAMIC NON-LINEAR DISTRIBUTION
        if (goal.calculationMethod === 'dynamic') {
            const weights = getGoalMonthlyWeights(goal);

            // Calculate current month index relative to start
            const monthsPassed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());

            // If we are past the deadline, pay everything
            if (monthsPassed >= weights.length) return remainingAmount;

            // If we are before start (shouldn't happen often), assume start
            const currentIndex = Math.max(0, monthsPassed);

            // Sum remaining weights (inclusive of current month)
            let sumRemainingWeights = 0;
            for (let i = currentIndex; i < weights.length; i++) {
                sumRemainingWeights += weights[i];
            }

            // Safety div by zero
            if (sumRemainingWeights === 0) return remainingAmount;

            const currentWeight = weights[currentIndex];

            // Stability: We need to account for what has *already* been paid this month to show the "Remainder of Quota"
            // OR does the user want the "Total Quota for Month"?
            // User context: "Cuota Requerida" generally implies what is due for the whole month.
            // But if I paid part of it, it usually decreases. 
            // However, the "Advance" logic relies on the "Quota" being a fixed target for the month.
            // Let's stick to: Quota is the total expected for the month given the Current Remaining Balance at Start of Month.

            // To do this accurately with "Start of Month" logic:
            const isCurrentMonth = today.getMonth() === new Date().getMonth() && today.getFullYear() === new Date().getFullYear();
            const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, today) : 0;
            const startOfMonthRemaining = remainingAmount + contributionsThisMonth;

            // Allocation for this month
            const allocationShare = currentWeight / sumRemainingWeights;
            const quotaTotalForMonth = startOfMonthRemaining * allocationShare;

            return Math.ceil(quotaTotalForMonth * 100) / 100;
        }

        // LINEAR / LEGACY LOGIC
        // Calculate Remaining Months (Future)
        const yearsDiff = deadlineDate.getFullYear() - today.getFullYear();
        const monthsDiff = deadlineDate.getMonth() - today.getMonth();
        let monthsRemaining = Math.max(1, (yearsDiff * 12) + monthsDiff);

        // STRATEGY: SPREAD (Default)
        if (goal.recoveryStrategy === 'spread' || !goal.recoveryStrategy) {
            // Stability: Add back this month's contributions to simulate "Start of Month" state
            const isCurrentMonth = today.getMonth() === new Date().getMonth() && today.getFullYear() === new Date().getFullYear();
            const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, today) : 0;

            const startOfMonthRemaining = remainingAmount + contributionsThisMonth;

            // Simple Linear Division
            const amount = startOfMonthRemaining / monthsRemaining;
            return Math.ceil(amount * 100) / 100;
        }

        // STRATEGY: CATCH UP
        // Total duration inclusive
        const totalMonths = Math.max(1, (deadlineDate.getFullYear() - startDate.getFullYear()) * 12 + (deadlineDate.getMonth() - startDate.getMonth()) + 1);
        // Months passed exclusive of current
        const monthsPassed = Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth()));

        const idealPerMonth = goal.targetAmount / totalMonths;
        const idealCumulative = idealPerMonth * monthsPassed;

        // Stability: Deficit based on start of month
        const isCurrentMonth = today.getMonth() === new Date().getMonth() && today.getFullYear() === new Date().getFullYear();
        const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, today) : 0;

        const startOfMonthCurrent = currentAmount - contributionsThisMonth;
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
        return goals.reduce((acc, goal) => {
            if (!goal.history || goal.history.length === 0) return acc;

            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const goalTotal = goal.history.reduce((hAcc, item) => {
                const itemDate = new Date(item.date);
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
