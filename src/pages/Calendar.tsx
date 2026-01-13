import { useState, useMemo } from 'react';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { useGoals } from '../hooks/useGoals';
import { useCredits } from '../hooks/useCredits';
import { useSettings } from '../context/SettingsContext';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    CreditCard, Target, Plus, TrendingUp, TrendingDown
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
    const { currency, goalPreferences } = useSettings();
    const { scheduled, addScheduled } = useScheduledTransactions();
    const { goals, addGoal, getMonthlyQuota } = useGoals();
    const { credits, getCreditStatus } = useCredits();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
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
            evts.push({
                id: `sched-${item.id}-${month}`,
                date: evtDate,
                type: 'scheduled',
                title: item.description,
                amount: item.amount,
                status: 'pending',
                details: item
            });
        });

        goals.forEach(goal => {
            const d = new Date(goal.deadline);
            if (d.getMonth() === month && d.getFullYear() === year) {
                const quota = getMonthlyQuota(goal);
                evts.push({
                    id: `goal-${goal.id}`,
                    date: d,
                    type: 'goal',
                    title: `Meta: ${goal.name}`,
                    amount: quota,
                    description: 'Cuota sugerida',
                    status: 'pending',
                    details: goal
                });
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
                    const { quota } = getCreditStatus(credit);
                    evts.push({
                        id: `credit-${credit.id}-${month}`,
                        date: evtDate,
                        type: 'credit',
                        title: `Pago: ${credit.name}`,
                        amount: quota,
                        description: 'Cuota estimada',
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

    // --- Handlers ---
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
            toast.success('Meta creada');
        } else {
            // Scheduled Txn
            if (!txnForm.description || !txnForm.amount) return;
            addScheduled({
                description: txnForm.description,
                amount: Number(txnForm.amount),
                type: quickAddType, // 'expense' or 'income'
                category: txnForm.category,
                dayOfMonth: quickAddDate.getDate()
            });
            toast.success('Transacción programada');
        }
        setIsQuickAddOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter flex items-center gap-2">
                        <CalendarIcon className="w-8 h-8 text-indigo-500" />
                        Calendario
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        Tu ventana al futuro financiero
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm self-start md:self-auto">
                    <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <ChevronLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <span className="font-bold text-sm md:text-base w-32 text-center text-zinc-900 dark:text-zinc-100 capitalize">
                        {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <ChevronRight size={20} className="text-zinc-600 dark:text-zinc-400" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                {/* CALENDAR GRID (Left Col - Span 2) */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden order-1">
                    {/* Week Days */}
                    <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                            <div key={d} className="text-center text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-wider py-4">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[120px] border-b border-r border-zinc-50 dark:border-zinc-800/30" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const dayEvents = events.filter(e => isSameDay(e.date, date));

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleDayClick(date)}
                                    className={clsx(
                                        "relative min-h-[80px] md:min-h-[120px] border-b border-r border-zinc-100 dark:border-zinc-800/50 p-2 transition-all cursor-pointer select-none group",
                                        isSelected ? "bg-indigo-50/30 dark:bg-indigo-900/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/20"
                                    )}
                                >
                                    {/* Date Number */}
                                    <div className="flex justify-between items-start">
                                        <span className={clsx(
                                            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
                                            isToday
                                                ? "bg-indigo-600 text-white shadow-md scale-110"
                                                : isSelected ? "text-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900" : "text-zinc-700 dark:text-zinc-300 group-hover:scale-110"
                                        )}>
                                            {i + 1}
                                        </span>
                                    </div>

                                    {/* Event Dots (Mobile/Desktop distinct) */}
                                    <div className="mt-2 flex flex-wrap gap-1 content-end">
                                        {dayEvents.map((evt, idx) => (
                                            <div
                                                key={idx}
                                                className={clsx(
                                                    "h-1.5 w-1.5 md:h-2 md:w-2 rounded-full",
                                                    evt.type === 'scheduled' && evt.details.type === 'income' && "bg-emerald-500",
                                                    evt.type === 'scheduled' && evt.details.type === 'expense' && "bg-rose-500",
                                                    evt.type === 'credit' && "bg-rose-500",
                                                    evt.type === 'goal' && "bg-blue-500"
                                                )}
                                                title={evt.title}
                                            />
                                        ))}
                                    </div>

                                    {/* Active Selection Indicator Bar (Mobile mainly) */}
                                    {isSelected && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500/50" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AGENDA PANEL (Right Col - Span 1) */}
                <div className="lg:col-span-1 lg:sticky lg:top-24 order-2 space-y-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                                    {selectedDate.toLocaleDateString('es-ES', { weekday: 'long' })}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                                    {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={() => openQuickAdd(selectedDate)}
                                className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zinc-900/20 dark:shadow-white/10"
                                title="Agregar Evento"
                            >
                                <Plus size={24} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Timeline */}
                        <div className="relative min-h-[300px]">
                            {selectedEvents.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50">
                                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-400 mb-4">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">Nada programado</p>
                                    <p className="text-xs text-zinc-500 mt-1 max-w-[150px]">Disfruta tu día libre o planifica algo nuevo.</p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {/* Timeline Line */}
                                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-100 dark:bg-zinc-800"></div>

                                    {selectedEvents.map(evt => (
                                        <div key={evt.id} className="relative flex gap-4 items-start py-3 group">
                                            {/* Icon Bubble */}
                                            <div className={clsx(
                                                "relative z-10 w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-colors",
                                                "bg-white dark:bg-zinc-900",
                                                evt.type === 'scheduled' && evt.details.type === 'income' && "border-emerald-100 text-emerald-600 dark:border-emerald-900/30 dark:text-emerald-400",
                                                evt.type === 'scheduled' && evt.details.type === 'expense' && "border-rose-100 text-rose-600 dark:border-rose-900/30 dark:text-rose-400",
                                                evt.type === 'credit' && "border-rose-100 text-rose-600 dark:border-rose-900/30 dark:text-rose-400",
                                                evt.type === 'goal' && "border-blue-100 text-blue-600 dark:border-blue-900/30 dark:text-blue-400"
                                            )}>
                                                {evt.type === 'scheduled' && evt.details.type === 'income' && <TrendingUp size={16} />}
                                                {evt.type === 'scheduled' && evt.details.type === 'expense' && <TrendingDown size={16} />}
                                                {evt.type === 'credit' && <CreditCard size={16} />}
                                                {evt.type === 'goal' && <Target size={16} />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pt-1 min-w-0 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={clsx("text-[10px] font-bold uppercase tracking-wider",
                                                        evt.type === 'scheduled' && evt.details.type === 'income' ? "text-emerald-500" : "text-zinc-400"
                                                    )}>
                                                        {evt.type === 'scheduled'
                                                            ? (evt.details.type === 'income' ? 'Ingreso Recurrente' : 'Pago Recurrente')
                                                            : evt.type === 'credit' ? 'Crédito' : 'Meta'}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{evt.title}</h4>
                                                {evt.amount > 0 && (
                                                    <p className={clsx("text-sm font-mono font-bold mt-1",
                                                        evt.type === 'scheduled' && evt.details.type === 'income' ? "text-emerald-500" : "text-zinc-600 dark:text-zinc-400"
                                                    )}>
                                                        {evt.type === 'scheduled' && evt.details.type === 'income' ? '+' : ''}
                                                        {currency}{evt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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
                title={`Programar para el ${quickAddDate.getDate()}`}
            >
                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        {(['expense', 'income', 'goal'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setQuickAddType(type)}
                                className={clsx(
                                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                                    quickAddType === type
                                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Meta'}
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
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Descripción</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100"
                                    placeholder="Ej. Netflix, Gimnasio..."
                                    value={txnForm.description}
                                    onChange={e => setTxnForm({ ...txnForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Monto Mensual</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100"
                                    placeholder="0.00"
                                    value={txnForm.amount}
                                    onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Categoría</label>
                                <select
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100"
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

                            <p className="text-xs text-zinc-500">
                                Se programará para el día <strong>{quickAddDate.getDate()}</strong> de cada mes.
                            </p>

                            <button
                                type="submit"
                                className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-xl font-bold hover:scale-[1.02] transition-all"
                            >
                                Programar {quickAddType === 'expense' ? 'Gasto' : 'Ingreso'}
                            </button>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Calendar;
