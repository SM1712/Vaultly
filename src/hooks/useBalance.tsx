import { useTransactions } from './useTransactions';
import { useGoals } from './useGoals';
import { useFunds } from './useFunds';
import { useFinance } from '../context/FinanceContext';

export const useBalance = () => {
    const { allTransactions } = useTransactions();
    const { goals } = useGoals();
    const { funds } = useFunds();
    const { selectedDate } = useFinance();

    const getBalanceAtDate = (date: Date) => {
        // Set to end of the day of the last day of the month (or just the date passed)
        const endOfPeriod = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        // 1. Transactions Guards
        const safeTransactions = allTransactions || [];
        const validTxs = safeTransactions.filter(t => {
            const tDate = new Date(t.date + 'T12:00:00');
            return tDate <= endOfPeriod;
        });

        const income = validTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = validTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        // 2. Goals (Saved) Guards
        const safeGoals = goals || [];
        const goalsSaved = safeGoals.reduce((acc, goal) => {
            if (!goal.history) return acc;
            const gTotal = goal.history.reduce((hAcc, item) => {
                const iDate = new Date(item.date + 'T12:00:00');
                if (iDate <= endOfPeriod) {
                    return item.type === 'deposit' ? hAcc + item.amount : hAcc - item.amount;
                }
                return hAcc;
            }, 0);
            return acc + Math.max(0, gTotal);
        }, 0);

        // 3. Funds (Saved) Guards
        const safeFunds = funds || [];
        const fundsSaved = safeFunds.reduce((acc, fund) => {
            if (!fund.history) return acc;
            const fTotal = fund.history.reduce((hAcc, item) => {
                const iDate = new Date(item.date + 'T12:00:00');
                if (iDate <= endOfPeriod) {
                    return item.type === 'deposit' ? hAcc + item.amount : hAcc - item.amount;
                }
                return hAcc;
            }, 0);
            return acc + Math.max(0, fTotal);
        }, 0);

        return (income - expenses) - (goalsSaved + fundsSaved);
    };

    // For the UI display (Historical)
    const availableBalance = getBalanceAtDate(selectedDate);

    // For Permission Checks (Today)
    const currentBalance = getBalanceAtDate(new Date());

    return { availableBalance, currentBalance, getBalanceAtDate };
};
