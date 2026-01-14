import { useState, useEffect } from 'react';
import { Plus, Save, CalendarClock, RotateCcw, AlignLeft } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useScheduledTransactions } from '../../hooks/useScheduledTransactions';
import { clsx } from 'clsx';

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

    // Update state if initialData changes (for modal reuse)
    useEffect(() => {
        if (initialData) {
            setAmount(initialData.amount.toString());
            setCategory(initialData.category);
            setDescription(initialData.description);
            setDate(initialData.date);
        }
    }, [initialData]);

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceDay, setRecurrenceDay] = useState(new Date().getDate());

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !category) return;

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

        setAmount('');
        setDescription('');
        // We keep the category and date as they are for convenience
        setIsRecurring(false);
    };

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            onAddCategory(newCategory.trim());
            setCategory(newCategory.trim());
            setNewCategory('');
            setIsAddingCategory(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-5">
            <h3 className={clsx(
                "text-lg font-bold flex items-center gap-2",
                type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}>
                <Plus size={20} />
                {initialData ? 'Editar' : (isRecurring ? 'Programar' : 'Registrar')} {type === 'income' ? 'Ingreso' : 'Gasto'}
            </h3>

            <div className="space-y-4">
                {/* Amount */}
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xl font-bold group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors">{currency}</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-3xl font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all placeholder:text-zinc-300"
                    />
                </div>

                {/* Recurrence Toggle */}
                <div className={clsx(
                    "p-4 rounded-xl border transition-all duration-300",
                    isRecurring
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                        : "bg-transparent border-transparent"
                )}>
                    <div className="flex items-center justify-between">
                        <div
                            className="flex items-center gap-3 cursor-pointer group select-none"
                            onClick={() => setIsRecurring(!isRecurring)}
                        >
                            <div className={clsx(
                                "w-12 h-7 rounded-full p-1 transition-colors duration-300 relative",
                                isRecurring ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
                            )}>
                                <div className={clsx(
                                    "w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300",
                                    isRecurring ? "translate-x-5" : "translate-x-0"
                                )} />
                            </div>
                            <div className="flex flex-col">
                                <span className={clsx(
                                    "text-sm font-bold transition-colors",
                                    isRecurring ? "text-indigo-700 dark:text-indigo-400" : "text-zinc-600 dark:text-zinc-400"
                                )}>
                                    {isRecurring ? 'Transacción Recurrente' : 'Pago Único'}
                                </span>
                            </div>
                        </div>

                        {isRecurring && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-right mr-2">
                                    <p className="text-[10px] uppercase font-bold text-indigo-400 dark:text-indigo-300 tracking-wider">Día del mes</p>
                                </div>
                                <div className="relative">
                                    <CalendarClock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        max="31"
                                        value={recurrenceDay}
                                        onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                                        className="w-20 pl-8 pr-2 py-2 bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg text-lg font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-500 text-center"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    {isRecurring && (
                        <div className="mt-3 flex gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                            <RotateCcw size={14} className="mt-0.5" />
                            <p>
                                Se agregará automáticamente cada día <strong>{recurrenceDay}</strong> del mes. Te avisaremos 2 días antes.
                            </p>
                        </div>
                    )}
                </div>

                {/* Date (Only visible if NOT recurring) */}
                {!isRecurring && (
                    <div className="relative animate-in fade-in zoom-in-95 duration-200">
                        <span className="text-xs text-zinc-400 uppercase font-bold absolute left-4 -top-2.5 bg-white dark:bg-zinc-900 px-1">Fecha</span>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 font-medium"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                )}

                {/* Category */}
                <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-1">Categoría</label>
                    <div className="flex flex-wrap gap-2">
                        {isAddingCategory ? (
                            <div className="w-full flex gap-2 animate-in fade-in slide-in-from-left-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Nombre de nueva categoría..."
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 p-2 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                            category === cat
                                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md transform scale-105"
                                                : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-transparent flex items-center gap-1"
                                >
                                    <Plus size={12} /> Nueva
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="relative">
                    <AlignLeft className="absolute left-4 top-3 text-zinc-400" size={18} />
                    <textarea
                        placeholder="Descripción (opcional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors resize-none h-20 text-sm"
                    />
                </div>
            </div>

            <button
                type="submit"
                className={clsx(
                    "w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg",
                    type === 'income'
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                        : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"
                )}
            >
                <Save size={20} />
                {initialData ? 'Guardar Cambios' : (isRecurring ? 'Programar Recurrencia' : 'Guardar Transacción')}
            </button>
        </form>
    );
};

export default TransactionForm;
