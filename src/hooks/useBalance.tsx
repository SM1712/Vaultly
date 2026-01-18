import { useTransactions } from './useTransactions';
import { useGoals } from './useGoals';
import { useFunds } from './useFunds';
import { useFinance } from '../context/FinanceContext';
import { toCents, fromCents } from '../utils/financialUtils';
import { endOfMonth, isBefore, isEqual, endOfDay, parseISO } from 'date-fns';

export const useBalance = () => {
    const { allTransactions } = useTransactions();
    const { goals } = useGoals();
    const { funds } = useFunds();
    const { selectedDate } = useFinance();

    const getBalanceAtDate = (date: Date) => {
        // Robust End of Period: End of the last day of the month for the given date's month
        // logic: if we pass a random date, we usually mean "end of that specific day" or "end of that month"?
        // In the dashboard (comparisons), we usually pass "Last Day of Previous Month".
        // In current balance (Today), we mean "Now" or "End of Today"? 
        // Let's stick to "End of the Day" for the passed date to be inclusive.
        const endOfPeriod = endOfDay(date);

        // 1. Transactions Guards
        const safeTransactions = allTransactions || [];

        let incomeCents = 0;
        let expenseCents = 0;

        safeTransactions.forEach(t => {
            // Robust Date Parsing
            const tDate = parseISO(t.date); // Assumes YYYY-MM-DD
            // We compare if tDate is before or equal to endOfPeriod
            // Since t.date is usually just Day, parseISO gives start of that day (00:00).
            // So checks against endOfPeriod (23:59) work fine.
            if (isBefore(tDate, endOfPeriod) || isEqual(tDate, endOfPeriod)) {
                if (t.type === 'income') {
                    incomeCents += toCents(t.amount);
                } else {
                    expenseCents += toCents(t.amount);
                }
            }
        });

        // 2. Goals (Saved) Guards
        const safeGoals = goals || [];
        let goalsSavedCents = 0;

        safeGoals.forEach(goal => {
            if (!goal.history) return;

            let gTotalCents = 0;
            goal.history.forEach(item => {
                const iDate = parseISO(item.date);
                if (isBefore(iDate, endOfPeriod) || isEqual(iDate, endOfPeriod)) {
                    if (item.type === 'deposit') {
                        gTotalCents += toCents(item.amount);
                    } else {
                        gTotalCents -= toCents(item.amount);
                    }
                }
            });
            // A goal cannot have negative saved amount logic generally, but if history allows, 
            // we treat "Saved" as the current holding which shouldn't impact balance negatively beyond 0 (debt?)
            // Usually we deduct what is IN the goal from the Available Balance.
            goalsSavedCents += Math.max(0, gTotalCents);
        });

        // 3. Funds (Saved) Guards
        const safeFunds = funds || [];
        let fundsSavedCents = 0;

        safeFunds.forEach(fund => {
            if (!fund.history) return;

            let fTotalCents = 0;
            fund.history.forEach(item => {
                const iDate = parseISO(item.date);
                if (isBefore(iDate, endOfPeriod) || isEqual(iDate, endOfPeriod)) {
                    if (item.type === 'deposit') {
                        fTotalCents += toCents(item.amount);
                    } else {
                        fTotalCents -= toCents(item.amount);
                    }
                }
            });
            fundsSavedCents += Math.max(0, fTotalCents);
        });

        // Calculation: (Income - Expense) - (GoalsSaved + FundsSaved)
        // Doing it in cents for final precision
        const balanceCents = (incomeCents - expenseCents) - (goalsSavedCents + fundsSavedCents);
        return fromCents(balanceCents);
    };

    // For the UI display (Historical)
    // When looking at a past month, we usually want the balance at the END of that month.
    // selectedDate is usually "Any day in the selected month".
    // So we should normalize to End of Month.
    const availableBalance = getBalanceAtDate(endOfMonth(selectedDate));

    // For Permission Checks (Today)
    const currentBalance = getBalanceAtDate(new Date());

    return { availableBalance, currentBalance, getBalanceAtDate };
};
