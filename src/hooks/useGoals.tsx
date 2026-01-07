import { useFirestore } from './useFirestore';
import type { Goal } from '../types';

export const useGoals = () => {
    const { data: goals, add, remove, update } = useFirestore<Goal>('goals');

    const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount' | 'history'>) => {
        const newGoal = {
            ...goal,
            currentAmount: 0,
            history: []
        };
        add(newGoal);
    };

    const updateGoal = (id: string, data: Partial<Goal>) => {
        update(id, data);
    };

    const deleteGoal = (id: string) => {
        remove(id);
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

        update(id, {
            currentAmount: (goal.currentAmount || 0) + amount,
            lastContributionDate: today,
            history
        });
    };

    const withdraw = (id: string, amount: number, note?: string) => {
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

        update(id, {
            currentAmount: Math.max(0, (goal.currentAmount || 0) - amount),
            history
        });
    };

    const contributeToGoal = (id: string, amount: number) => {
        addContribution(id, amount, 'Cuota Mensual');
    };

    // Calculate dynamic monthly quota based on remaining time and remaining amount
    const getMonthlyQuota = (goal: Goal): number => {
        if (!goal.deadline) return 0; // Should not happen with new model, but safe check

        const today = new Date();
        const deadlineDate = new Date(goal.deadline);
        const remainingAmount = goal.targetAmount - goal.currentAmount;

        if (remainingAmount <= 0) return 0;

        // Calculate months remaining
        // Difference in months = (Year2 - Year1) * 12 + (Month2 - Month1)
        // If today is Jan 15 and Deadline is Feb 15, that's 1 month.
        // If today is Jan 15 and Deadline is Jan 25, that's < 1 month (so 1 installment basically)

        const yearsDiff = deadlineDate.getFullYear() - today.getFullYear();
        const monthsDiff = deadlineDate.getMonth() - today.getMonth();
        let monthsRemaining = (yearsDiff * 12) + monthsDiff;

        // If we are in the same month but before the deadline day? 
        // Let's treat current month as "1" if we haven't passed the deadline day-of-month? 
        // Simplified Logic: 
        // If deadline is in future full months: calculate valid months.
        // Minimum 1 month to avoid division by zero or infinity.

        if (monthsRemaining < 1) monthsRemaining = 1;

        // If user already paid something THIS month, technically the quota for "This Month" is reduced?
        // But the requirement is: "If I miss a month, recalculate".
        // Example: Target 1200, 12 months. Quota 100.
        // Month 1: I pay 0.
        // Month 2: Remainder 1200. Remainder Months 11. New Quota 109.
        // This is handled automatically by using (Target - Current) / RemainingMonths.

        return remainingAmount / monthsRemaining;
    };

    const isGoalPaidThisMonth = (goal: Goal) => {
        // With dynamic quotas, "Paid this month" is a bit fuzzy. 
        // Did they pay the *recalculated* quota? 
        // Let's say yes.
        const nav = new Date();
        // Get contributions in current month
        const contributionsThisMonth = getattrContributionsThisMonth(goal, nav);
        const required = getMonthlyQuota(goal);

        // Tolerance for floating point
        return contributionsThisMonth >= (required - 1);
    };

    const getattrContributionsThisMonth = (goal: Goal, date: Date) => {
        if (!goal.history) return 0;
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();

        return goal.history.reduce((acc, item) => {
            const [y, m] = item.date.split('-').map(Number);
            // Fix timezone issue by just parsing parts, already done
            if (y === targetYear && (m - 1) === targetMonth) {
                return item.type === 'deposit' ? acc + item.amount : acc - item.amount;
            }
            return acc;
        }, 0);
    }

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
