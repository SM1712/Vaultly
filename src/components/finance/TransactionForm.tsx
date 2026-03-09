import { useState, useEffect } from 'react';
import { Plus, Save, CalendarClock, RotateCcw, AlignLeft, Loader2, Calendar } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useScheduledTransactions } from '../../hooks/useScheduledTransactions';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DatePicker } from '../ui/DatePicker';

interface TransactionFormProps {
    type: 'income' | 'expense';
    onSubmit: (data: any) => void;
    categories: string[];
    onAddCategory: (category: string) => void;
    initialData?: {
        amount: number;
        category: string;
        description: string;
        date: string;
        id?: string;
    };
    credits?: any[]; // Reusing `any` to avoid excessive type imports inside component, or we could import Credit, Project types
    projects?: any[];
    goals?: any[];
    funds?: any[];
    getGoalMonthlyQuota?: (goal: any) => number;
    isGoalPaidThisMonth?: (goal: any) => boolean;
}

const TransactionForm = ({
    type,
    onSubmit,
    categories,
    onAddCategory,
    initialData,
    credits = [],
    projects = [],
    goals = [],
    funds = [],
    getGoalMonthlyQuota,
    isGoalPaidThisMonth
}: TransactionFormProps) => {
    const { currency } = useSettings();
    const { addScheduled } = useScheduledTransactions();

    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || categories[0] || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Relational States
    type RelationalTab = 'regular' | 'credit' | 'goal' | 'project' | 'fund';
    const [activeTab, setActiveTab] = useState<RelationalTab>('regular');
    const [selectedRelationId, setSelectedRelationId] = useState<string>('');

    // Pre-filter active credits
    const activeCredits = credits?.filter(c => c.status !== 'paid') || [];

    // Auto-populate Amount when a relation is selected
    useEffect(() => {
        if (!selectedRelationId) return;

        if (activeTab === 'credit' && activeCredits.length > 0) {
            const credit = activeCredits.find(c => c.id === selectedRelationId);
            if (credit) {
                // Simplified Quota Suggestion for UI
                const monthlyRate = credit.interestRate / 100 / 12;
                let quota = 0;
                if (credit.interestRate === 0) {
                    quota = credit.principal / credit.term;
                } else {
                    const p = Number(credit.principal);
                    const t = Number(credit.term);
                    const denom = Math.pow(1 + monthlyRate, t) - 1;
                    quota = denom === 0 ? p / t : (p * monthlyRate * Math.pow(1 + monthlyRate, t)) / denom;
                }

                // Set description implicitly
                if (!description) setDescription(`Cuota de Crédito: ${credit.name}`);
                setAmount(quota.toFixed(2));
            }
        } else if (activeTab === 'goal' && goals && goals.length > 0) {
            const goal = goals.find(g => g.id === selectedRelationId);
            if (goal) {
                let suggested = 0;
                const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));

                if (isGoalPaidThisMonth && getGoalMonthlyQuota) {
                    const isPaid = isGoalPaidThisMonth(goal);
                    if (!isPaid) {
                        // Not paid yet this month, suggest the exact quota
                        const quota = getGoalMonthlyQuota(goal);
                        // Make sure we dont suggest more than remaining
                        suggested = Math.min(quota, remaining);
                    } else {
                        // Already paid, fallback to small suggestion if user wants to add more
                        suggested = remaining < 100 ? remaining : (goal.targetAmount * 0.05);
                    }
                } else {
                    // Fallback if functions not provided
                    suggested = remaining < 100 ? remaining : (goal.targetAmount * 0.1);
                }

                if (!description) setDescription(`Aporte a Meta: ${goal.name}`);
                setAmount(suggested.toFixed(2));
            }
        }
    }, [selectedRelationId, activeTab, isGoalPaidThisMonth, getGoalMonthlyQuota]);

    // Update state if initialData changes
    useEffect(() => {
        if (initialData) {
            setAmount(initialData.amount.toString());
            setCategory(initialData.category);
            setDescription(initialData.description);
            setDate(initialData.date);
        }
    }, [initialData]);

    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceDay, setRecurrenceDay] = useState(new Date().getDate());
    const [showDayPicker, setShowDayPicker] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category) return;

        setIsSubmitting(true);
        // Simulate a small delay for better UX feedback if it's instant
        await new Promise(resolve => setTimeout(resolve, 600));

        if (isRecurring) {
            addScheduled({
                type,
                amount: Number(amount),
                category: activeTab === 'regular' ? category : `Relacional: ${activeTab}`,
                description,
                dayOfMonth: Number(recurrenceDay),
            });
        } else {
            const payload: any = {
                amount: Number(amount),
                type,
                category: activeTab === 'regular' ? category : `🏦 Movimiento: ${activeTab}`, // Fallback category for list view
                description,
                date,
            };

            if (activeTab !== 'regular' && selectedRelationId) {
                payload.relatedTo = {
                    type: activeTab,
                    id: selectedRelationId
                };
            }

            onSubmit(payload);
        }

        setIsSubmitting(false);

        // Reset only if not editing (or handled by parent, but usually we want to clear form on create)
        if (!initialData) {
            setAmount('');
            setDescription('');
            // Keep category and date for speed entry
            setIsRecurring(false);
        }
    };

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            onAddCategory(newCategory.trim());
            setCategory(newCategory.trim());
            setNewCategory('');
            setIsAddingCategory(false);
        }
    };

    const isExpense = type === 'expense';
    const activeColorClass = isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
    const bgActiveOne = isExpense ? "bg-rose-50 dark:bg-rose-900/20" : "bg-emerald-50 dark:bg-emerald-900/20";
    const buttonBg = isExpense ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20";

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-zinc-200/40 dark:shadow-black/40 border border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-10">

            {/* 1. Header & Tabs Area */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative">
                <div className="flex items-center gap-5">
                    <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", bgActiveOne, activeColorClass)}>
                        {initialData ? <Save size={28} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {initialData ? 'Editar' : 'Nueva'} {type === 'income' ? 'Entrada' : 'Salida'}
                        </h3>
                        {initialData && <p className="text-sm font-medium text-zinc-500 mt-1">Editando registro existente</p>}
                    </div>
                </div>

                {/* Tabs */}
                {!initialData && (
                    <div className="flex bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl overflow-x-auto custom-scrollbar ring-1 ring-inset ring-zinc-200/50 dark:ring-zinc-800">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('regular'); setSelectedRelationId(''); }}
                            className={clsx(
                                "flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none whitespace-nowrap",
                                activeTab === 'regular'
                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            {isExpense ? 'Gasto Común' : 'Ingreso Común'}
                        </button>

                        {isExpense && activeCredits.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setActiveTab('credit'); setSelectedRelationId(activeCredits[0]?.id || ''); }}
                                className={clsx(
                                    "flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none whitespace-nowrap",
                                    activeTab === 'credit'
                                        ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                Pagar Crédito
                            </button>
                        )}

                        {isExpense && goals && goals.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setActiveTab('goal'); setSelectedRelationId(goals[0]?.id || ''); }}
                                className={clsx(
                                    "flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none whitespace-nowrap",
                                    activeTab === 'goal'
                                        ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                Aportar a Meta
                            </button>
                        )}

                        {!isExpense && projects && projects.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setActiveTab('project'); setSelectedRelationId(projects[0]?.id || ''); }}
                                className={clsx(
                                    "flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none whitespace-nowrap",
                                    activeTab === 'project'
                                        ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                Ingreso Proyecto
                            </button>
                        )}

                        {funds && funds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setActiveTab('fund'); setSelectedRelationId(funds[0]?.id || ''); }}
                                className={clsx(
                                    "flex-none px-5 py-2.5 rounded-xl text-sm font-semibold transition-all select-none whitespace-nowrap",
                                    activeTab === 'fund'
                                        ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                {isExpense ? 'Aportar a Fondo' : 'Retirar de Fondo'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Amount Hero Section */}
            <div className={clsx(
                "w-full rounded-[2rem] p-8 sm:p-14 flex flex-col items-center justify-center relative transition-colors shadow-inner",
                isExpense ? "bg-rose-50/70 dark:bg-rose-900/10" : "bg-emerald-50/70 dark:bg-emerald-900/10"
            )}>
                <label className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-4 z-10">Monto de Operación</label>
                <div className="flex items-center justify-center gap-3 w-full max-w-sm">
                    <span className={clsx("text-4xl sm:text-6xl font-black mb-1 sm:mb-2 select-none", activeColorClass)}>{currency}</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className={clsx(
                            "bg-transparent text-6xl sm:text-8xl font-black text-center text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 w-full min-w-[3ch] transition-opacity",
                            amount ? "opacity-100" : "opacity-50"
                        )}
                        style={{ fieldSizing: "content" }}
                    />
                </div>
            </div>

            {/* 3. Detailed Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Description */}
                <div className="space-y-2 group">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1 block">Título / Concepto</label>
                    <div className="relative">
                        <AlignLeft className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200" size={20} />
                        <input
                            type="text"
                            placeholder="Ej: Pago de luz, Compras..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all font-medium text-base shadow-sm"
                        />
                    </div>
                </div>

                {/* Date */}
                <div className={clsx("space-y-2 transition-all duration-300", isRecurring ? "opacity-40 grayscale pointer-events-none" : "")}>
                    <DatePicker
                        label="Fecha"
                        value={date}
                        onChange={setDate}
                    />
                </div>
            </div>

            {/* 4. Categorization Layout */}
            <div className="space-y-8">
                {activeTab === 'regular' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block">Etiqueta de Categoría</label>
                            {!isAddingCategory && (
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus size={18} strokeWidth={2.5} /> Añadir Nueva
                                </button>
                            )}
                        </div>

                        {isAddingCategory ? (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-right-2 items-center w-full md:w-1/2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Nombre de categoría..."
                                    className="flex-1 min-w-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-zinc-400 transition-colors font-medium shadow-sm"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-2xl hover:opacity-90 transition-opacity shrink-0 shadow-lg"
                                >
                                    <Plus size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 p-3 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={clsx(
                                            "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border border-transparent shadow-sm",
                                            category === cat
                                                ? (isExpense ? "bg-rose-600 text-white shadow-rose-200 dark:shadow-rose-900 shadow-md transform -translate-y-[1px]" : "bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900 shadow-md transform -translate-y-[1px]")
                                                : "bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3 md:w-1/2">
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1 block">
                            {activeTab === 'credit' && 'Crédito a Pagar'}
                            {activeTab === 'goal' && 'Meta a Financiar'}
                            {activeTab === 'project' && 'Proyecto Asociado'}
                            {activeTab === 'fund' && 'Fondo Utilizado'}
                        </label>

                        <select
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-base text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all font-semibold shadow-sm"
                            value={selectedRelationId}
                            onChange={(e) => setSelectedRelationId(e.target.value)}
                        >
                            {activeTab === 'credit' && activeCredits.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            {activeTab === 'goal' && goals?.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                            {activeTab === 'project' && projects?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                            {activeTab === 'fund' && funds?.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* 5. Advanced / Recurrence */}
            <div className="flex flex-col gap-4">
                <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={clsx(
                        "group flex items-center justify-between px-6 py-5 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden relative shadow-sm",
                        isRecurring
                            ? "bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                >
                    <div className="flex items-center gap-5 z-10 w-full">
                        <div className={clsx(
                            "p-3 rounded-2xl transition-colors duration-300",
                            isRecurring ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                        )}>
                            <RotateCcw size={22} className={isRecurring ? "animate-spin-slow" : ""} />
                        </div>
                        <div className="text-left flex-1">
                            <p className={clsx("font-bold text-base transition-colors duration-300", isRecurring ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-800 dark:text-zinc-200")}>
                                Suscripción o Recurrente
                            </p>
                            <p className={clsx("text-sm mt-0.5 transition-colors duration-300", isRecurring ? "text-indigo-600/80 dark:text-indigo-300/80" : "text-zinc-500 dark:text-zinc-500")}>
                                Generar esta transacción cada mes
                            </p>
                        </div>

                        {/* iOS Style Switch */}
                        <div className={clsx("w-14 h-8 rounded-full flex items-center p-1 transition-colors duration-300 shrink-0", isRecurring ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-800")}>
                            <div className={clsx("w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-spring", isRecurring ? "translate-x-6" : "translate-x-0")} />
                        </div>
                    </div>
                </button>

                {/* Recurrence Options Expanded */}
                {isRecurring && (
                    <div className="animate-in slide-in-from-top-2 fade-in p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[1.5rem] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <CalendarClock size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Día del Cargo</p>
                                <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">Se registrará automáticamente cada mes.</p>
                            </div>
                        </div>

                        <div className="relative z-20">
                            <button
                                type="button"
                                onClick={() => setShowDayPicker(!showDayPicker)}
                                className="flex justify-between items-center gap-2 px-5 py-3 bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 font-black hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm w-full sm:w-auto"
                            >
                                <span>Día {recurrenceDay}</span>
                                <Calendar size={18} className="opacity-70" />
                            </button>

                            {showDayPicker && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowDayPicker(false)} />
                                    <div className="absolute right-0 top-full mt-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-indigo-900/10 border border-zinc-100 dark:border-zinc-800 w-64 z-20 animate-in fade-in zoom-in-95">
                                        <p className="text-[10px] font-bold text-zinc-400 mb-2 px-1 uppercase tracking-widest text-center">Selecciona un día</p>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRecurrenceDay(day);
                                                        setShowDayPicker(false);
                                                    }}
                                                    className={clsx(
                                                        "h-8 w-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-200",
                                                        recurrenceDay === day
                                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110 z-10"
                                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="mt-2 text-right w-full flex items-end justify-end">
                <button
                    id="add-btn"
                    type="submit"
                    disabled={isSubmitting || !amount || (activeTab === 'regular' ? !category : !selectedRelationId)}
                    className={twMerge(
                        "w-full md:w-auto md:min-w-[240px] py-5 px-8 rounded-2xl font-black text-lg text-white transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none",
                        buttonBg
                    )}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            <span>Procesando...</span>
                        </>
                    ) : (
                        <>
                            <Save size={24} strokeWidth={2.5} />
                            <span>{initialData ? 'Guardar Cambios' : (isRecurring ? 'Programar Operación' : 'Registrar Operación')}</span>
                        </>
                    )}
                </button>
            </div>

        </form>
    );
};

export default TransactionForm;
