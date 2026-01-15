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
}

const TransactionForm = ({ type, onSubmit, categories, onAddCategory, initialData }: TransactionFormProps) => {
    const { currency } = useSettings();
    const { addScheduled } = useScheduledTransactions();

    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || categories[0] || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                category,
                description,
                dayOfMonth: Number(recurrenceDay),
            });
        } else {
            onSubmit({
                amount: Number(amount),
                type,
                category,
                description,
                date,
            });
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
    const borderActive = isExpense ? "focus-within:border-rose-300 dark:focus-within:border-rose-800" : "focus-within:border-emerald-300 dark:focus-within:border-emerald-800";
    const buttonBg = isExpense ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20";

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/20 space-y-8 relative overflow-hidden">

            {/* Ambient Background Glow */}
            <div className={clsx(
                "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
                isExpense ? "from-rose-500 to-orange-500" : "from-emerald-500 to-teal-500"
            )} />

            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-3 text-zinc-800 dark:text-zinc-100">
                    <div className={clsx("p-2 rounded-xl", bgActiveOne, activeColorClass)}>
                        {initialData ? <Save size={20} /> : <Plus size={20} />}
                    </div>
                    {initialData ? 'Editar' : (isRecurring ? 'Programar' : 'Nueva')} {type === 'income' ? 'Entrada' : 'Salida'}
                </h3>
                {initialData && (
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full text-zinc-500 font-medium border border-zinc-200 dark:border-zinc-800">
                        Editando
                    </span>
                )}
            </div>

            <div className="space-y-6">
                {/* Amount Input - Massive & Center */}
                <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                        <span className={clsx("text-2xl font-bold transition-colors group-focus-within:text-zinc-800 dark:group-focus-within:text-zinc-100", activeColorClass)}>{currency}</span>
                    </div>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className={twMerge(
                            "w-full pl-16 pr-6 py-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-5xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all text-left tracking-tight",
                            borderActive
                        )}
                    />
                </div>

                {/* Grid for Date & Recurrence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date (Only visible if NOT recurring) */}
                    {/* Date (Only visible if NOT recurring) */}
                    <div className={clsx("relative transition-all duration-300", isRecurring ? "opacity-50 pointer-events-none grayscale" : "")}>
                        <DatePicker
                            label="Fecha"
                            value={date}
                            onChange={setDate}
                        />
                    </div>

                    {/* Recurrence Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={clsx(
                            "flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border transition-all text-sm font-bold",
                            isRecurring
                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400"
                                : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        )}
                    >
                        <RotateCcw size={16} className={isRecurring ? "animate-spin-slow" : ""} />
                        {isRecurring ? 'Recurrente' : 'Hacer Recurrente'}
                    </button>
                </div>

                {/* Recurrence Details */}
                {isRecurring && (
                    <div className="animate-in slide-in-from-top-2 fade-in p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <CalendarClock size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Día de Repetición</p>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Selecciona qué día del mes se hará el cargo.</p>
                                </div>
                            </div>

                            <div className="relative z-20">
                                <button
                                    type="button"
                                    onClick={() => setShowDayPicker(!showDayPicker)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm"
                                >
                                    <span>Día {recurrenceDay}</span>
                                    <Calendar size={14} className="opacity-70" />
                                </button>

                                {showDayPicker && (
                                    <>
                                        {/* Backdrop to close */}
                                        <div className="fixed inset-0 z-10" onClick={() => setShowDayPicker(false)} />

                                        {/* Picker Grid */}
                                        <div className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-indigo-900/10 border border-zinc-100 dark:border-zinc-800 w-64 z-20 animate-in fade-in zoom-in-95">
                                            <p className="text-xs font-bold text-zinc-400 mb-2 px-1 uppercase tracking-wider text-center">Selecciona un día</p>
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
                                                            "h-8 w-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all",
                                                            recurrenceDay === day
                                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110 z-10"
                                                                : "text-zinc-600 dark:text-zinc-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300"
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

                        <div className="flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-indigo-100/50 dark:border-indigo-900/20">
                            <RotateCcw size={14} className="mt-0.5 shrink-0" />
                            <p className="leading-relaxed">
                                Esta transacción se registrará automáticamente el día <strong>{recurrenceDay}</strong> de cada mes.
                                <span className="block mt-1 opacity-80">Te enviaremos un recordatorio 2 días antes.</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Category Selection - Pills */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider">Categoría</label>
                        {!isAddingCategory && (
                            <button
                                type="button"
                                onClick={() => setIsAddingCategory(true)}
                                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-medium flex items-center gap-1 transition-colors"
                            >
                                <Plus size={14} /> Nueva Categoría
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {isAddingCategory ? (
                            <div className="w-full flex gap-2 animate-in fade-in slide-in-from-left-2 items-center">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Nombre de nueva categoría..."
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 transition-colors"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-xl hover:opacity-90 transition-opacity"
                                >
                                    <Plus size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 p-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={clsx(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                        category === cat
                                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-lg shadow-zinc-200 dark:shadow-none transform -translate-y-0.5"
                                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="relative group">
                    <AlignLeft className="absolute left-4 top-4 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" size={20} />
                    <textarea
                        placeholder="Nota o descripción (opcional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-none h-24 text-sm leading-relaxed"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting || !amount || !category}
                className={twMerge(
                    "w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                    buttonBg
                )}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Guardando...</span>
                    </>
                ) : (
                    <>
                        <Save size={20} />
                        <span>{initialData ? 'Guardar Cambios' : (isRecurring ? 'Programar Recurrencia' : 'Registrar Transacción')}</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default TransactionForm;

