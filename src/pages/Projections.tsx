import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { useProjections } from '../hooks/useProjections';
import { useGoals } from '../hooks/useGoals';
import { useCredits } from '../hooks/useCredits';
import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';
import { useGamification } from '../context/GamificationContext';
import {
    Calendar, CheckCircle2, Circle, TrendingUp, TrendingDown,
    Target, CreditCard, PiggyBank, Sparkles, AlertTriangle,
    ChevronLeft, ChevronRight, Plus, Calculator, X, LayoutList, Layers, Wallet,
    Gift, DollarSign, Heart, Flame, Star, Smile, Briefcase, Car, Plane, Home, Coffee, Gamepad2, Smartphone, MoreHorizontal,
    Pencil, Trash2, Telescope, ArrowRight, Clock, HelpCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    format, addMonths, parseISO, startOfMonth, isAfter, endOfYear, eachMonthOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, ReferenceLine, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { toast } from 'sonner';
import { calculateMonthlyProjection } from '../utils/projectionEngine';
import type { ProjectionItem } from '../utils/projectionEngine';

// Icon Map for dynamic rendering (Matches Funds.tsx)
const ICON_MAP: Record<string, React.ElementType> = {
    'gift': Gift,
    'money': DollarSign,
    'heart': Heart,
    'phoenix': Flame,
    'piggy': PiggyBank,
    'wallet': Wallet,
    'star': Star,
    'smile': Smile,
    'briefcase': Briefcase,
    'car': Car,
    'plane': Plane,
    'home': Home,
    'coffee': Coffee,
    'game': Gamepad2,
    'phone': Smartphone,
    'other': MoreHorizontal
};

const COLORS = [
    { id: 'emerald', class: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20', solidClass: 'bg-emerald-500', glow: 'rgba(16,185,129,0.3)' },
    { id: 'blue', class: 'text-blue-400 bg-blue-950/40 border-blue-500/20', solidClass: 'bg-blue-500', glow: 'rgba(59,130,246,0.3)' },
    { id: 'rose', class: 'text-rose-400 bg-rose-950/40 border-rose-500/20', solidClass: 'bg-rose-500', glow: 'rgba(244,63,94,0.3)' },
    { id: 'amber', class: 'text-amber-400 bg-amber-950/40 border-amber-500/20', solidClass: 'bg-amber-500', glow: 'rgba(245,158,11,0.3)' },
    { id: 'violet', class: 'text-violet-400 bg-violet-950/40 border-violet-500/20', solidClass: 'bg-violet-500', glow: 'rgba(139,92,246,0.3)' },
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    currency: string;
}

const CustomTooltip = ({ active, payload, currency }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl p-3 rounded-xl text-left">
                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-widest leading-none mb-1">Día {payload[0].payload.day}</p>
                <p className="font-mono font-black text-xs text-zinc-800 dark:text-zinc-150">
                    {currency}{payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function Projections() {
    const { checkAchievement } = useGamification();
    useEffect(() => {
        checkAchievement('PROJECTIONS_VIEWED');
    }, [checkAchievement]);

    const { currency } = useSettings();
    const { availableBalance } = useBalance();

    // Hooks
    const { scheduled } = useScheduledTransactions();
    const {
        projections, addSimulatedTransaction, removeSimulatedTransaction, updateSimulatedTransaction, clearSimulation,
        toggleExclusion, setActiveView: setStoreActiveView, setToggle
    } = useProjections();

    const simTxs = projections.simulatedTransactions || [];
    const excludedIds = new Set(projections.excludedIds || []);
    const activeTab = (projections.activeView || 'structure') as 'structure' | 'scenarios' | 'vision';
    const includeBalance = projections.toggles?.includeGlobalBalance ?? true;

    const { goals, getMonthlyQuota } = useGoals();
    const { credits, getCreditStatus } = useCredits();
    const { funds } = useFunds();

    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    // Simulation Form State
    const [isSimOpen, setIsSimOpen] = useState(false);
    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formType, setFormType] = useState<'income' | 'expense'>('expense');
    const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // --- Date Helpers ---
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(selectedMonth);

    // --- ENGINE ---
    const { timelineData, finalBalance, totalIncome, totalExpense, lowestPoint } = useMemo(() => {
        return calculateMonthlyProjection({
            targetMonth: selectedMonth,
            scheduled,
            goals,
            credits,
            funds,
            simulatedTransactions: simTxs,
            initialBalance: availableBalance,
            excludedIds,
            getMonthlyQuota,
            getCreditStatus,
            includeBalance
        });
    }, [selectedMonth, scheduled, simTxs, availableBalance, excludedIds, goals, credits, funds, includeBalance, getMonthlyQuota, getCreditStatus]);

    // --- DAILY BALANCE TIMELINE FOR CHART ---
    const dailyChartData = useMemo(() => {
        const dataPoints = [];
        let runningBalance = includeBalance ? availableBalance : 0;
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const days = getDaysInMonth(selectedMonth);

        // Group items by day
        const itemsByDay: Record<number, typeof timelineData> = {};
        timelineData.forEach(item => {
            if (item.isExcluded) return;
            const itemDay = new Date(item.date + 'T12:00:00').getDate();
            if (!itemsByDay[itemDay]) itemsByDay[itemDay] = [];
            itemsByDay[itemDay].push(item);
        });

        for (let day = 1; day <= days; day++) {
            const dayItems = itemsByDay[day] || [];
            dayItems.forEach(item => {
                if (item.type === 'income') {
                    runningBalance += item.amount;
                } else {
                    runningBalance -= item.amount;
                }
            });
            dataPoints.push({
                day,
                name: `Día ${day}`,
                balance: Math.round(runningBalance)
            });
        }
        return dataPoints;
    }, [selectedMonth, timelineData, availableBalance, includeBalance]);

    // --- FUTURE VISION ENGINE ---
    const futureVision = useMemo(() => {
        const start = addMonths(startOfMonth(selectedMonth), 1);
        const end = endOfYear(selectedMonth);

        if (isAfter(start, end)) return [];

        const months = eachMonthOfInterval({ start, end });
        let currentAccumulated = finalBalance;

        return months.map(month => {
            const projection = calculateMonthlyProjection({
                targetMonth: month,
                scheduled,
                goals,
                credits,
                funds,
                simulatedTransactions: simTxs,
                initialBalance: 0,
                excludedIds: new Set(),
                getMonthlyQuota,
                getCreditStatus,
                includeBalance: false
            });

            const surplus = projection.totalIncome - projection.totalExpense;
            currentAccumulated += surplus;

            return {
                date: month,
                formattedDate: format(month, 'MMMM', { locale: es }),
                income: projection.totalIncome,
                expense: projection.totalExpense,
                surplus: surplus,
                accumulated: currentAccumulated
            };
        });
    }, [selectedMonth, finalBalance, scheduled, goals, credits, funds, simTxs, getMonthlyQuota, getCreditStatus]);

    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (e: React.DragEvent, eventId: string) => {
        e.dataTransfer.setData('text/plain', eventId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        if (dragOverDate !== dateStr) {
            setDragOverDate(dateStr);
        }
    };

    const handleDragLeave = () => {
        setDragOverDate(null);
    };

    const handleDrop = (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        setDragOverDate(null);
        const eventId = e.dataTransfer.getData('text/plain');
        if (!eventId) return;

        const simTx = simTxs.find(tx => tx.id === eventId);
        if (simTx) {
            const targetDateStr = format(targetDate, 'yyyy-MM-dd');
            updateSimulatedTransaction(eventId, { date: targetDateStr });
            toast.success("Simulación Reprogramada", {
                description: `El escenario "${simTx.description}" se cambió al día ${targetDate.getDate()} de este mes.`
            });
        } else {
            toast.error("Acción No Permitida", {
                description: "Solo se pueden reprogramar escenarios simulados de esta línea de tiempo."
            });
        }
    };

    // --- ACTIONS ---
    const handleAddSim = () => {
        if (!formName || !formAmount) return;
        const targetDate = format(selectedMonth, 'yyyy-MM-05'); // Default to 5th day of selected month

        if (editingId) {
            updateSimulatedTransaction(editingId, {
                description: formName,
                amount: Number(formAmount),
                type: formType,
                date: targetDate
            });
            toast.success("Escenario Actualizado", {
                description: `El escenario simulado "${formName}" ha sido modificado con éxito.`
            });
        } else {
            addSimulatedTransaction({
                id: crypto.randomUUID(),
                description: formName,
                amount: Number(formAmount),
                type: formType,
                date: targetDate
            });
            toast.success("Escenario Simulado Creado", {
                description: `Se añadió el escenario "${formName}" a la proyección financiera.`
            });
        }

        setFormName('');
        setFormAmount('');
        setSelectedFundId(null);
        setEditingId(null);
        setIsSimOpen(false);
    };

    const handleEditSim = (item: ProjectionItem) => {
        setFormName(item.name);
        setFormAmount(item.amount.toString());
        setFormType(item.type);
        setEditingId(item.id);
        setIsSimOpen(true);
    };

    const applyFundShortcut = (fundId: string, fundName: string, type: 'withdraw' | 'deposit') => {
        if (type === 'withdraw') {
            setFormName(`Retiro de ${fundName}`);
            setFormType('income');
        } else {
            setFormName(`Aporte a ${fundName}`);
            setFormType('expense');
        }
        setSelectedFundId(fundId);
    };

    const getSourceIcon = (source: string, type: string) => {
        switch (source) {
            case 'goal': return { icon: Target, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-500/20' };
            case 'credit': return { icon: CreditCard, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/20' };
            case 'fund': return { icon: PiggyBank, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-500/20' };
            case 'simulated': return { icon: Sparkles, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/20' };
            default: return type === 'income' 
                ? { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/25' } 
                : { icon: Calendar, color: 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' };
        }
    };

    const getActionIcon = (fundIconName: string) => {
        return ICON_MAP[fundIconName] || PiggyBank;
    };

    const systemItems = timelineData.filter(i => i.source !== 'simulated');
    const simulatedItems = timelineData.filter(i => i.source === 'simulated');

    return (
        <div className="space-y-8 min-h-screen text-zinc-900 dark:text-zinc-100 pb-16">
            
            {/* Top Row: Chart Header Dashboard (Full width) */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 space-y-6">
                {/* Aurora decoration */}
                <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[80%] rounded-full bg-primary/5 dark:bg-primary/5 blur-[120px] pointer-events-none animate-pulse" />
                
                {/* Header Metrics Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Proyecciones de Caja</h1>
                            <div className="flex items-center gap-2 bg-zinc-100/80 dark:bg-zinc-950/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm">
                                <button onClick={() => setSelectedMonth(m => addMonths(m, -1))} className="p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="font-black text-xs w-28 text-center text-zinc-700 dark:text-zinc-300 uppercase tracking-wider select-none">
                                    {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                                </span>
                                <button onClick={() => setSelectedMonth(m => addMonths(m, 1))} className="p-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-450 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={12} /> Proyección Diaria de Liquidez del Mes
                        </p>
                    </div>

                    {/* Stats Widget */}
                    <div className="flex flex-wrap items-center gap-4 bg-zinc-100/50 dark:bg-zinc-950/40 p-3 rounded-[2rem] border border-zinc-200/80 dark:border-zinc-900/60 backdrop-blur-md">
                        {/* Ingresos KPI */}
                        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-all duration-300">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp size={16} />
                            </div>
                            <div className="text-left">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block leading-none mb-0.5">Ingresos</span>
                                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">+{currency}{totalIncome.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="w-[1px] h-8 bg-zinc-200 dark:bg-zinc-900" />
                        
                        {/* Egresos KPI */}
                        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-all duration-300">
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 dark:bg-rose-500/5 flex items-center justify-center border border-rose-500/20 text-rose-600 dark:text-rose-400">
                                <TrendingDown size={16} />
                            </div>
                            <div className="text-left">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block leading-none mb-0.5">Egresos</span>
                                <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">-{currency}{totalExpense.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div className="w-[1px] h-8 bg-zinc-200 dark:bg-zinc-900" />
                        
                        {/* Saldo Proyectado KPI */}
                        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-all duration-300">
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300",
                                finalBalance < 0 
                                    ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse" 
                                    : "bg-primary/10 border-primary/20 text-primary"
                            )}>
                                <Wallet size={16} />
                            </div>
                            <div className="text-left">
                                <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block leading-none mb-0.5">Saldo Proyectado</span>
                                <span className={clsx(
                                    "text-sm font-mono font-black transition-colors duration-300",
                                    finalBalance < 0 ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-zinc-850 dark:text-zinc-100"
                                )}>
                                    {currency}{finalBalance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                        {lowestPoint < 0 && (
                            <div className="ml-2 flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-wider animate-pulse">
                                <AlertTriangle size={10} /> Alerta
                            </div>
                        )}
                    </div>
                </div>

                {/* Big Area Chart Projection */}
                <div className="h-56 w-full bg-zinc-50/30 dark:bg-zinc-950/20 rounded-[2.0rem] border border-zinc-200/60 dark:border-zinc-900/40 p-4 relative overflow-hidden flex flex-col justify-end">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={finalBalance >= 0 ? "var(--color-primary)" : "#f43f5e"} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={finalBalance >= 0 ? "var(--color-primary)" : "#f43f5e"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(120, 120, 120, 0.06)" vertical={false} strokeDasharray="3 3" />
                            <RechartsTooltip
                                content={<CustomTooltip currency={currency} />}
                            />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke={finalBalance >= 0 ? "var(--color-primary)" : "#f43f5e"}
                                strokeWidth={3}
                                fill="url(#curveGradient)"
                            />
                            <XAxis dataKey="day" stroke="#71717a" fontSize={8} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={8} tickLine={false} axisLine={false} />
                            <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="3 3" opacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Split Layout: Event List (Left) & Scenario Desk (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Event List Feed (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex bg-zinc-100/80 dark:bg-zinc-900/40 p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md backdrop-blur-md shadow-sm">
                        <button
                            onClick={() => setStoreActiveView('structure')}
                            className={clsx(
                                "flex-1 py-2 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                activeTab === 'structure'
                                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm scale-[1.01]"
                                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            <LayoutList size={13} />
                            <span>Estructura Base</span>
                        </button>
                        <button
                            onClick={() => setStoreActiveView('scenarios')}
                            className={clsx(
                                "flex-1 py-2 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                activeTab === 'scenarios'
                                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm scale-[1.01]"
                                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            <Sparkles size={13} />
                            <span>Simulaciones</span>
                        </button>
                        <button
                            onClick={() => setStoreActiveView('vision')}
                            className={clsx(
                                "flex-1 py-2 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                                activeTab === 'vision'
                                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm scale-[1.01]"
                                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            <Telescope size={13} />
                            <span>Proyección Anual</span>
                        </button>
                    </div>

                    {/* Tab Panels */}
                    <div className="space-y-4">
                        
                        {/* BASE STRUCTURE LIST */}
                        {activeTab === 'structure' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                                {systemItems.length === 0 ? (
                                    <div className="py-16 text-center border border-zinc-200 dark:border-zinc-900 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col items-center">
                                        <Calendar className="text-zinc-400 dark:text-zinc-500 mb-3" size={32} />
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No hay estructura cargos/cobros recurrentes para este mes</p>
                                    </div>
                                ) : (
                                    systemItems.map((item, idx) => {
                                        const { icon: Icon, color } = getSourceIcon(item.source, item.type);
                                        const isExcluded = item.isExcluded;

                                        return (
                                            <div
                                                key={item.id + idx + 'sys'}
                                                onClick={() => toggleExclusion(item.id)}
                                                className={clsx(
                                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group select-none cursor-pointer",
                                                    isExcluded
                                                        ? "bg-zinc-200/40 dark:bg-zinc-950/20 border-dashed border-zinc-300 dark:border-zinc-900 opacity-55 grayscale"
                                                        : "bg-white/60 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-800 shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                <div className="flex-none">
                                                    {!isExcluded ? (
                                                        <CheckCircle2 size={18} className="fill-primary text-white dark:fill-primary dark:text-zinc-950" />
                                                    ) : (
                                                        <Circle size={18} className="text-zinc-400 dark:text-zinc-500" />
                                                    )}
                                                </div>
                                                
                                                {/* Calendar Sheet Date indicator */}
                                                <div className="flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-zinc-100/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-850 overflow-hidden flex-none">
                                                    <span className="w-full text-center py-0.5 text-[8px] font-black uppercase bg-zinc-200/50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-450 leading-none">
                                                        {format(parseISO(item.date), 'MMM', { locale: es })}
                                                    </span>
                                                    <span className="text-base font-black text-zinc-700 dark:text-zinc-300 leading-tight">
                                                        {format(parseISO(item.date), 'dd')}
                                                    </span>
                                                </div>

                                                <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-none border", color)}>
                                                    <Icon size={16} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className={clsx("font-bold text-xs truncate text-zinc-850 dark:text-zinc-200", isExcluded && "line-through text-zinc-400 dark:text-zinc-500")}>
                                                        {item.name}
                                                    </h4>
                                                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                                        {item.source === 'scheduled' ? 'Recurrente' : item.source === 'goal' ? 'Meta Ahorro' : 'Crédito Ordinario'}
                                                    </span>
                                                </div>

                                                <div className="text-right flex-none">
                                                    <span className={clsx("block font-mono font-bold text-sm", 
                                                        item.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-800 dark:text-zinc-200", 
                                                        isExcluded && "text-zinc-400 dark:text-zinc-500 line-through"
                                                    )}>
                                                        {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* SCENARIOS LIST (DRAGGABLE CARDS) */}
                        {activeTab === 'scenarios' && (
                            <div className="space-y-3 animate-in fade-in duration-300">
                                {simulatedItems.length === 0 ? (
                                    <div className="py-16 text-center border border-zinc-200 dark:border-zinc-900 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col items-center">
                                        <Sparkles className="text-zinc-400 dark:text-zinc-500 mb-3 animate-pulse" size={32} />
                                        <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Sin escenarios de simulación</h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
                                            Utiliza el panel de la derecha para agregar escenarios o simular aportes/retiros de tus bóvedas tácticas.
                                        </p>
                                    </div>
                                ) : (
                                    simulatedItems.map((item, idx) => {
                                        const { icon: Icon, color } = getSourceIcon(item.source, item.type);
                                        const isExcluded = item.isExcluded;

                                        return (
                                            <div
                                                key={item.id + idx + 'sim'}
                                                draggable="true"
                                                onDragStart={(e) => handleDragStart(e, item.id)}
                                                className={clsx(
                                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group select-none cursor-grab active:cursor-grabbing",
                                                    isExcluded
                                                        ? "bg-zinc-200/40 dark:bg-zinc-950/20 border-dashed border-zinc-300 dark:border-zinc-900 opacity-55 grayscale"
                                                        : "bg-white/60 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-800 shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                <div onClick={() => toggleExclusion(item.id)} className="flex-none cursor-pointer">
                                                    {!isExcluded ? (
                                                        <CheckCircle2 size={18} className="fill-primary text-white dark:fill-primary dark:text-zinc-950" />
                                                    ) : (
                                                        <Circle size={18} className="text-zinc-400 dark:text-zinc-500" />
                                                    )}
                                                </div>

                                                {/* Calendar Sheet Date indicator */}
                                                <div className="flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-zinc-100/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-850 overflow-hidden flex-none">
                                                    <span className="w-full text-center py-0.5 text-[8px] font-black uppercase bg-zinc-200/50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-450 leading-none">
                                                        {format(parseISO(item.date), 'MMM', { locale: es })}
                                                    </span>
                                                    <span className="text-base font-black text-zinc-700 dark:text-zinc-300 leading-tight">
                                                        {format(parseISO(item.date), 'dd')}
                                                    </span>
                                                </div>

                                                <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center flex-none border", color)}>
                                                    <Icon size={16} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className={clsx("font-bold text-xs truncate text-zinc-850 dark:text-zinc-200", isExcluded && "line-through text-zinc-400 dark:text-zinc-500")}>
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditSim(item)} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-0.5">
                                                            <Pencil size={10} /> EDITAR
                                                        </button>
                                                        <button onClick={() => removeSimulatedTransaction(item.id)} className="text-[9px] font-black text-rose-600 dark:text-rose-400 hover:text-rose-750 dark:hover:text-rose-400 flex items-center gap-0.5">
                                                            <Trash2 size={10} /> BORRAR
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-none">
                                                    <span className={clsx("block font-mono font-bold text-sm", 
                                                        item.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-450", 
                                                        isExcluded && "text-zinc-400 dark:text-zinc-500 line-through"
                                                    )}>
                                                        {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* FUTURE ACCUMULATED SAVINGS PROJECTION */}
                        {activeTab === 'vision' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                                {futureVision.length === 0 ? (
                                    <div className="py-16 text-center border border-zinc-200 dark:border-zinc-900 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col items-center">
                                        <Telescope className="text-zinc-400 dark:text-zinc-500 mb-3 animate-pulse" size={32} />
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">Fin de año alcanzado. No hay meses que proyectar.</p>
                                    </div>
                                ) : (
                                    futureVision.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white/60 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-900 flex items-center gap-4 hover:border-zinc-350 dark:hover:border-zinc-800 transition-all duration-300 group shadow-sm hover:shadow-md"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 flex items-center justify-center font-black text-xs text-primary group-hover:scale-105 transition-transform uppercase tracking-wider">
                                                {format(item.date, 'MMM', { locale: es })}
                                            </div>

                                            <div className="flex-1 grid grid-cols-3 gap-2 text-left">
                                                <div>
                                                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block mb-0.5">Flujo Mensual</span>
                                                    <div className="flex gap-2 text-[10px] font-bold font-mono">
                                                        <span className="text-emerald-600 dark:text-emerald-400">+{currency}{Math.round(item.income).toLocaleString()}</span>
                                                        <span className="text-rose-600 dark:text-rose-450">-{currency}{Math.round(item.expense).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block mb-0.5">Excedente Neto</span>
                                                    <span className={clsx("text-xs font-bold font-mono", item.surplus >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-455")}>
                                                        {item.surplus >= 0 ? '+' : ''}{currency}{Math.round(item.surplus).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block mb-0.5">Acumulado</span>
                                                    <span className="text-xs font-bold font-mono text-zinc-850 dark:text-zinc-200 block group-hover:text-primary transition-colors">
                                                        {currency}{Math.round(item.accumulated).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* Right Column: Scenario Simulator & Impact Desk (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* Droppable timeline bar for months */}
                    {activeTab === 'scenarios' && simulatedItems.length > 0 && (
                        <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-[2rem] space-y-3">
                            <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={13} className="text-primary" />
                                Línea de Reprogramación (Arrastra)
                            </h4>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-850 -mx-1 px-1">
                                {Array.from({ length: daysInMonth }).map((_, idx) => {
                                    const dayNum = idx + 1;
                                    const targetDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), dayNum);
                                    const dateStr = targetDate.toDateString();
                                    const isTargetDraggedOver = dragOverDate === dateStr;

                                    return (
                                        <div
                                            key={dayNum}
                                            onDragOver={(e) => handleDragOver(e, dateStr)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, targetDate)}
                                            className={clsx(
                                                "flex-none w-14 h-14 rounded-xl border flex flex-col items-center justify-center transition-all",
                                                isTargetDraggedOver 
                                                    ? "bg-primary/15 border-dashed border-primary scale-[0.98]" 
                                                    : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800"
                                            )}
                                        >
                                            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">Día</span>
                                            <span className="text-base font-black text-zinc-800 dark:text-zinc-200 mt-0.5">{dayNum}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Impact Hub Config Desk */}
                    <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900/80 pb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-450 flex items-center gap-1.5">
                                <Calculator size={13} />
                                Impact Desk
                            </h3>

                            {/* Global Balance Toggle */}
                            <div className="flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-955/40 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-900/60">
                                <span className={clsx("text-[9px] font-black uppercase tracking-wider px-1.5", includeBalance ? "text-primary font-extrabold" : "text-zinc-500 dark:text-zinc-400")}>
                                    {includeBalance ? "Disponible Wallet" : "Solo Flujo"}
                                </span>
                                <button
                                    onClick={() => setToggle('includeGlobalBalance', !includeBalance)}
                                    className={clsx(
                                        "w-8 h-4.5 rounded-full relative transition-all duration-300 border", 
                                        includeBalance 
                                            ? "bg-primary border-primary" 
                                            : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                                    )}
                                >
                                    <div className={clsx("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300", includeBalance && "translate-x-3.5")} />
                                </button>
                            </div>
                        </div>

                        {/* Reset Simulation */}
                        {simTxs.length > 0 && (
                            <button
                                onClick={clearSimulation}
                                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-900/40 rounded-xl transition-all"
                            >
                                Reiniciar Escenarios
                            </button>
                        )}

                        {/* Quick Fund Simulation Presets */}
                        {funds.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-450 uppercase tracking-widest">Inyección/Retiro desde Bóvedas</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {funds.map(f => {
                                        const Icon = getActionIcon(f.icon);
                                        return (
                                            <div key={f.id} className="bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-300 hover:shadow-md hover:scale-[1.01] space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                                                        <Icon size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate flex-1">{f.name}</span>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => applyFundShortcut(f.id, f.name, 'withdraw')}
                                                        className="flex-1 py-1.5 bg-white dark:bg-zinc-900 hover:bg-emerald-55/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-450 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-900/30 transition-all duration-200"
                                                    >
                                                        Retirar
                                                    </button>
                                                    <button
                                                        onClick={() => applyFundShortcut(f.id, f.name, 'deposit')}
                                                        className="flex-1 py-1.5 bg-white dark:bg-zinc-900 hover:bg-rose-55/20 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[9px] font-black uppercase tracking-wider text-zinc-550 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-455 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/30 transition-all duration-200"
                                                    >
                                                        Ahorrar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Manual Scenario Inputs */}
                        <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-900/80">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-450 uppercase tracking-widest">Simular Movimiento Manual</h4>
                                <div className="flex bg-zinc-100 dark:bg-zinc-950/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-900 relative">
                                    <button 
                                        onClick={() => setFormType('expense')} 
                                        className={clsx(
                                            "relative z-10 px-3.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300",
                                            formType === 'expense' 
                                                ? "text-rose-600 dark:text-rose-450 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-sm" 
                                                : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        Gasto
                                    </button>
                                    <button 
                                        onClick={() => setFormType('income')} 
                                        className={clsx(
                                            "relative z-10 px-3.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300",
                                            formType === 'income' 
                                                ? "text-emerald-600 dark:text-emerald-450 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-sm" 
                                                : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        Ingreso
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Concepto (ej. Vender Coche, Reformas...)"
                                    className="w-full bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all duration-200"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                />
                                
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-550 font-mono font-bold">{currency}</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all duration-200"
                                        value={formAmount}
                                        onChange={e => setFormAmount(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    {editingId && (
                                        <button
                                            onClick={() => {
                                                setFormName('');
                                                setFormAmount('');
                                                setEditingId(null);
                                                setSelectedFundId(null);
                                            }}
                                            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 border border-zinc-200 dark:border-zinc-700"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={handleAddSim}
                                        disabled={!formName || !formAmount}
                                        className={clsx(
                                            "py-3 bg-primary hover:bg-primary/95 text-white rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
                                            editingId ? "flex-1" : "w-full"
                                        )}
                                    >
                                        {editingId ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                                        <span>{editingId ? 'Guardar' : 'Simular Movimiento'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

        </div>
    );
}
