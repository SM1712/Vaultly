import { useState } from 'react';
import { Plus, X, ArrowUpRight, ArrowDownLeft, Check } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';

import { useSettings } from '../../context/SettingsContext';

const MobileQuickAdd = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const { addTransaction } = useTransactions();
    const { categories: expenseCats } = useCategories('expense');
    const { categories: incomeCats } = useCategories('income');
    const { currency } = useSettings();

    // ... (rest)

    // skipping to the render part

    // We'll replace the top import and the start of component, then we target the specific Span line later? 
    // replace_file_content works on contiguous block. 
    // I need to update imports AND the usage.
    // Let's do imports and component start first.


    const handleSubmit = () => {
        const val = Number(amount);
        if (!val || val <= 0) return;

        addTransaction({
            amount: val,
            type,
            category: category || 'Otros',
            // Use local date to avoid timezone issues (UTC vs Local)
            date: (() => {
                const now = new Date();
                return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            })(),
            description: description || (type === 'expense' ? 'Gasto Rápido' : 'Ingreso Rápido')
        });

        // Reset and close
        setAmount('');
        setDescription('');
        setCategory('');
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:scale-105 transition-transform z-50"
            >
                <Plus size={28} />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 md:hidden bg-zinc-100 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 text-zinc-500">
                    <X size={24} />
                </button>
                <h2 className="font-bold text-lg">Registro Rápido</h2>
                <div className="w-8" />
            </div>

            {/* Body */}
            <div className="flex-1 p-6 flex flex-col gap-6">
                {/* Type Toggle */}
                <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-2xl">
                    <button
                        onClick={() => setType('expense')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'expense'
                            ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-sm'
                            : 'text-zinc-500'
                            }`}
                    >
                        <ArrowDownLeft size={18} /> Gasto
                    </button>
                    <button
                        onClick={() => setType('income')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${type === 'income'
                            ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm'
                            : 'text-zinc-500'
                            }`}
                    >
                        Ingreso <ArrowUpRight size={18} />
                    </button>
                </div>

                {/* Amount Input */}
                <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Monto</p>
                    <div className="relative inline-block max-w-full">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">{currency}</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                            className="w-full bg-transparent text-center text-5xl font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                        />
                    </div>
                </div>

                {/* Category & Desc */}
                <div className="space-y-4 mt-auto">
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase font-bold">Categoría</label>
                        <div className="flex flex-wrap gap-2">
                            {(type === 'expense' ? expenseCats : incomeCats).slice(0, 6).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-3 py-2 rounded-lg text-sm transition-colors border ${category === cat
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                            <button
                                onClick={() => setCategory('Otros')}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors border ${category === 'Otros'
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                                    }`}
                            >
                                Otros...
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 uppercase font-bold">Nota (Opcional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="¿En qué gastaste?"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    <Check size={24} />
                    Guardar Movimiento
                </button>
            </div>
        </div>
    );
};

export default MobileQuickAdd;
