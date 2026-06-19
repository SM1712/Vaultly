import { useState, useMemo, useEffect } from 'react';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { useGoals } from '../hooks/useGoals';
import { useCredits } from '../hooks/useCredits';
import { useSettings } from '../context/SettingsContext';
import { useBalance } from '../hooks/useBalance';
import { useGamification } from '../context/GamificationContext';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    CreditCard, Target, Plus, TrendingUp, TrendingDown,
    Sparkles, Info, ArrowRight, Clock, HelpCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { GoalForm } from './Goals'; // Reusing Goal Form

// --- Types ---
type EventType = 'scheduled' | 'goal' | 'credit';

interface CalendarEvent {
    id: string;
    date: Date;
    type: EventType;
    title: string;
    amount: number;
    description?: string;
    status: 'pending' | 'completed' | 'overdue';
    details: any;
}

const Calendar = () => {
    const { checkAchievement } = useGamification();
    useEffect(() => {
        checkAchievement('CALENDAR_VIEWED');
    }, [checkAchievement]);

    const { currency, goalPreferences } = useSettings();
    const { scheduled, addScheduled, updateScheduled } = useScheduledTransactions();
    const { goals, addGoal, getMonthlyQuota } = useGoals();
    const { credits, getCreditStatus } = useCredits();
    const { getBalanceAtDate } = useBalance();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    // Quick Add State
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState<'expense' | 'income' | 'goal'>('expense');
    const [quickAddDate, setQuickAddDate] = useState<Date>(new Date());

    // Forms State
    const [txnForm, setTxnForm] = useState({ description: '', amount: '', category: 'Varios' });
    const [goalForm, setGoalForm] = useState({
        name: '', targetAmount: '', deadline: '', icon: 'target',
        calculationMethod: goalPreferences.defaultCalculationMethod
    });

    // --- Date Helpers ---
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // Mon-Sun (0-6)
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    // --- Event Generation ---
    const events = useMemo(() => {
        const evts: CalendarEvent[] = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        scheduled.forEach(item => {
            if (!item.active) return;
            const daysInMonth = getDaysInMonth(currentDate);
            const day = Math.min(item.dayOfMonth, daysInMonth);
            const evtDate = new Date(year, month, day);

            const lastProcessed = item.lastProcessedDate ? new Date(item.lastProcessedDate) : null;
            const isProcessedThisViewedMonth = lastProcessed &&
                lastProcessed.getMonth() === month &&
                lastProcessed.getFullYear() === year;

            evts.push({
                id: `sched-${item.id}-${month}-${year}`,
                date: evtDate,
                type: 'scheduled',
                title: item.description,
                amount: item.amount,
                status: isProcessedThisViewedMonth ? 'completed' : 'pending',
                details: item
            });
        });

        goals.forEach(goal => {
            const d = new Date(goal.deadline);
            const daysInMonth = getDaysInMonth(currentDate);
            const evtDate = new Date(year, month, daysInMonth);

            const startDate = new Date(goal.startDate);
            const isGoalActiveThisMonth =
                (year > startDate.getFullYear() || (year === startDate.getFullYear() && month >= startDate.getMonth())) &&
                (year < d.getFullYear() || (year === d.getFullYear() && month <= d.getMonth()));

            if (isGoalActiveThisMonth) {
                const quota = getMonthlyQuota(goal, currentDate);
                if (quota > 0) {
                    evts.push({
                        id: `goal-${goal.id}-${month}`,
                        date: evtDate,
                        type: 'goal',
                        title: `Meta: ${goal.name}`,
                        amount: quota,
                        description: 'Aporte sugerido meta',
                        status: 'pending',
                        details: goal
                    });
                }
            }
        });

        credits.forEach(credit => {
            if (credit.status === 'paid') return;
            const startStr = credit.startDate;
            if (startStr) {
                const day = parseInt(startStr.split('-')[2]);
                const daysInMonth = getDaysInMonth(currentDate);
                const dueDay = Math.min(day, daysInMonth);
                const evtDate = new Date(year, month, dueDay);
                const startDate = new Date(startStr);

                if (evtDate >= startDate) {
                    const { quota } = getCreditStatus(credit, currentDate);
                    evts.push({
                        id: `credit-${credit.id}-${month}`,
                        date: evtDate,
                        type: 'credit',
                        title: `Cuota: ${credit.name}`,
                        amount: quota,
                        description: 'Pago mensual crédito',
                        status: 'pending',
                        details: credit
                    });
                }
            }
        });

        return evts.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [currentDate, scheduled, goals, credits, getMonthlyQuota, getCreditStatus]);

    const daysInMonth = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const selectedEvents = events.filter(e => isSameDay(e.date, selectedDate));

    // --- Drag and Drop Handlers ---
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

        if (eventId.startsWith('sched-')) {
            const parts = eventId.split('-');
            const id = parts[1]; // actual scheduled transaction ID
            const targetDay = targetDate.getDate();

            updateScheduled(id, { dayOfMonth: targetDay });
            toast.success("Transacción Reprogramada", {
                description: `Se cambió la fecha de cobro al día ${targetDay} de cada mes.`
            });
        } else {
            toast.error("Acción no Permitida", {
                description: "Solo se pueden reprogramar y arrastrar transacciones recurrentes planificadas."
            });
        }
    };

    // --- Form Handlers ---
    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
    };

    const openQuickAdd = (date: Date) => {
        setQuickAddDate(date);
        setTxnForm({ description: '', amount: '', category: 'Varios' });
        setGoalForm({
            name: '',
            targetAmount: '',
            deadline: date.toISOString().split('T')[0],
            icon: 'target',
            calculationMethod: goalPreferences.defaultCalculationMethod
        });
        setIsQuickAddOpen(true);
    };

    const handleQuickAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (quickAddType === 'goal') {
            addGoal({
                ...goalForm,
                targetAmount: Number(goalForm.targetAmount),
                startDate: new Date().toISOString().split('T')[0],
                recoveryStrategy: goalPreferences.defaultRecoveryStrategy
            });
            toast.success("Meta Creada", {
                description: `La meta de ahorro "${goalForm.name}" fue programada con éxito.`
            });
        } else {
            if (!txnForm.description || !txnForm.amount) return;
            addScheduled({
                description: txnForm.description,
                amount: Number(txnForm.amount),
                type: quickAddType,
                category: txnForm.category,
                dayOfMonth: quickAddDate.getDate()
            });
        }
        setIsQuickAddOpen(false);
    };

    return (
        <div className="space-y-8 min-h-screen text-zinc-900 dark:text-zinc-100 pb-16">
            {/* Header Premium Obsidian & Aurora */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[80%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                            <Sparkles size={14} /> Agenda del Billetero
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-50 via-zinc-300 to-zinc-500 tracking-tight">
                            Calendario Futuro
                        </h1>
                        <p className="text-zinc-400 text-base max-w-lg">
                            Mapea tus cobros, metas y deudas recurrentes en el mes. Reprograma moviendo eventos entre días.
                        </p>
                    </div>

                    {/* Month Picker Controls */}
                    <div className="flex items-center gap-2 bg-neutral-950/60 backdrop-blur-xl p-1.5 rounded-2xl border border-neutral-800 self-start md:self-auto shadow-lg">
                        <button onClick={prevMonth} className="p-2.5 hover:bg-neutral-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="font-black text-sm w-36 text-center text-zinc-200 uppercase tracking-wider select-none">
                            {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-2.5 hover:bg-neutral-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Split Calendar & Sidebar Agenda */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          {/* Left Side: Calendar Month Grid (8 Cols) */}
                <div className="lg:col-span-8 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl overflow-visible">
                    {/* Week Days Headers */}
                    <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid cells */}
                    <div className="grid grid-cols-7 gap-2 md:gap-3">
                        {/* Empty padding offsets for start of month */}
                        {Array.from({ length: startDay }).map((_, i) => (
                            <div 
                                key={`empty-${i}`} 
                                className="min-h-[85px] md:min-h-[110px] bg-zinc-50/5 dark:bg-zinc-950/10 border border-transparent rounded-2xl opacity-10 pointer-events-none" 
                            />
                        ))}

                        {/* Month Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                            const dateStr = date.toDateString();
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const dayEvents = events.filter(e => isSameDay(e.date, date));
                            const isDraggedOver = dragOverDate === dateStr;

                            // Calculate daily projection metrics
                            let dayIncome = 0;
                            let dayExpenses = 0;
                            dayEvents.forEach(evt => {
                                if (evt.type === 'scheduled') {
                                    if (evt.details.type === 'income') dayIncome += evt.amount;
                                    else dayExpenses += evt.amount;
                                } else if (evt.type === 'goal' || evt.type === 'credit') {
                                    dayExpenses += evt.amount;
                                }
                            });

                            const dayProjectedBalance = getBalanceAtDate(date);

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleDayClick(date)}
                                    onDragOver={(e) => handleDragOver(e, dateStr)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, date)}
                                    className={clsx(
                                        "relative min-h-[85px] md:min-h-[110px] rounded-2xl border p-2.5 transition-all select-none group flex flex-col justify-between cursor-pointer hover:scale-[1.03] hover:shadow-lg duration-300 hover:z-20",
                                        isSelected 
                                            ? "bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-500 dark:border-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                                            : "bg-zinc-50/40 dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 shadow-sm",
                                        isDraggedOver && "bg-zinc-200 dark:bg-zinc-800/40 border-dashed border-zinc-400 dark:border-zinc-500 scale-[0.98]",
                                        isToday && "ring-2 ring-indigo-500/50 dark:ring-indigo-400/50"
                                    )}
                                >
                                    {/* Day Header */}
                                    <div className="flex justify-between items-start">
                                        <span className={clsx(
                                            "flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black transition-all",
                                            isSelected
                                                ? "bg-indigo-600 text-white dark:bg-indigo-500 shadow-md scale-105"
                                                : isToday
                                                    ? "text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/20" 
                                                    : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-zinc-200"
                                        )}>
                                            {i + 1}
                                        </span>
                                    </div>

                                    {/* Display Event list tags (Desktop) or Dots (Mobile) */}
                                    <div className="mt-2 space-y-1 overflow-hidden">
                                        {/* Mobile Dots representation */}
                                        <div className="flex flex-wrap gap-1 md:hidden">
                                            {dayEvents.map((evt, idx) => (
                                                <div
                                                    key={idx}
                                                    className={clsx(
                                                        "h-1.5 w-1.5 rounded-full shrink-0",
                                                        evt.type === 'scheduled' && evt.details.type === 'income' ? "bg-emerald-500" : "bg-rose-500"
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        {/* Desktop Cards Drag tags */}
                                        <div className="hidden md:block space-y-1">
                                            {dayEvents.slice(0, 2).map((evt) => {
                                                const isInflow = evt.type === 'scheduled' && evt.details.type === 'income';
                                                return (
                                                    <div
                                                        key={evt.id}
                                                        draggable="true"
                                                        onDragStart={(e) => handleDragStart(e, evt.id)}
                                                        className={clsx(
                                                            "text-[9px] font-bold px-2 py-0.5 rounded-md truncate w-full border cursor-grab active:cursor-grabbing shadow-sm",
                                                            isInflow 
                                                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                                                                : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                                                        )}
                                                    >
                                                        {evt.title}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 2 && (
                                                <span className="text-[8px] font-black text-zinc-500 block text-right px-1">
                                                    +{dayEvents.length - 2} más
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dynamic Hover CSS Tooltip (Dynamic alignment based on colIndex) */}
                                    {(() => {
                                        const colIndex = (startDay + i) % 7;
                                        const tooltipAlignClass = colIndex <= 1 
                                            ? "left-0 translate-x-0" 
                                            : colIndex >= 5 
                                                ? "right-0 left-auto translate-x-0" 
                                                : "left-1/2 -translate-x-1/2";
                                        return (
                                             <div className={clsx(
                                                 "absolute bottom-full mb-2 hidden group-hover:block z-30 w-60 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl pointer-events-none text-left",
                                                 tooltipAlignClass
                                             )}>
                                                 <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1.5">Proyección Diaria</span>
                                                 <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                                                     <div className="flex justify-between">
                                                         <span className="text-zinc-500 dark:text-zinc-400">Inyección:</span>
                                                         <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">+{currency}{dayIncome.toLocaleString()}</span>
                                                     </div>
                                                     <div className="flex justify-between">
                                                         <span className="text-zinc-500 dark:text-zinc-400">Cargos/Deudas:</span>
                                                         <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">-{currency}{dayExpenses.toLocaleString()}</span>
                                                     </div>
                                                     <div className="flex justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-800 font-bold text-zinc-800 dark:text-zinc-200">
                                                         <span className="text-zinc-500 dark:text-zinc-400">Wallet Proyectada:</span>
                                                         <span className="text-zinc-900 dark:text-zinc-100 font-mono font-black">{currency}{dayProjectedBalance.toLocaleString()}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Agenda Side Panel (4 Cols) */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                    <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 capitalize">
                                    {selectedDate.toLocaleDateString('es-ES', { weekday: 'long' })}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                                    {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button
                                onClick={() => openQuickAdd(selectedDate)}
                                className="w-11 h-11 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                                title="Planificar evento"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Scheduled List Timeline */}
                        <div className="relative min-h-[300px]">
                            {selectedEvents.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                    <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 mb-4 animate-pulse">
                                        <CalendarIcon size={20} />
                                    </div>
                                    <p className="text-zinc-700 dark:text-zinc-400 font-bold text-sm">Nada programado</p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 max-w-[170px] leading-relaxed">
                                        No hay cobros ni cargos recurrentes para este día.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative space-y-4">
                                    {/* Line connector */}
                                    <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

                                    {selectedEvents.map(evt => {
                                        const isInflow = evt.type === 'scheduled' && evt.details.type === 'income';

                                        return (
                                            <div key={evt.id} className="relative flex gap-4 items-start group hover:z-20">
                                                {/* Icon bubble type */}
                                                <div className={clsx(
                                                    "relative z-10 w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border shadow-sm transition-colors",
                                                    "bg-white dark:bg-zinc-950",
                                                    evt.type === 'scheduled' && evt.details.type === 'income' && "border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                                                    evt.type === 'scheduled' && evt.details.type === 'expense' && "border-rose-300 dark:border-rose-500/20 text-rose-700 dark:text-rose-400",
                                                    evt.type === 'credit' && "border-rose-300 dark:border-rose-500/20 text-rose-700 dark:text-rose-400",
                                                    evt.type === 'goal' && "border-blue-300 dark:border-blue-500/20 text-blue-700 dark:text-blue-400"
                                                )}>
                                                    {evt.type === 'scheduled' && evt.details.type === 'income' && <TrendingUp size={16} />}
                                                    {evt.type === 'scheduled' && evt.details.type === 'expense' && <TrendingDown size={16} />}
                                                    {evt.type === 'credit' && <CreditCard size={16} />}
                                                    {evt.type === 'goal' && <Target size={16} />}
                                                </div>

                                                {/* Details card content */}
                                                <div className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900/60 p-3.5 rounded-2xl">
                                                    <span className={clsx("text-[9px] font-black uppercase tracking-widest block mb-0.5",
                                                        isInflow ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
                                                    )}>
                                                        {evt.type === 'scheduled'
                                                            ? (evt.details.type === 'income' ? 'Cobro Recurrente' : 'Cargo Fijo')
                                                            : evt.type === 'credit' ? 'Amortización Deuda' : 'Plan Meta'}
                                                    </span>
                                                    <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate">{evt.title}</h4>
                                                    <p className="text-sm font-mono font-black text-zinc-900 dark:text-zinc-100 mt-1">
                                                        {isInflow ? '+' : ''}{currency}{evt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Modal */}
            <Modal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                title={`Planificar para el día ${quickAddDate.getDate()}`}
            >
                <div className="space-y-6 pt-2">
                    {/* Event Type Tabs */}
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl">
                        {(['expense', 'income', 'goal'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setQuickAddType(type)}
                                className={clsx(
                                    "flex-1 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all",
                                    quickAddType === type
                                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-800 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                                )}
                            >
                                {type === 'expense' ? 'Gasto Fijo' : type === 'income' ? 'Ingreso Fijo' : 'Meta'}
                            </button>
                        ))}
                    </div>

                    {quickAddType === 'goal' ? (
                        <GoalForm
                            formData={goalForm}
                            setFormData={setGoalForm}
                            onSubmit={handleQuickAddSubmit}
                            editingId={null}
                            onCancel={() => setIsQuickAddOpen(false)}
                            currency={currency}
                        />
                    ) : (
                        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Descripción o Servicio</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800"
                                    placeholder="Ej. Suscripción Netflix, Pago Alquiler..."
                                    value={txnForm.description}
                                    onChange={e => setTxnForm({ ...txnForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Monto Mensual ({currency})</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800"
                                    placeholder="0.00"
                                    value={txnForm.amount}
                                    onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Categoría Asignada</label>
                                <select
                                    className="w-full bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800"
                                    value={txnForm.category}
                                    onChange={e => setTxnForm({ ...txnForm, category: e.target.value })}
                                >
                                    <option value="Varios">Varios</option>
                                    <option value="Hogar">Hogar</option>
                                    <option value="Servicios">Servicios</option>
                                    <option value="Suscripciones">Suscripciones</option>
                                    <option value="Salud">Salud</option>
                                    <option value="Transporte">Transporte</option>
                                    <option value="Comida">Comida</option>
                                </select>
                            </div>

                            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 text-center italic font-semibold">
                                Se programará automáticamente para el día <strong>{quickAddDate.getDate()}</strong> de cada mes.
                            </p>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                            >
                                Registrar Programación
                            </button>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Calendar;
