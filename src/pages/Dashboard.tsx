import { useTransactions } from '../hooks/useTransactions';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { Wallet, TrendingUp, TrendingDown, Target, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useGoals } from '../hooks/useGoals';
import { useFunds } from '../hooks/useFunds';
import { useCredits } from '../hooks/useCredits'; // Added
import { useBalance } from '../hooks/useBalance';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { useGamification } from '../context/GamificationContext';
import MonthSelector from '../components/MonthSelector';
import SavingsListModal from '../components/finance/SavingsListModal';
import LedgerModal from '../components/finance/LedgerModal';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { Transaction } from '../types';

const Dashboard = () => {
    const navigate = useNavigate();
    const { selectedDate } = useFinance();
    const { transactions } = useTransactions();
    const { goals, getTotalSavingsAtDate, isGoalPaidThisMonth, getMonthlyQuota, getMonthsRemaining } = useGoals();
    const { funds } = useFunds();
    const { scheduled } = useScheduledTransactions();
    const { credits, getCreditStatus } = useCredits();
    const { currency } = useSettings();
    const { availableBalance, getBalanceAtDate } = useBalance();

    // Comparison Logic (Month over Month)
    const lastMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0); // Last day of previous month
    const lastMonthBalance = getBalanceAtDate(lastMonthDate);

    // Calculate percentage diff for Balance
    const balanceDiff = availableBalance - lastMonthBalance;
    const balancePercent = lastMonthBalance !== 0 ? (balanceDiff / Math.abs(lastMonthBalance)) * 100 : 0;

    // Savings Comparison
    const lastMonthGoalsSaved = getTotalSavingsAtDate(lastMonthDate);
    // For funds, we need history. If funds history exists, we could use it.
    // Assuming funds history structure matches goals or similar.
    // Simplifying: Use current funds vs ? Funds history logic is in useBalance already?
    // useBalance calculates fundsSaved inside getBalanceAtDate logic relative to date.
    // But here we need totals for the card "Ahorro Total".

    // Let's replicate "Ahorro Total" logic for Last Month
    const lastMonthFundsSaved = funds.reduce((acc, f) => {
        if (!f.history) return acc;
        const fTotal = f.history.reduce((hAcc, item) => {
            const iDate = new Date(item.date + 'T12:00:00');
            if (iDate <= lastMonthDate) {
                return item.type === 'deposit' ? hAcc + item.amount : hAcc - item.amount;
            }
            return hAcc;
        }, 0);
        return acc + Math.max(0, fTotal); // Assuming funds can't be negative contribution to savings total?
    }, 0);

    const lastMonthTotalSaved = lastMonthGoalsSaved + lastMonthFundsSaved;
    const currentTotalSaved = getTotalSavingsAtDate(selectedDate) + funds.reduce((acc, f) => acc + f.currentAmount, 0); // Re-calculate or use existing const if available.
    // Note: line 48 calculates totalSaved using current values. 
    // Wait, line 47 'funds.reduce((acc, f) => acc + f.currentAmount' uses currentAmount which is NOW.
    // If selectedDate is NOT now, 'funds saved' might be inaccurate if we rely on .currentAmount property.
    // However, for comparison, let's stick to the pattern.

    const savingsDiff = currentTotalSaved - lastMonthTotalSaved;
    const savingsPercent = lastMonthTotalSaved !== 0 ? (savingsDiff / Math.abs(lastMonthTotalSaved)) * 100 : 0;


    // Modals state
    const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

    // Filter transactions by selected month
    const currentMonthTransactions = transactions.filter(t => {

        const [year, month] = t.date.split('-').map(Number);
        return month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();
    });

    const totalIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const goalsSaved = getTotalSavingsAtDate(selectedDate);
    const fundsSaved = funds.reduce((acc, f) => acc + f.currentAmount, 0);
    const totalSaved = goalsSaved + fundsSaved;

    const { checkAchievement } = useGamification();

    useEffect(() => {
        if (totalIncome > 0) {
            checkAchievement('BUDGET_CHECK', { income: totalIncome, expense: totalExpenses });
        }
    }, [totalIncome, totalExpenses, checkAchievement]);

    useEffect(() => {
        if (totalIncome > 0) {
            checkAchievement('BUDGET_CHECK', { income: totalIncome, expense: totalExpenses });
        }
    }, [totalIncome, totalExpenses, checkAchievement]);

    // Calculate Balance using centralized hook
    // const { availableBalance } = useBalance(); // REMOVED: Already declared at top level

    // Calculate upcoming scheduled transactions

    // Calculate upcoming scheduled transactions
    // Unified Alerts Logic (Scheduled + Credits + Goals)
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const alerts: any[] = [];

    // 1. Scheduled Transactions
    const activeScheduled = scheduled.filter(s => s.active);
    activeScheduled.forEach(s => {
        const lastProcessed = s.lastProcessedDate ? new Date(s.lastProcessedDate + 'T12:00:00') : null;
        const processedThisMonth = lastProcessed && lastProcessed.getMonth() === currentMonth && lastProcessed.getFullYear() === currentYear;

        if (!processedThisMonth) {
            alerts.push({
                id: `sched_${s.id}`,
                description: s.description,
                category: s.category,
                amount: s.amount,
                type: s.type,
                dayOfMonth: s.dayOfMonth,
                source: 'scheduled'
            });
        }
    });

    // 2. Credits (Monthly Payments)
    const activeCredits = credits.filter(c => c.status === 'active');
    activeCredits.forEach(c => {
        const startDate = new Date(c.startDate);
        const dayOfMonth = startDate.getDate();

        const paymentsThisMonth = c.payments?.some(p => {
            const d = new Date(p.date + 'T12:00:00');
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        if (!paymentsThisMonth) {
            const status = getCreditStatus(c);
            alerts.push({
                id: `credit_${c.id}`,
                description: `Pago: ${c.name}`,
                category: 'Crédito',
                amount: status.quota,
                type: 'expense',
                dayOfMonth: dayOfMonth,
                source: 'credit'
            });
        }
    });

    // 3. Goals (Monthly Savings)
    goals.forEach(g => {
        if (!isGoalPaidThisMonth(g)) {
            const quota = getMonthlyQuota(g);
            const dueDay = new Date(g.deadline).getDate();

            alerts.push({
                id: `goal_${g.id}`,
                description: `Ahorro: ${g.name}`,
                category: 'Meta de Ahorro',
                amount: quota,
                type: 'expense',
                dayOfMonth: dueDay,
                source: 'goal'
            });
        }
    });

    // Sort and Add Status
    const upcoming = alerts.map(item => {
        const diff = item.dayOfMonth - currentDay;
        let status: 'overdue' | 'urgent' | 'normal' = 'normal';

        if (diff < 0) status = 'overdue';
        else if (diff <= 3) status = 'urgent';

        return { ...item, diff, status };
    }).sort((a, b) => a.dayOfMonth - b.dayOfMonth);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">Panel Principal</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        Resumen de {selectedDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsLedgerModalOpen(true)}
                        className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm active:scale-95"
                        title="Libro Contable"
                    >
                        <BookOpen size={20} />
                    </button>
                    <MonthSelector />
                </div>
            </div>

            {/* BENTO GRID HERO */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

                {/* 1. BALANCE HERO (Span 2 on Desktop) */}
                <div className="md:col-span-2 relative overflow-hidden bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-zinc-900/10 dark:shadow-none group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 dark:bg-zinc-200 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 transition-opacity group-hover:opacity-30"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-widest mb-1">Saldo Disponible</h3>
                                <p className="text-3xl sm:text-5xl font-black tracking-tighter">
                                    {currency}{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                {/* Comparativa Saldo */}
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={clsx("text-xs font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1",
                                        balanceDiff >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                    )}>
                                        {balanceDiff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {Math.abs(balancePercent).toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-medium">vs mes anterior ({currency}{lastMonthBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                                </div>
                            </div>
                            <div className="p-3 bg-zinc-800 dark:bg-zinc-200 rounded-2xl">
                                <Wallet size={24} className="text-zinc-400 dark:text-zinc-600" />
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-3">
                            <div
                                onClick={() => setIsSavingsModalOpen(true)}
                                className="cursor-pointer bg-zinc-800/50 dark:bg-zinc-200/50 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors border border-zinc-700/50 dark:border-zinc-300/50"
                            >
                                <div className="p-1.5 bg-blue-500/20 text-blue-400 dark:text-blue-600 rounded-lg">
                                    <Target size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-500">Ahorro Total</p>
                                    <p className="text-sm font-bold">{currency}{totalSaved.toLocaleString()}</p>
                                    <div className="flex items-center gap-1">
                                        <span className={clsx("text-[10px] font-bold", savingsDiff >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {savingsDiff >= 0 ? '+' : ''}{Math.abs(savingsPercent).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. INCOME CARD */}
                <div
                    onClick={() => navigate('/income')}
                    className="bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-700/50 hover:-translate-y-1 transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider transition-colors">Ingresos</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight">
                            {currency}{totalIncome.toLocaleString()}
                        </p>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-400/60 mt-1 font-medium">Este mes</p>
                    </div>
                </div>

                {/* 3. EXPENSE CARD */}
                <div
                    onClick={() => navigate('/expenses')}
                    className="bg-rose-50/60 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-700/50 hover:-translate-y-1 transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl transition-colors">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-xs font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-wider transition-colors">Gastos</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-rose-900 dark:text-rose-100 tracking-tight">
                            {currency}{totalExpenses.toLocaleString()}
                        </p>
                        <p className="text-xs text-rose-600/60 dark:text-rose-400/60 mt-1 font-medium">Este mes</p>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* LEFT COL: AGENDA (Timeline) */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Clock size={20} className="text-zinc-400" />
                        Agenda Financiera
                    </h3>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm min-h-[300px]">
                        {upcoming.length > 0 ? (
                            <div className="space-y-0 relative">
                                {/* Timeline Line */}
                                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-zinc-100 dark:bg-zinc-800"></div>

                                {upcoming.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            if (item.source === 'credit') navigate('/credits');
                                            else if (item.source === 'goal') navigate('/goals');
                                            else if (item.source === 'scheduled') navigate('/expenses');
                                        }}
                                        className="relative flex gap-4 items-start py-3 group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors px-2 cursor-pointer"
                                    >
                                        {/* Date Bubble */}
                                        <div className={clsx(
                                            "relative z-10 w-10 h-10 shrink-0 rounded-full flex flex-col items-center justify-center border-2 shadow-sm font-bold text-[10px] uppercase leading-none bg-white dark:bg-zinc-900 transition-colors",
                                            item.status === 'overdue' ? "border-rose-100 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 group-hover:border-rose-200" :
                                                item.status === 'urgent' ? "border-amber-100 text-amber-600 dark:border-amber-900/30 dark:text-amber-400 group-hover:border-amber-200" :
                                                    "border-zinc-100 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 group-hover:border-zinc-300 dark:group-hover:border-zinc-700"
                                        )}>
                                            <span className="text-base">{item.dayOfMonth}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.description}</h4>
                                                <span className={clsx("font-mono font-bold text-xs whitespace-nowrap",
                                                    item.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                )}>
                                                    {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-bold group-hover:bg-white dark:group-hover:bg-zinc-950 transition-colors shadow-sm">
                                                    {item.category}
                                                </span>
                                                {item.status === 'overdue' && <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> Vencido</span>}
                                                {item.status === 'urgent' && <span className="text-[10px] text-amber-500 font-bold">Pronto</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-50">
                                <Clock size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" strokeWidth={1} />
                                <p className="text-sm text-zinc-500 font-medium">Todo al día</p>
                                <p className="text-xs text-zinc-400">No tienes vencimientos pendientes este mes.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COL: GOALS (Grid) */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Target size={20} className="text-emerald-500" />
                            Metas Activas
                        </h3>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{goals.filter(g => !isGoalPaidThisMonth(g)).length} PENDIENTES</span>
                    </div>

                    {goals.length === 0 ? (
                        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-8 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-3">
                                <Target size={24} />
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium">Sin metas definidas</p>
                            <p className="text-sm text-zinc-500 mb-4 max-w-xs">Define un objetivo de ahorro para empezar a planificar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {goals.slice(0, 4).map(goal => { // Show max 4
                                const isPaid = isGoalPaidThisMonth(goal);
                                return (
                                    <div
                                        key={goal.id}
                                        onClick={() => navigate('/goals')}
                                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                                    isPaid ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-500 dark:group-hover:bg-blue-900/20"
                                                )}>
                                                    <Target size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate max-w-[120px]" title={goal.name}>{goal.name}</p>
                                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                                        {getMonthsRemaining(goal)} MESES
                                                    </p>
                                                </div>
                                            </div>
                                            {isPaid ? (
                                                <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-emerald-500/30 shadow-sm">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </span>
                                            ) : (
                                                <span className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-zinc-400">Cuota</span>
                                                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{Math.round(getMonthlyQuota(goal))}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Mini Progress Bar */}
                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                                                <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                                                <span>{currency}{goal.targetAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-1000 group-hover:bg-blue-500"
                                                    style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <SavingsListModal
                isOpen={isSavingsModalOpen}
                onClose={() => setIsSavingsModalOpen(false)}
            />

            <LedgerModal
                isOpen={isLedgerModalOpen}
                onClose={() => setIsLedgerModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
