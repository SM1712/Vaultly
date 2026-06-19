import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { useGoals } from '../hooks/useGoals';
import { useFunds } from '../hooks/useFunds';
import { useCredits } from '../hooks/useCredits';
import { useBalance } from '../hooks/useBalance';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { useGamification } from '../context/GamificationContext';
import MonthSelector from '../components/MonthSelector';
import SavingsListModal from '../components/finance/SavingsListModal';
import LedgerModal from '../components/finance/LedgerModal';
import { ArtNumber } from '../components/ui/ArtNumber';
import {
    Wallet, TrendingUp, TrendingDown, Target, BookOpen, Clock,
    AlertTriangle, Sparkles, Plus, Landmark, Send
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mini Sparkline component for trend indicators
const Sparkline = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => {
    return (
        <div className="h-10 w-full opacity-80 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill={`url(#gradient-${dataKey})`}
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { selectedDate } = useFinance();
    const { transactions, addTransaction } = useTransactions();
    const { goals, getTotalSavingsAtDate, isGoalPaidThisMonth, getMonthlyQuota, getMonthsRemaining } = useGoals();
    const { funds } = useFunds();
    const { scheduled } = useScheduledTransactions();
    const { credits, getCreditStatus } = useCredits();
    const { currency } = useSettings();
    const { availableBalance, getBalanceAtDate } = useBalance();

    // Modals state
    const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [quickInput, setQuickInput] = useState('');

    // Comparison Logic (Month over Month)
    const lastMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0);
    const lastMonthBalance = getBalanceAtDate(lastMonthDate);
    const balanceDiff = availableBalance - lastMonthBalance;
    const balancePercent = lastMonthBalance !== 0 ? (balanceDiff / Math.abs(lastMonthBalance)) * 100 : 0;

    // Savings calculations
    const lastMonthGoalsSaved = getTotalSavingsAtDate(lastMonthDate);
    const lastMonthFundsSaved = funds.reduce((acc, f) => {
        if (!f.history) return acc;
        const fTotal = f.history.reduce((hAcc, item) => {
            const iDate = new Date(item.date + 'T12:00:00');
            if (iDate <= lastMonthDate) {
                return item.type === 'deposit' ? hAcc + item.amount : hAcc - item.amount;
            }
            return hAcc;
        }, 0);
        return acc + Math.max(0, fTotal);
    }, 0);

    const lastMonthTotalSaved = lastMonthGoalsSaved + lastMonthFundsSaved;
    const currentTotalSaved = getTotalSavingsAtDate(selectedDate) + funds.reduce((acc, f) => acc + f.currentAmount, 0);
    const savingsDiff = currentTotalSaved - lastMonthTotalSaved;
    const savingsPercent = lastMonthTotalSaved !== 0 ? (savingsDiff / Math.abs(lastMonthTotalSaved)) * 100 : 0;

    // Filter transactions by selected month
    const currentMonthTransactions = useMemo(() => transactions.filter(t => {
        const [year, month] = t.date.split('-').map(Number);
        return month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();
    }), [transactions, selectedDate]);

    const totalIncome = useMemo(() => currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0), [currentMonthTransactions]);

    const totalExpenses = useMemo(() => currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0), [currentMonthTransactions]);

    const goalsSaved = getTotalSavingsAtDate(selectedDate);
    const fundsSaved = funds.reduce((acc, f) => acc + f.currentAmount, 0);
    const totalSaved = goalsSaved + fundsSaved;

    // Gamification
    const { checkAchievement } = useGamification();
    useEffect(() => {
        if (totalIncome > 0) {
            checkAchievement('BUDGET_CHECK', { income: totalIncome, expense: totalExpenses });
        }
    }, [totalIncome, totalExpenses, checkAchievement]);

    // Active credits for Net Worth calculation
    const activeCredits = useMemo(() => credits.filter(c => c.status === 'active'), [credits]);

    // Net Worth = Wallet Balance + Savings - Debts
    const netWorth = useMemo(() => {
        const debtTotal = activeCredits.reduce((acc, c) => {
            const status = getCreditStatus(c, selectedDate);
            return acc + status.remainingBalance;
        }, 0);
        return availableBalance + totalSaved - debtTotal;
    }, [availableBalance, totalSaved, activeCredits, getCreditStatus, selectedDate]);

    // Sparklines data for the last 6 months
    const sparklineData = useMemo(() => {
        const dataPoints = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfPeriod = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            const bal = getBalanceAtDate(endOfPeriod);

            const monthTxs = transactions.filter(t => {
                const [y, m] = t.date.split('-').map(Number);
                return y === d.getFullYear() && m === (d.getMonth() + 1);
            });

            const inc = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const exp = monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

            dataPoints.push({
                month: d.toLocaleString('es-ES', { month: 'short' }),
                balance: bal,
                income: inc,
                expense: exp
            });
        }
        return dataPoints;
    }, [transactions, getBalanceAtDate]);

    // Quick command transactions parsing (+100 Rent, -25 Food)
    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = quickInput.trim();
        if (!trimmed) return;

        const match = trimmed.match(/^([+-])\s*(\d+(?:\.\d{1,2})?)\s+(.+)$/);
        if (!match) {
            toast.error("Formato Inválido", {
                description: "Usa el formato rápido: '-50 Comida' o '+100 Salario'."
            });
            return;
        }

        const sign = match[1];
        const amount = Number(match[2]);
        const description = match[3];
        const type = sign === '+' ? 'income' : 'expense';
        const category = type === 'expense' ? 'Gasto Rápido' : 'Ingreso Rápido';
        const todayStr = new Date().toISOString().split('T')[0];

        const txId = addTransaction({
            amount,
            type,
            category,
            description,
            date: todayStr
        });

        if (txId) {
            toast.success(type === 'income' ? "Ingreso Registrado" : "Gasto Registrado", {
                description: `${sign}${currency}${amount.toLocaleString()} - ${description}`
            });
            setQuickInput('');
        }
    };

    // Financial Agenda / Alerts (Recurrent + Debts + Goals)
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const isCurrentMonthView = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const currentDay = isCurrentMonthView ? today.getDate() : (selectedDate > today ? 0 : 32);

    const upcoming = useMemo(() => {
        const alerts: any[] = [];

        // 1. Recurrent Scheduled
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

        // 2. Credits due payments
        activeCredits.forEach(c => {
            const startDate = new Date(c.startDate);
            const dayOfMonth = startDate.getDate();

            const paymentsThisMonth = c.payments?.some(p => {
                const d = new Date(p.date + 'T12:00:00');
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            if (!paymentsThisMonth) {
                const status = getCreditStatus(c, selectedDate);
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

        // 3. Savings goals quota
        goals.forEach(g => {
            const startDate = new Date(g.startDate);
            const deadlineDate = new Date(g.deadline);
            const isGoalActiveThisMonth =
                (currentYear > startDate.getFullYear() || (currentYear === startDate.getFullYear() && currentMonth >= startDate.getMonth())) &&
                (currentYear < deadlineDate.getFullYear() || (currentYear === deadlineDate.getFullYear() && currentMonth <= deadlineDate.getMonth()));

            if (isGoalActiveThisMonth && !isGoalPaidThisMonth(g)) {
                const quota = getMonthlyQuota(g, selectedDate);
                if (quota > 0) {
                    const dueDay = new Date(g.deadline).getDate();

                    alerts.push({
                        id: `goal_${g.id}`,
                        description: `Aporte: ${g.name}`,
                        category: 'Meta de Ahorro',
                        amount: quota,
                        type: 'expense',
                        dayOfMonth: dueDay,
                        source: 'goal'
                    });
                }
            }
        });

        return alerts.map(item => {
            const diff = item.dayOfMonth - currentDay;
            let status: 'overdue' | 'urgent' | 'normal' = 'normal';

            if (diff < 0) status = 'overdue';
            else if (diff <= 3) status = 'urgent';

            return { ...item, diff, status };
        }).sort((a, b) => a.dayOfMonth - b.dayOfMonth);

    }, [scheduled, activeCredits, goals, getCreditStatus, isGoalPaidThisMonth, getMonthlyQuota, selectedDate, currentMonth, currentYear, currentDay]);

    return (
        <div className="space-y-8 pb-24 md:pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header section with page title & date triggers */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        Panel de Control <span className="text-indigo-500 font-medium text-lg hidden sm:inline-block">Vaultly 2.0</span>
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">
                        Resumen financiero de {selectedDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsLedgerModalOpen(true)}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                        title="Ver Libro Mayor"
                    >
                        <BookOpen size={18} />
                        <span className="text-xs font-bold uppercase hidden md:inline">Libro Mayor</span>
                    </button>
                    <MonthSelector />
                </div>
            </header>

            {/* TIER 1: CORE WALLET HERO & QUICK ACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 1.1: Net Worth Card (Spans 8 cols) */}
                <div className="lg:col-span-8 flex flex-col justify-between">
                    <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 dark:from-black dark:via-zinc-950 dark:to-black text-zinc-100 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-800/80 group h-full flex flex-col justify-between">
                        {/* Glow decorative auroras */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/15 transition-colors duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

                        <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-indigo-400" /> Valor Neto Real
                                    </span>
                                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                                        <ArtNumber value={netWorth} symbol={currency} />
                                    </h1>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Fórmula: Disponible + Ahorro - Deudas activas
                                    </p>
                                </div>
                                <div className="p-3 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl text-zinc-300">
                                    <Wallet size={24} />
                                </div>
                            </div>

                            <div className="h-px bg-zinc-800/60 w-full"></div>

                            {/* Wallet details & savings indicators */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between">
                                    <div>
                                        <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block">Saldo Disponible</span>
                                        <span className="text-lg font-bold text-white tracking-tight"><ArtNumber value={availableBalance} symbol={currency} /></span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5",
                                            balanceDiff >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                        )}>
                                            {balanceDiff >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {Math.abs(balancePercent).toFixed(0)}%
                                        </span>
                                        <span className="text-[9px] text-zinc-500">MoM</span>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setIsSavingsModalOpen(true)}
                                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:bg-zinc-900 transition-colors"
                                >
                                    <div>
                                        <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block">Bolsa de Ahorro</span>
                                        <span className="text-lg font-bold text-indigo-300 tracking-tight"><ArtNumber value={totalSaved} symbol={currency} /></span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5",
                                            savingsDiff >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                        )}>
                                            {savingsDiff >= 0 ? '+' : ''}{Math.abs(savingsPercent).toFixed(0)}%
                                        </span>
                                        <span className="text-[9px] text-zinc-500">Aportes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1.2: Quick Action / Utility panel (Spans 4 cols) */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                    <div className="flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
                                Entrada Rápida
                            </h3>
                            {/* INTERACTIVE QUICK TRANSACTION BAR */}
                            <form 
                                onSubmit={handleQuickSubmit} 
                                className="theme-card theme-card-interactive group rounded-2xl p-3 flex items-center gap-3 bg-white/50 dark:bg-zinc-950/10 backdrop-blur-md"
                            >
                                <div 
                                    className="p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-inner"
                                    style={{ 
                                        backgroundColor: `color-mix(in srgb, var(--color-primary) 8%, transparent)`,
                                        color: `var(--color-primary)` 
                                    }}
                                >
                                    <Plus size={16} strokeWidth={3} className="group-focus-within:rotate-90 transition-transform duration-300" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Comando rápido... Ej: -45 Cena o +100 Premio"
                                    value={quickInput}
                                    onChange={e => setQuickInput(e.target.value)}
                                    className="flex-1 quick-bar-input text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 font-semibold focus:outline-none focus:ring-0"
                                />
                                <button
                                    type="submit"
                                    disabled={!quickInput.trim()}
                                    className={clsx(
                                        "p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm shrink-0",
                                        quickInput.trim()
                                            ? "hover:scale-105 active:scale-95 text-white"
                                            : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-605 opacity-45 cursor-not-allowed"
                                    )}
                                    style={{
                                        backgroundColor: quickInput.trim() ? 'var(--color-primary)' : undefined,
                                        boxShadow: quickInput.trim() ? '0 4px 12px var(--color-primary-glow)' : undefined
                                    }}
                                >
                                    <Send size={15} className={clsx(quickInput.trim() && "translate-x-[0.5px] -translate-y-[0.5px]")} />
                                </button>
                            </form>
                        </div>

                        {/* Extra visual summary / quick statistics to balance Tier 1 height */}
                        <div className="theme-card rounded-2xl p-4 flex-1 flex flex-col justify-between bg-zinc-50/40 dark:bg-zinc-900/10">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                                    Resumen Mensual
                                </h4>
                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Ingresos Totales</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-450"><ArtNumber value={totalIncome} symbol={currency} /></span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Gastos Totales</span>
                                        <span className="font-bold text-rose-600 dark:text-rose-450"><ArtNumber value={totalExpenses} symbol={currency} /></span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Visual balance slider indicator */}
                            <div className="mt-4 pt-3 border-t border-zinc-150 dark:border-zinc-850">
                                <div className="flex justify-between text-[9px] text-zinc-400 font-bold uppercase mb-1">
                                    <span>Tasa de Ahorro</span>
                                    <span>{totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ 
                                            width: `${totalIncome > 0 ? Math.max(0, Math.min(100, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100))) : 0}%`,
                                            backgroundColor: 'var(--color-primary)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TIER 2: TREND SPARKLINES (Horizontal summary cards) */}
            <div className="space-y-4">
                <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
                    Tendencias de Flujo (Últimos 6 meses)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 2.1: Sparkline Balance */}
                    <div className="theme-card rounded-2xl p-4 flex flex-col justify-between group">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Saldo Histórico</span>
                            <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-0.5"><ArtNumber value={availableBalance} symbol={currency} maximumFractionDigits={0} /></p>
                        </div>
                        <Sparkline data={sparklineData} dataKey="balance" color="var(--color-primary)" />
                    </div>

                    {/* 2.2: Sparkline Income */}
                    <div className="theme-card rounded-2xl p-4 flex flex-col justify-between group">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Flujo Ingresos</span>
                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5"><ArtNumber value={totalIncome} symbol={currency} maximumFractionDigits={0} /></p>
                        </div>
                        <Sparkline data={sparklineData} dataKey="income" color="#10b981" />
                    </div>

                    {/* 2.3: Sparkline Expenses */}
                    <div className="theme-card rounded-2xl p-4 flex flex-col justify-between group">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Flujo Gastos</span>
                            <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5"><ArtNumber value={totalExpenses} symbol={currency} maximumFractionDigits={0} /></p>
                        </div>
                        <Sparkline data={sparklineData} dataKey="expense" color="#f43f5e" />
                    </div>
                </div>
            </div>

            {/* TIER 3: FUTURE PLANNING & COMMITMENTS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 3.1: Saving Goals (Spans 7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h4 className="text-xs uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                            <Target size={14} className="text-emerald-500" /> Metas Principales
                        </h4>
                        <button onClick={() => navigate('/goals')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Ver todas
                        </button>
                    </div>

                    {goals.length === 0 ? (
                        <div className="theme-card rounded-2xl p-6 text-center text-zinc-400">
                            <p className="text-sm font-medium">No hay metas activas</p>
                            <button
                                onClick={() => navigate('/goals')}
                                className="mt-2 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-lg hover:opacity-85"
                            >
                                Definir Objetivo
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {goals.slice(0, 2).map(goal => {
                                const isPaid = isGoalPaidThisMonth(goal);
                                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                                return (
                                    <div
                                        key={goal.id}
                                        onClick={() => navigate('/goals')}
                                        className="theme-card rounded-2xl p-4 hover:-translate-y-0.5 transition-transform duration-300 group cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm truncate">{goal.name}</p>
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">{getMonthsRemaining(goal)} meses restantes</p>
                                            </div>
                                            <div className={clsx(
                                                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                                isPaid ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                                            )}>
                                                <Target size={14} />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between text-[9px] font-bold text-zinc-400 mb-1">
                                                <span>{percent}%</span>
                                                <span>{currency}{goal.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 group-hover:opacity-90"
                                                    style={{ 
                                                        width: `${percent}%`,
                                                        backgroundColor: 'var(--color-primary)'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 3.2: Agenda Timeline (Spans 5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 px-1 flex items-center gap-1.5">
                        <Clock size={14} /> Agenda de Compromisos
                    </h3>

                    <div className="theme-card rounded-2xl p-4 min-h-[350px]">
                        {upcoming.length > 0 ? (
                            <div className="space-y-1 relative">
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-zinc-100 dark:bg-zinc-800/80"></div>

                                {upcoming.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            if (item.source === 'credit') navigate('/credits');
                                            else if (item.source === 'goal') navigate('/goals');
                                            else if (item.source === 'scheduled') navigate('/expenses');
                                        }}
                                        className="relative flex gap-3.5 items-start py-3.5 group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 rounded-2xl transition-all px-2 cursor-pointer"
                                    >
                                        {/* Date Dot */}
                                        <div className={clsx(
                                            "relative z-10 w-9 h-9 shrink-0 rounded-full flex flex-col items-center justify-center border-2 font-black text-xs transition-colors shadow-sm",
                                            item.status === 'overdue' ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400" :
                                                item.status === 'urgent' ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-400" :
                                                    "bg-zinc-50 dark:bg-zinc-850/40 border-zinc-100 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-450"
                                        )}>
                                            <span>{item.dayOfMonth}</span>
                                        </div>

                                        {/* Detail text */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate pr-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                                    style={{ color: 'inherit' }}
                                                >
                                                    {item.description}
                                                </h4>
                                                <span className={clsx("font-mono font-bold text-xs shrink-0",
                                                    item.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-450"
                                                )}>
                                                    {item.type === 'income' ? '+' : '-'}{currency}{Math.round(item.amount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <span className={clsx(
                                                    "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider",
                                                    item.category === 'Meta de Ahorro' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" :
                                                    item.category === 'Crédito' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" :
                                                    "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                                )}>
                                                    {item.category === 'Meta de Ahorro' ? 'Meta' : item.category === 'Crédito' ? 'Deuda' : 'Recurrente'}
                                                </span>
                                                {item.status === 'overdue' && (
                                                    <span className="text-[8px] text-rose-500 dark:text-rose-400 font-extrabold flex items-center gap-0.5 uppercase">
                                                        <AlertTriangle size={8} /> Vencido
                                                    </span>
                                                )}
                                                {item.status === 'urgent' && (
                                                    <span className="text-[8px] text-amber-500 dark:text-amber-400 font-extrabold uppercase">
                                                        Cercano
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                                <Clock size={40} className="text-zinc-300 dark:text-zinc-700 mb-3" strokeWidth={1.5} />
                                <p className="text-xs text-zinc-500 font-bold uppercase">Agenda Vacía</p>
                                <p className="text-[10px] text-zinc-400 mt-1 max-w-[150px]">No tienes cobros pendientes registrados este mes.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Sub-modals declarations */}
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
