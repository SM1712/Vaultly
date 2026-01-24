import { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { useProjections } from '../hooks/useProjections';
import { useGoals } from '../hooks/useGoals';
import { useCredits } from '../hooks/useCredits';
import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';
import {
    Calendar, CheckCircle2, Circle, TrendingUp,
    Target, CreditCard, PiggyBank, Sparkles, AlertTriangle,
    ChevronLeft, ChevronRight, Plus, Calculator, X, LayoutList, Layers, Wallet,
    Gift, DollarSign, Heart, Flame, Star, Smile, Briefcase, Car, Plane, Home, Coffee, Gamepad2, Smartphone, MoreHorizontal,
    Pencil, Trash2, Telescope, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    format, addMonths, parseISO, startOfMonth, isAfter, endOfYear, eachMonthOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, ReferenceLine
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

export default function Projections() {
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

    // Simulation Form State
    const [isSimOpen, setIsSimOpen] = useState(false);
    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formType, setFormType] = useState<'income' | 'expense'>('expense');
    const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isMobileImpactOpen, setIsMobileImpactOpen] = useState(false);

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

    // --- FUTURE VISION ENGINE ---
    const futureVision = useMemo(() => {
        const start = addMonths(startOfMonth(selectedMonth), 1);
        const end = endOfYear(selectedMonth);

        // If current month is Dec or later, no future in this year (or we could show next year first month?)
        // Let's stick to "restante del año" as requested.
        if (isAfter(start, end)) return [];

        const months = eachMonthOfInterval({ start, end });
        let currentAccumulated = 0; // The user asked: "si ahorras el sobrante". So we accumulate Surplus.
        // Wait, "cuanto tendrias al final". Should we add the Final Balance of Current Month?
        // "si todos los meses ahorraras el sobrante" -> The starting point is likely the current money + future savings.
        // So let's start with 'finalBalance' of selected month.
        currentAccumulated = finalBalance;

        return months.map(month => {
            // Calculate strictly monthly flow (without initial balance from previous months to see pure surplus)
            const projection = calculateMonthlyProjection({
                targetMonth: month,
                scheduled,
                goals,
                credits,
                funds,
                simulatedTransactions: simTxs,
                initialBalance: 0,
                excludedIds: new Set(), // Assume full structure for future
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

    // --- ACTIONS ---
    const handleAddSim = () => {
        if (!formName || !formAmount) return;
        const targetDate = format(selectedMonth, 'yyyy-MM-dd'); // Strict to current month

        if (editingId) {
            updateSimulatedTransaction(editingId, {
                description: formName,
                amount: Number(formAmount),
                type: formType,
                date: targetDate
            });
            toast.success("Escenario actualizado");
        } else {
            addSimulatedTransaction({
                id: crypto.randomUUID(),
                description: formName,
                amount: Number(formAmount),
                type: formType,
                date: targetDate
            });
            toast.success("Escenario añadido");
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
            case 'goal': return { icon: Target, color: 'text-purple-500 bg-purple-500/10' };
            case 'credit': return { icon: CreditCard, color: 'text-orange-500 bg-orange-500/10' };
            case 'fund': return { icon: PiggyBank, color: 'text-blue-500 bg-blue-500/10' };
            case 'simulated': return { icon: Sparkles, color: 'text-indigo-500 bg-indigo-500/10' };
            default: return type === 'income' ? { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' } : { icon: Calendar, color: 'text-zinc-500 bg-zinc-500/10' };
        }
    };

    const getActionIcon = (fundIconName: string) => {
        return ICON_MAP[fundIconName] || PiggyBank;
    };

    const systemItems = timelineData.filter(i => i.source !== 'simulated');
    const simulatedItems = timelineData.filter(i => i.source === 'simulated');

    return (
        <div className="h-full w-full flex flex-col md:flex-row bg-white dark:bg-zinc-950 overflow-hidden font-sans">

            {/* --- LEFT: MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-50/50 dark:bg-zinc-950/50 relative overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">

                {/* Floating Header */}
                <div className="sticky top-0 z-20 px-4 pt-4 pb-2">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl shadow-indigo-500/5 rounded-3xl p-2 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">

                        {/* Month Navigator */}
                        <div className="flex items-center gap-4 pl-2">
                            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 border border-zinc-200 dark:border-zinc-700/50">
                                <button onClick={() => setSelectedMonth(m => addMonths(m, -1))} className="w-9 h-9 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded-full transition-all text-zinc-500 hover:text-indigo-600 hover:shadow-sm active:scale-95">
                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => setSelectedMonth(m => addMonths(m, 1))} className="w-9 h-9 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded-full transition-all text-zinc-500 hover:text-indigo-600 hover:shadow-sm active:scale-95">
                                    <ChevronRight size={16} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="flex flex-col">
                                <h2 className="text-xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100 uppercase leading-none">
                                    {format(selectedMonth, 'MMMM', { locale: es })}
                                </h2>
                                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
                                    {format(selectedMonth, 'yyyy', { locale: es })}
                                </span>
                            </div>
                        </div>

                        {/* Animated Segmented Tabs */}
                        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl relative border border-zinc-200 dark:border-zinc-700/50 w-full md:w-auto overflow-hidden">
                            {/* Animated Background Pill */}
                            <div
                                className={clsx(
                                    "absolute top-1 bottom-1 rounded-xl bg-white dark:bg-zinc-700 shadow-sm transition-all duration-300 ease-out z-0",
                                    activeTab === 'structure' ? "left-1 right-[66.66%]" :
                                        activeTab === 'scenarios' ? "left-[33.33%] right-[33.33%]" :
                                            "left-[66.66%] right-1"
                                )}
                            />

                            <button onClick={() => setStoreActiveView('structure')} className={clsx("relative z-10 flex-1 md:flex-none md:w-32 py-2 text-[11px] font-black uppercase tracking-wide text-center transition-colors duration-300 flex items-center justify-center gap-2", activeTab === 'structure' ? "text-indigo-600 dark:text-indigo-300" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400")}>
                                <LayoutList size={14} strokeWidth={2.5} /> Base
                            </button>
                            <button onClick={() => setStoreActiveView('scenarios')} className={clsx("relative z-10 flex-1 md:flex-none md:w-32 py-2 text-[11px] font-black uppercase tracking-wide text-center transition-colors duration-300 flex items-center justify-center gap-2", activeTab === 'scenarios' ? "text-indigo-600 dark:text-indigo-300" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400")}>
                                <Layers size={14} strokeWidth={2.5} /> Simulación
                            </button>
                            <button onClick={() => setStoreActiveView('vision')} className={clsx("relative z-10 flex-1 md:flex-none md:w-32 py-2 text-[11px] font-black uppercase tracking-wide text-center transition-colors duration-300 flex items-center justify-center gap-2", activeTab === 'vision' ? "text-fuchsia-600 dark:text-fuchsia-300" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400")}>
                                <Telescope size={14} strokeWidth={2.5} /> Visión
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area - Flow Container */}
                <div className="flex-1 p-4 pt-0 flex flex-col relative z-0">

                    {activeTab === 'structure' && (
                        <div className="flex-1 overflow-visible animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col">
                            {systemItems.length === 0 ? (
                                <div className="p-12 text-center opacity-40">
                                    <Calendar className="mx-auto mb-4 text-zinc-300" size={48} />
                                    <p className="text-sm font-medium">No hay estructura base para este mes</p>
                                </div>
                            ) : (
                                <div className="flex-1">
                                    {systemItems.map((item, idx) => {
                                        const { icon: Icon, color } = getSourceIcon(item.source, item.type);
                                        const isExcluded = item.isExcluded;
                                        return (
                                            <div
                                                key={item.id + idx + 'sys'}
                                                onClick={() => toggleExclusion(item.id)}
                                                className={clsx(
                                                    "flex items-center gap-4 p-4 mb-2 rounded-2xl border transition-all duration-300 group select-none cursor-pointer",
                                                    isExcluded
                                                        ? "bg-zinc-50/50 dark:bg-zinc-900/30 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60 grayscale"
                                                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                                                )}
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className={clsx("transition-colors flex-none", isExcluded ? "text-zinc-300" : "text-zinc-900 dark:text-zinc-100")}>
                                                    {!isExcluded ? <CheckCircle2 size={20} className="fill-indigo-500 text-white dark:fill-indigo-400 dark:text-zinc-900" /> : <Circle size={20} />}
                                                </div>
                                                <div className="w-10 text-center flex-none">
                                                    <span className="block text-xl font-black leading-none text-zinc-300 dark:text-zinc-700">{format(parseISO(item.date), 'dd')}</span>
                                                </div>
                                                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-none shadow-sm transition-transform group-hover:scale-110", color)}>
                                                    <Icon size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={clsx("font-extrabold text-sm truncate text-zinc-700 dark:text-zinc-200", isExcluded && "line-through")}>{item.name}</h4>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                                        {item.source === 'scheduled' ? 'Recurrente' : item.source === 'goal' ? 'Meta' : item.source === 'credit' ? 'Crédito' : 'Fondo'}
                                                    </span>
                                                </div>
                                                <div className="text-right flex-none">
                                                    <span className={clsx("block font-black text-base", item.type === 'income' ? "text-emerald-500" : "text-zinc-900 dark:text-zinc-100", isExcluded && "text-zinc-400 line-through")}>
                                                        {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'scenarios' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-4 flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-visible flex flex-col">
                                {simulatedItems.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                        <Sparkles className="mx-auto mb-2 text-indigo-200" size={32} />
                                        <p className="text-sm font-medium text-zinc-400 text-pretty max-w-[200px]">
                                            Crea simulaciones para {format(selectedMonth, 'MMMM', { locale: es })}
                                        </p>
                                        <p className="text-xs text-zinc-300 mt-2">Solo afectan a este mes</p>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        {simulatedItems.map((item, idx) => {
                                            const { icon: Icon, color } = getSourceIcon(item.source, item.type);
                                            const isExcluded = item.isExcluded;
                                            return (
                                                <div key={item.id + idx + 'sim'}
                                                    className={clsx(
                                                        "flex items-center gap-4 p-4 mb-2 rounded-2xl border transition-all duration-300 group select-none",
                                                        isExcluded
                                                            ? "bg-zinc-50/50 dark:bg-zinc-900/30 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60 grayscale"
                                                            : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                                                    )}
                                                    style={{ animationDelay: `${idx * 50}ms` }}
                                                >
                                                    <div onClick={() => toggleExclusion(item.id)} className={clsx("transition-colors cursor-pointer flex-none", isExcluded ? "text-zinc-300" : "text-zinc-900 dark:text-zinc-100")}>
                                                        {!isExcluded ? <CheckCircle2 size={20} className="fill-indigo-500 text-white dark:fill-indigo-400 dark:text-zinc-900" /> : <Circle size={20} />}
                                                    </div>
                                                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-none", color)}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-extrabold text-sm truncate text-zinc-700 dark:text-zinc-200">{item.name}</h4>
                                                        <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
                                                            <button onClick={() => handleEditSim(item)} className="text-[10px] font-bold text-zinc-400 hover:text-indigo-500 flex items-center gap-1 transition-colors">
                                                                <Pencil size={12} /> EDITAR
                                                            </button>
                                                            <button onClick={() => removeSimulatedTransaction(item.id)} className="text-[10px] font-bold text-zinc-400 hover:text-rose-500 flex items-center gap-1 transition-colors">
                                                                <Trash2 size={12} /> ELIMINAR
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-none">
                                                        <span className={clsx("block font-black text-base", item.type === 'income' ? "text-emerald-500" : "text-zinc-900 dark:text-zinc-100")}>
                                                            {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {!isSimOpen ? (
                                <button onClick={() => setIsSimOpen(true)} className="w-full p-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex items-center justify-center gap-2 text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all font-bold text-sm group">
                                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 text-zinc-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                                        <Plus size={14} />
                                    </div>
                                    Añadir Escenario Mensual
                                </button>
                            ) : (
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-indigo-500/5 border border-indigo-200 dark:border-indigo-900/30 overflow-hidden animate-in slide-in-from-bottom-2 ring-1 ring-indigo-500/20">
                                    <div className="p-4 space-y-4">
                                        {/* Header & Toggle */}
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center gap-2">
                                                <Sparkles size={12} /> Nuevo Escenario
                                            </h4>
                                            <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                                                <button onClick={() => setFormType('expense')} className={clsx("px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wide transition-all", formType === 'expense' ? "bg-white dark:bg-zinc-950 text-rose-500 shadow-sm ring-1 ring-rose-200 dark:ring-rose-900" : "text-zinc-400 hover:text-zinc-600")}>Gasto</button>
                                                <button onClick={() => setFormType('income')} className={clsx("px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wide transition-all", formType === 'income' ? "bg-white dark:bg-zinc-950 text-emerald-500 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-900" : "text-zinc-400 hover:text-zinc-600")}>Ingreso</button>
                                            </div>
                                        </div>

                                        {/* Main Inputs - Compact Row */}
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <input
                                                    autoFocus
                                                    placeholder="Concepto (ej. Cena, Bonus...)"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold outline-none focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 text-sm transition-all placeholder:font-medium placeholder:text-zinc-400"
                                                    value={formName}
                                                    onChange={e => { setFormName(e.target.value); setSelectedFundId(null); }}
                                                />
                                            </div>
                                            <div className="w-32 relative">
                                                <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-sm pointer-events-none">{currency}</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950 pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold outline-none focus:border-indigo-500 focus:ring-4 ring-indigo-500/10 text-sm text-right transition-all mobile-number-input"
                                                    value={formAmount}
                                                    onChange={e => setFormAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Actions - Clean Horizontal Scroll */}
                                        {funds.length > 0 && (
                                            <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                                                <div className="flex items-center justify-between mb-2 px-1">
                                                    <p className="text-[9px] uppercase font-bold text-zinc-400">Fondos Vinculados</p>
                                                    {selectedFundId && (
                                                        <button onClick={() => setSelectedFundId(null)} className="text-[9px] font-bold text-rose-400 hover:text-rose-500 flex items-center gap-1">
                                                            <X size={10} /> Desvincular
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                                                    {funds.map(f => {
                                                        const Icon = getActionIcon(f.icon);
                                                        const isSelected = selectedFundId === f.id;
                                                        const simAmount = Number(formAmount) || 0;
                                                        let projectedBalance = f.currentAmount;
                                                        if (formType === 'income') projectedBalance -= simAmount;
                                                        else projectedBalance += simAmount;

                                                        return (
                                                            <button
                                                                key={f.id}
                                                                onClick={() => applyFundShortcut(f.id, f.name, formType === 'income' ? 'withdraw' : 'deposit')}
                                                                className={clsx("flex-none group relative min-w-[120px] p-2.5 rounded-xl border transition-all text-left", isSelected ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20 ring-1 ring-indigo-500 shadow-sm" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700")}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-sm", isSelected ? "bg-indigo-100 text-indigo-600" : "bg-white dark:bg-zinc-800 text-zinc-400")}>
                                                                        <Icon size={10} />
                                                                    </div>
                                                                    <span className={clsx("text-[10px] font-bold truncate flex-1", isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-500 dark:text-zinc-400")}>{f.name}</span>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                                                        {isSelected ? (formType === 'income' ? 'Retirar' : 'Ahorrar') : 'Usar'}
                                                                    </span>
                                                                    {isSelected && simAmount > 0 ? (
                                                                        <span className={clsx("font-bold text-[10px]", projectedBalance >= f.currentAmount ? "text-emerald-500" : "text-rose-500")}>
                                                                            {currency}{projectedBalance.toLocaleString()}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-bold text-[10px] text-zinc-300 group-hover:text-zinc-500 transition-colors">
                                                                            {currency}{f.currentAmount.toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer Actions */}
                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <div className="flex-1 px-2">
                                                {selectedFundId && formType === 'income' && (
                                                    funds.find(f => f.id === selectedFundId)?.currentAmount! < (Number(formAmount) || 0) && (
                                                        <span className="text-[10px] font-bold text-rose-500 animate-pulse flex items-center gap-1">
                                                            <AlertTriangle size={10} /> Saldo insuficiente
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            <button onClick={() => setIsSimOpen(false)} className="px-4 py-2 text-zinc-400 text-xs font-bold hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddSim}
                                                disabled={!formName || !formAmount || (!!selectedFundId && formType === 'income' && (funds.find(f => f.id === selectedFundId)?.currentAmount || 0) < (Number(formAmount) || 0))}
                                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                {editingId ? 'Actualizar' : 'Crear Escenario'} <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'vision' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1 flex flex-col min-h-0 overflow-visible">
                            {futureVision.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <Telescope className="mx-auto mb-4 text-fuchsia-200" size={48} />
                                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">Fin de Año Alcanzado</h3>
                                    <p className="text-sm font-medium text-zinc-400 mt-2 max-w-[300px]">
                                        No quedan meses en este año para proyectar.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    {/* Header Vision - Sticky */}
                                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-fuchsia-50/30 dark:bg-fuchsia-900/5 flex items-center justify-between sticky top-0 backdrop-blur-md z-10">
                                        <div>
                                            <h3 className="text-lg font-black text-fuchsia-900 dark:text-fuchsia-100 flex items-center gap-2">
                                                <Sparkles size={18} className="text-fuchsia-500" />
                                                Proyección de Ahorro
                                            </h3>
                                            <p className="text-xs text-fuchsia-700/70 dark:text-fuchsia-300/70 font-medium mt-1">
                                                Si ahorras el excedente de cada mes hasta fin de año ({futureVision.length} meses)
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Total Acumulado</span>
                                            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                                {currency}{futureVision[futureVision.length - 1].accumulated.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vision List - Unified Scroll */}
                                    <div className="flex-1 overflow-visible flex flex-col mt-4">
                                        {futureVision.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl p-4 mb-2 flex items-center gap-4 hover:border-fuchsia-300 dark:hover:border-fuchsia-900/50 hover:shadow-lg hover:shadow-fuchsia-500/10 hover:-translate-y-0.5 transition-all duration-300 group select-none cursor-pointer"
                                                style={{ animationDelay: `${idx * 100}ms` }}
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-900/10 flex items-center justify-center border border-fuchsia-100 dark:border-fuchsia-900/20 font-black text-xs text-fuchsia-600 dark:text-fuchsia-400 shadow-sm group-hover:scale-110 transition-transform">
                                                    {format(item.date, 'MMM', { locale: es }).toUpperCase()}
                                                </div>

                                                <div className="flex-1 grid grid-cols-3 gap-4">
                                                    <div>
                                                        <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Flujo Mensual</span>
                                                        <div className="flex gap-3 text-xs font-black">
                                                            <span className="text-emerald-500">+{currency}{item.income.toLocaleString()}</span>
                                                            <span className="text-rose-500">-{currency}{item.expense.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Excedente (Ahorro)</span>
                                                        <div className={clsx("text-sm font-black transition-colors", item.surplus >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                            {item.surplus >= 0 ? '+' : ''}{currency}{item.surplus.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">Acumulado</span>
                                                        <div className="text-sm font-black text-zinc-700 dark:text-zinc-200 flex items-center gap-1 group-hover:text-fuchsia-600 transition-colors">
                                                            <TrendingUp size={14} className="text-zinc-400 group-hover:text-fuchsia-500 transition-colors" />
                                                            {currency}{item.accumulated.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* --- RIGHT: SUMMARY & IMPACT (Responsive: Sidebar on Desktop, Bottom Sheet on Mobile) --- */}
            < div
                className={
                    clsx(
                        "flex-none backdrop-blur-xl z-30 transition-all duration-300 ease-in-out shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] md:shadow-xl",
                        "md:w-[320px] lg:w-[360px] md:border-l md:border-t-0 border-t border-zinc-200/50 dark:border-zinc-800/50",
                        "fixed md:relative bottom-0 left-0 right-0 md:inset-auto bg-white/95 dark:bg-zinc-950/95 md:bg-zinc-50/80 md:dark:bg-zinc-950/80",
                        isMobileImpactOpen ? "h-[85vh]" : "h-[110px] md:h-auto"
                    )
                }
            >
                {/* Mobile Handle / Toggle */}
                < div onClick={() => setIsMobileImpactOpen(!isMobileImpactOpen)
                } className="md:hidden flex flex-col items-center pt-2 pb-1 cursor-pointer active:opacity-70" >
                    <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-700/50 rounded-full mb-3" />

                    {/* Compact Summary for Collapsed View */}
                    <div className={clsx("flex items-center justify-between w-full px-5 transition-all duration-300 absolute top-5", isMobileImpactOpen ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0")}>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Saldo Final</span>
                            <div className={clsx("text-xl font-black", finalBalance < 0 ? "text-rose-500" : "text-zinc-900 dark:text-zinc-100")}>
                                {currency}{finalBalance.toLocaleString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                            <div>
                                <span className="text-[8px] font-bold uppercase text-zinc-400 block tracking-wide">Ingreso</span>
                                <span className="text-xs font-black text-emerald-500">+{currency}{totalIncome.toLocaleString()}</span>
                            </div>
                            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                            <div>
                                <span className="text-[8px] font-bold uppercase text-zinc-400 block tracking-wide">Gasto</span>
                                <span className="text-xs font-black text-rose-500">-{currency}{totalExpense.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div >

                <div className={clsx("p-5 flex-1 flex flex-col justify-between overflow-hidden h-full", !isMobileImpactOpen && "hidden md:flex")}>
                    {/* Top Section */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <Calculator size={12} /> Impact Hub
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={clsx("text-[9px] font-bold uppercase tracking-wide", includeBalance ? "text-indigo-600" : "text-zinc-400")}>
                                    {includeBalance ? "Saldo Real" : "Solo Flujo"}
                                </span>
                                <button
                                    onClick={() => setToggle('includeGlobalBalance', !includeBalance)}
                                    className={clsx("w-8 h-4 rounded-full relative transition-colors", includeBalance ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700")}
                                >
                                    <div className={clsx("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform", includeBalance && "translate-x-4")} />
                                </button>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="mb-6 text-center">
                            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wide opacity-70">Saldo Final Proyectado</span>
                            <div className={clsx("text-5xl font-black tracking-tighter transition-all duration-300 mt-1", finalBalance < 0 ? "text-rose-500" : "text-zinc-900 dark:text-zinc-100")}>
                                <span className="text-2xl tracking-normal text-zinc-300 dark:text-zinc-700 mr-1">{currency}</span>
                                {finalBalance.toLocaleString()}
                            </div>
                            {lowestPoint < 0 && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md text-[10px] font-bold animate-pulse">
                                    <AlertTriangle size={10} /> Riesgo Negativo
                                </div>
                            )}
                        </div>

                        {/* Mini Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
                                <span className="text-[9px] font-bold uppercase text-zinc-400">Ingresos</span>
                                <div className="text-lg font-black text-emerald-500 mt-0.5">+{currency}{totalIncome.toLocaleString()}</div>
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
                                <span className="text-[9px] font-bold uppercase text-zinc-400">Gastos</span>
                                <div className="text-lg font-black text-rose-500 mt-0.5">-{currency}{totalExpense.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Chart - Flex Growth */}
                    <div className="flex-1 w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-3 shadow-sm relative overflow-hidden flex flex-col min-h-[150px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-50/50 dark:to-zinc-950/50 pointer-events-none" />

                        {/* Only render chart if visible (Desktop OR MobileOpen) to avoid Recharts 0-dimension errors */}
                        {(isMobileImpactOpen || window.innerWidth >= 768) && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData}>
                                    <defs>
                                        <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={finalBalance >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={finalBalance >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#71717a' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                        formatter={(value: any) => [`${currency}${Number(value).toLocaleString()}`, 'Saldo']}
                                        labelFormatter={(label) => {
                                            if (typeof label === 'number' && timelineData[label]) {
                                                return format(parseISO(timelineData[label].date), 'dd MMMM', { locale: es });
                                            }
                                            return label;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="balanceAfter"
                                        stroke={finalBalance >= 0 ? "#10b981" : "#f43f5e"}
                                        strokeWidth={3}
                                        fill="url(#chartGradient2)"
                                        animationDuration={500}
                                    />
                                    <ReferenceLine y={0} stroke="#e4e4e7" strokeDasharray="3 3" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Reset - Bottom */}
                    <div className="mt-4 pb-8 md:pb-0">
                        <button onClick={clearSimulation} className="w-full py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <X size={14} /> REINICIAR SIMULACIÓN
                        </button>
                    </div>

                </div>
            </div >

            {/* Padding at bottom of main content for mobile to account for fixed sheet */}
            < div className="h-[120px] md:hidden shrink-0" />

        </div >
    );
}
