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
    Pencil, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    format, addMonths, endOfMonth, parseISO, startOfMonth, isBefore, isAfter, differenceInCalendarMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, ReferenceLine
} from 'recharts';
import { toast } from 'sonner';

// --- Types ---
type ProjectionItem = {
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

// Icon Map for dynamic rendering (Matches Funds.tsx)
const ICON_MAP: Record<string, React.ElementType> = {
    'gift': Gift,
    'money': DollarSign,
    'heart': Heart,
    'phoenix': Flame, // "Fenix"
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
    const activeTab = projections.activeView || 'structure';
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

    // --- ENGINE ---
    const { timelineData, finalBalance, totalIncome, totalExpense, lowestPoint } = useMemo(() => {
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        let items: Omit<ProjectionItem, 'balanceAfter' | 'isExcluded'>[] = [];

        // 1. Scheduled
        scheduled.forEach(sch => {
            if (!sch.active) return;
            // Check Start Date
            if (sch.createdAt && isBefore(end, parseISO(sch.createdAt))) return;

            try {
                let day = sch.dayOfMonth;
                if (!day) {
                    // @ts-ignore
                    if (sch.nextPaymentDate) day = new Date(sch.nextPaymentDate).getDate();
                    // @ts-ignore
                    else if (sch.startDate) day = new Date(sch.startDate).getDate();
                    else day = new Date(sch.createdAt).getDate();
                }
                const targetDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), Math.min(day, end.getDate()));
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
            // Date Logic
            const goalStart = parseISO(goal.startDate);
            if (isBefore(end, goalStart)) return; // Not started yet
            if (goal.deadline && isAfter(start, parseISO(goal.deadline))) return; // Already finished

            let quota = getMonthlyQuota(goal);
            if (quota <= 0 && goal.currentAmount < goal.targetAmount) quota = (goal.targetAmount - goal.currentAmount) / 12;
            if (quota < 0) quota = 0;
            let day = 1;
            try { day = new Date(goal.startDate).getDate(); } catch { }
            const targetDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), Math.min(day, end.getDate()));
            items.push({ id: goal.id, source: 'goal', date: format(targetDate, 'yyyy-MM-dd'), name: `Meta: ${goal.name}`, amount: quota, type: 'expense', originalObject: goal });
        });

        // 3. Credits
        credits.forEach(credit => {
            // Date Logic (Strict Month Count)
            const creditStart = parseISO(credit.startDate);
            const monthsElapsed = differenceInCalendarMonths(selectedMonth, creditStart);

            // If monthsElapsed is negative (before start) or greater/equal to term (finished), exclude.
            // Example: Term 6. Months 0,1,2,3,4,5 are strictly valid. 6 is finished.
            if (monthsElapsed < 0 || monthsElapsed >= credit.term) return;

            const { quota } = getCreditStatus(credit);
            let displayAmount = quota > 0 ? quota : credit.principal / credit.term;
            if (displayAmount < 0) displayAmount = 0;
            let day = 5;
            try { day = new Date(credit.startDate).getDate(); } catch { }
            const targetDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), Math.min(day, end.getDate()));
            items.push({ id: credit.id, source: 'credit', date: format(targetDate, 'yyyy-MM-dd'), name: `Crédito: ${credit.name}`, amount: displayAmount, type: 'expense', originalObject: credit });
        });

        // 4. Funds (AutoSave)
        funds.forEach(fund => {
            if (!fund.autoSaveConfig?.enabled) return;
            const day = fund.autoSaveConfig.dayOfMonth || 1;
            const targetDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), Math.min(day, end.getDate()));
            let amount = fund.autoSaveConfig.type === 'fixed' ? fund.autoSaveConfig.amount : (availableBalance * fund.autoSaveConfig.amount) / 100;
            items.push({ id: fund.id, source: 'fund', date: format(targetDate, 'yyyy-MM-dd'), name: `Fondo: ${fund.name}`, amount: amount, type: 'expense', originalObject: fund });
        });

        // 5. Simulated
        const today = new Date();
        simTxs.forEach(sim => {
            const date = (sim as any).date || format(today, 'yyyy-MM-dd');
            items.push({ id: sim.id, source: 'simulated', date: date, name: sim.description, amount: sim.amount, type: sim.type, originalObject: sim });
        });

        items.sort((a, b) => a.date.localeCompare(b.date));

        let runningBalance = includeBalance ? availableBalance : 0;
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
    }, [selectedMonth, scheduled, simTxs, availableBalance, excludedIds, goals, credits, funds, includeBalance]);

    // --- ACTIONS ---
    const handleAddSim = () => {
        if (!formName || !formAmount) return;

        if (editingId) {
            updateSimulatedTransaction(editingId, {
                description: formName,
                amount: Number(formAmount),
                type: formType,
                // @ts-ignore
                date: format(selectedMonth, 'yyyy-MM-dd')
            });
            toast.success("Escenario actualizado");
        } else {
            addSimulatedTransaction({
                id: crypto.randomUUID(),
                description: formName,
                amount: Number(formAmount),
                type: formType,
                // @ts-ignore
                date: format(selectedMonth, 'yyyy-MM-dd')
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

            {/* --- LEFT: LEDGER (Fluid) --- */}
            <div className="flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800 min-w-0">

                {/* Header */}
                <div className="flex-none bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 z-10">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-1 shadow-sm">
                                <button onClick={() => setSelectedMonth(m => addMonths(m, -1))} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-indigo-600"><ChevronLeft size={18} /></button>
                                <button onClick={() => setSelectedMonth(m => addMonths(m, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-indigo-600"><ChevronRight size={18} /></button>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">
                                    {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                        Proyección Mensual
                                    </span>
                                    <span className="text-xs font-medium text-zinc-400">
                                        • {timelineData.length} movimientos
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex px-4 gap-6">
                        <button onClick={() => setStoreActiveView('structure')} className={clsx("pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", activeTab === 'structure' ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300")}>
                            <LayoutList size={16} /> Estructura Mensual
                        </button>
                        <button onClick={() => setStoreActiveView('scenarios')} className={clsx("pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", activeTab === 'scenarios' ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300")}>
                            <Layers size={16} /> Escenarios & Extras
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-950/50 overflow-hidden flex flex-col">

                    {activeTab === 'structure' && (
                        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800 overflow-hidden animate-in fade-in duration-300 flex flex-col">
                            {systemItems.length === 0 ? (
                                <div className="p-12 text-center opacity-40">
                                    <Calendar className="mx-auto mb-4 text-zinc-300" size={48} />
                                    <p className="text-sm font-medium">No hay estructura base para este mes</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                    {systemItems.map((item, idx) => {
                                        const { icon: Icon, color } = getSourceIcon(item.source, item.type);
                                        const isExcluded = item.isExcluded;
                                        return (
                                            <div key={item.id + idx + 'sys'} onClick={() => toggleExclusion(item.id)} className={clsx("flex items-center gap-4 p-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group select-none last:border-0", isExcluded && "opacity-50 grayscale")}>
                                                <div className={clsx("transition-colors flex-none", isExcluded ? "text-zinc-300" : "text-zinc-900 dark:text-zinc-100")}>
                                                    {!isExcluded ? <CheckCircle2 size={18} className="fill-zinc-900 text-white dark:fill-zinc-100 dark:text-zinc-900" /> : <Circle size={18} />}
                                                </div>
                                                <div className="w-8 text-center flex-none">
                                                    <span className="block text-base font-bold leading-none text-zinc-700 dark:text-zinc-300">{format(parseISO(item.date), 'dd')}</span>
                                                </div>
                                                <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-none", color)}>
                                                    <Icon size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={clsx("font-bold text-sm truncate", isExcluded && "line-through")}>{item.name}</h4>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                                        {item.source === 'scheduled' ? 'Recurrente' : item.source === 'goal' ? 'Meta' : item.source === 'credit' ? 'Crédito' : 'Fondo'}
                                                    </span>
                                                </div>
                                                <div className="text-right flex-none">
                                                    <span className={clsx("block font-bold text-sm", item.type === 'income' ? "text-emerald-500" : "text-zinc-900 dark:text-zinc-100", isExcluded && "text-zinc-400 line-through")}>
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
                        <div className="animate-in fade-in duration-300 space-y-4 flex-1 flex flex-col min-h-0">
                            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800 overflow-hidden flex flex-col">
                                {simulatedItems.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                        <Sparkles className="mx-auto mb-2 text-indigo-200" size={32} />
                                        <p className="text-sm font-medium text-zinc-400">Sin escenarios creados</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                        {simulatedItems.map((item, idx) => {
                                            const { icon: Icon, color } = getSourceIcon(item.source, item.type);
                                            const isExcluded = item.isExcluded;
                                            return (
                                                <div key={item.id + idx + 'sim'} className={clsx("flex items-center gap-4 p-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group select-none last:border-0", isExcluded && "opacity-50 grayscale")}>
                                                    <div onClick={() => toggleExclusion(item.id)} className={clsx("transition-colors cursor-pointer flex-none", isExcluded ? "text-zinc-300" : "text-zinc-900 dark:text-zinc-100")}>
                                                        {!isExcluded ? <CheckCircle2 size={18} className="fill-zinc-900 text-white dark:fill-zinc-100 dark:text-zinc-900" /> : <Circle size={18} />}
                                                    </div>
                                                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-none", color)}>
                                                        <Icon size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                                        <div className="flex gap-2 mt-0.5">
                                                            <button onClick={() => handleEditSim(item)} className="text-[10px] font-bold text-zinc-400 hover:text-indigo-500 flex items-center gap-1 transition-colors">
                                                                <Pencil size={10} /> EDITAR
                                                            </button>
                                                            <button onClick={() => removeSimulatedTransaction(item.id)} className="text-[10px] font-bold text-zinc-400 hover:text-rose-500 flex items-center gap-1 transition-colors">
                                                                <Trash2 size={10} /> ELIMINAR
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-none">
                                                        <span className={clsx("block font-bold text-sm", item.type === 'income' ? "text-emerald-500" : "text-zinc-900 dark:text-zinc-100")}>
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
                                <button onClick={() => setIsSimOpen(true)} className="w-full p-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 flex items-center justify-center gap-2 text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all font-bold text-sm">
                                    <Plus size={18} /> Añadir Escenario
                                </button>
                            ) : (
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-2">
                                    <div className="p-5">
                                        <div className="flex gap-3 mb-4">
                                            <input autoFocus placeholder="Concepto" className="flex-1 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none focus:ring-2 ring-indigo-500/20 text-sm" value={formName} onChange={e => { setFormName(e.target.value); setSelectedFundId(null); }} />
                                            <input type="number" placeholder="Monto" className="w-28 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold outline-none focus:ring-2 ring-indigo-500/20 text-sm text-right" value={formAmount} onChange={e => setFormAmount(e.target.value)} />
                                        </div>

                                        {funds.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2 pl-1">Acciones Rápidas de Fondos</p>
                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                    {funds.map(f => {
                                                        const Icon = getActionIcon(f.icon);
                                                        const isSelected = selectedFundId === f.id;
                                                        const simAmount = Number(formAmount) || 0;
                                                        let projectedBalance = f.currentAmount;
                                                        // Withdraw (Income to wallet) => Remove from fund
                                                        if (formType === 'income') projectedBalance -= simAmount;
                                                        // Deposit (Expense from wallet) => Add to fund
                                                        else projectedBalance += simAmount;

                                                        return (
                                                            <div key={f.id} className={clsx("flex-none min-w-[140px] p-3 rounded-xl border transition-all", isSelected ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-500" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800")}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center transition-colors", isSelected ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400" : "bg-white dark:bg-zinc-800 text-zinc-500")}>
                                                                        <Icon size={12} />
                                                                    </div>
                                                                    <span className={clsx("text-[10px] font-bold truncate flex-1", isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-600 dark:text-zinc-400")}>{f.name}</span>
                                                                </div>

                                                                <div className="mb-2">
                                                                    <div className="text-[9px] text-zinc-400 uppercase font-bold">Saldo</div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{currency}{f.currentAmount.toLocaleString()}</span>
                                                                        {isSelected && simAmount > 0 && (
                                                                            <>
                                                                                <span className="text-[9px] text-zinc-300">→</span>
                                                                                <span className={clsx("font-bold text-xs", projectedBalance >= f.currentAmount ? "text-emerald-500" : "text-rose-500")}>{currency}{projectedBalance.toLocaleString()}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-1">
                                                                    <button onClick={() => applyFundShortcut(f.id, f.name, 'withdraw')} className={clsx("flex-1 py-1 rounded-lg border text-[9px] font-bold transition-colors flex justify-center items-center gap-1", isSelected && formType === 'income' ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-indigo-600 hover:border-indigo-200")}>
                                                                        Retirar
                                                                    </button>
                                                                    <button onClick={() => applyFundShortcut(f.id, f.name, 'deposit')} className={clsx("flex-1 py-1 rounded-lg border text-[9px] font-bold transition-colors flex justify-center items-center gap-1", isSelected && formType === 'expense' ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-indigo-600 hover:border-indigo-200")}>
                                                                        Ahorrar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                                                <button onClick={() => setFormType('expense')} className={clsx("px-3 py-1.5 rounded-md text-xs font-bold transition-all", formType === 'expense' ? "bg-white dark:bg-zinc-950 text-rose-500 shadow-sm" : "text-zinc-400 hover:text-zinc-500")}>Gasto</button>
                                                <button onClick={() => setFormType('income')} className={clsx("px-3 py-1.5 rounded-md text-xs font-bold transition-all", formType === 'income' ? "bg-white dark:bg-zinc-950 text-emerald-500 shadow-sm" : "text-zinc-400 hover:text-zinc-500")}>Ingreso</button>
                                            </div>
                                            <div className="flex-1 flex items-center justify-end px-2">
                                                {selectedFundId && formType === 'income' && (
                                                    funds.find(f => f.id === selectedFundId)?.currentAmount! < (Number(formAmount) || 0) && (
                                                        <span className="text-[10px] font-bold text-rose-500 animate-pulse">Fondos insuficientes</span>
                                                    )
                                                )}
                                            </div>
                                            <button onClick={() => setIsSimOpen(false)} className="px-3 py-1.5 text-zinc-400 text-xs font-bold hover:text-zinc-600">Cancelar</button>
                                            <button
                                                onClick={handleAddSim}
                                                disabled={!!selectedFundId && formType === 'income' && (funds.find(f => f.id === selectedFundId)?.currentAmount || 0) < (Number(formAmount) || 0)}
                                                className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT: SUMMARY & IMPACT (Compact Mode) --- */}
            <div className="md:w-[320px] lg:w-[360px] flex-none bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-l border-zinc-200/50 dark:border-zinc-800/50 flex flex-col z-20 shadow-xl">
                <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">

                    {/* Top Section */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <Calculator size={12} /> Impact Hub
                            </h3>
                            {/* Balance Toggle - Compact */}
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
                    </div>

                    {/* Reset - Bottom */}
                    <div className="mt-4">
                        <button onClick={clearSimulation} className="w-full py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <X size={14} /> REINICIAR SIMULACIÓN
                        </button>
                    </div>

                </div>
            </div>

        </div >
    );
}
