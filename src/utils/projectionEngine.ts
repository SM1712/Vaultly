import { format, endOfMonth, parseISO, startOfMonth, isBefore, isAfter, differenceInCalendarMonths } from 'date-fns';

export type ProjectionItem = {
    id: string;
    source: 'scheduled' | 'simulated' | 'goal' | 'credit' | 'fund';
    date: string;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    originalObject: any;
    balanceAfter: number;
    isExcluded: boolean;
};

type ProjectionCalculationParams = {
    targetMonth: Date;
    scheduled: any[];
    goals: any[];
    credits: any[];
    funds: any[];
    simulatedTransactions: any[];
    initialBalance: number;
    excludedIds: Set<string>;
    getMonthlyQuota: (goal: any) => number;
    getCreditStatus: (credit: any) => { quota: number };
    includeBalance: boolean;
};

export const calculateMonthlyProjection = ({
    targetMonth,
    scheduled,
    goals,
    credits,
    funds,
    simulatedTransactions,
    initialBalance,
    excludedIds,
    getMonthlyQuota,
    getCreditStatus,
    includeBalance
}: ProjectionCalculationParams) => {
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);
    let items: Omit<ProjectionItem, 'balanceAfter' | 'isExcluded'>[] = [];

    // 1. Scheduled
    scheduled.forEach(sch => {
        if (!sch.active) return;
        // Check Start Date
        if (sch.createdAt && isBefore(end, parseISO(sch.createdAt))) return;

        try {
            let day = sch.dayOfMonth;
            if (!day) {
                if (sch.nextPaymentDate) day = new Date(sch.nextPaymentDate).getDate();
                else if (sch.startDate) day = new Date(sch.startDate).getDate();
                else day = new Date(sch.createdAt).getDate();
            }
            const targetDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(day, end.getDate()));
            items.push({
                id: sch.id,
                source: 'scheduled',
                date: format(targetDate, 'yyyy-MM-dd'),
                name: sch.description,
                amount: sch.amount,
                type: sch.type,
                originalObject: sch
            });
        } catch (e) { }
    });

    // 2. Goals
    goals.forEach(goal => {
        const goalStart = parseISO(goal.startDate);
        if (isBefore(end, goalStart)) return;
        if (goal.deadline && isAfter(start, parseISO(goal.deadline))) return;

        let quota = getMonthlyQuota(goal);
        if (quota <= 0 && goal.currentAmount < goal.targetAmount) quota = (goal.targetAmount - goal.currentAmount) / 12;
        if (quota < 0) quota = 0;
        let day = 1;
        try { day = new Date(goal.startDate).getDate(); } catch { }
        const targetDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(day, end.getDate()));
        items.push({ id: goal.id, source: 'goal', date: format(targetDate, 'yyyy-MM-dd'), name: `Meta: ${goal.name}`, amount: quota, type: 'expense', originalObject: goal });
    });

    // 3. Credits
    credits.forEach(credit => {
        const creditStart = parseISO(credit.startDate);
        const monthsElapsed = differenceInCalendarMonths(targetMonth, creditStart);

        if (monthsElapsed < 0 || monthsElapsed >= credit.term) return;

        const { quota } = getCreditStatus(credit);
        let displayAmount = quota > 0 ? quota : credit.principal / credit.term;
        if (displayAmount < 0) displayAmount = 0;
        let day = 5;
        try { day = new Date(credit.startDate).getDate(); } catch { }
        const targetDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(day, end.getDate()));
        items.push({ id: credit.id, source: 'credit', date: format(targetDate, 'yyyy-MM-dd'), name: `Crédito: ${credit.name}`, amount: displayAmount, type: 'expense', originalObject: credit });
    });

    // 4. Funds (AutoSave)
    funds.forEach(fund => {
        if (!fund.autoSaveConfig?.enabled) return;
        const day = fund.autoSaveConfig.dayOfMonth || 1;
        const targetDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(day, end.getDate()));
        let amount = fund.autoSaveConfig.type === 'fixed' ? fund.autoSaveConfig.amount : (initialBalance * fund.autoSaveConfig.amount) / 100;
        items.push({ id: fund.id, source: 'fund', date: format(targetDate, 'yyyy-MM-dd'), name: `Fondo: ${fund.name}`, amount: amount, type: 'expense', originalObject: fund });
    });

    // 5. Simulated
    const monthStr = format(targetMonth, 'yyyy-MM-dd').substring(0, 7); // yyyy-MM
    simulatedTransactions.forEach(sim => {
        // STRICT MONTH CHECK
        const simDate = (sim as any).date;
        if (!simDate || !simDate.startsWith(monthStr)) return;

        items.push({ id: sim.id, source: 'simulated', date: simDate, name: sim.description, amount: sim.amount, type: sim.type, originalObject: sim });
    });

    items.sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = includeBalance ? initialBalance : 0;
    let inc = 0;
    let exp = 0;
    let low = runningBalance;

    const timeline: ProjectionItem[] = items.map(item => {
        const isExcluded = excludedIds.has(item.id);
        if (!isExcluded) {
            if (item.type === 'income') { runningBalance += item.amount; inc += item.amount; }
            else { runningBalance -= item.amount; exp += item.amount; }
        }
        if (runningBalance < low) low = runningBalance;
        return { ...item, balanceAfter: runningBalance, isExcluded };
    });

    return { timelineData: timeline, finalBalance: runningBalance, totalIncome: inc, totalExpense: exp, lowestPoint: low };
};
