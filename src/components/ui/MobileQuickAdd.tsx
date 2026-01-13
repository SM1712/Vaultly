import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, ArrowUpRight, ArrowDownLeft, Check, ChevronDown } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useSettings } from '../../context/SettingsContext';
import { usePresets } from '../../hooks/usePresets';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { useLocalNotifications } from '../../hooks/useLocalNotifications';

const MobileQuickAdd = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false); // For exit animations
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const { addTransaction } = useTransactions();
    const { categories: expenseCats } = useCategories('expense');
    const { categories: incomeCats } = useCategories('income');
    const { currency } = useSettings();
    const { presets } = usePresets();
    const { isSoundEnabled } = useLocalNotifications();

    const playSound = () => {
        if (isSoundEnabled) {
            const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.error("Error playing sound", e));
        }
    };

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCategory('');
            setAmount('');
            setDescription('');
            setType('expense');
        }
    }, [isOpen]);

    // Don't render on non-dashboard pages
    if (location.pathname !== '/') return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 300); // Match transition duration
    };

    const handleSubmit = () => {
        const val = Number(amount);
        if (!val || val <= 0) return;

        addTransaction({
            amount: val,
            type,
            category: category || 'Otros',
            date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD local
            description: description || (type === 'expense' ? 'Gasto Rápido' : 'Ingreso Rápido')
        });

        // Feedback
        playSound();
        if (navigator.vibrate) navigator.vibrate(50);

        const isExpense = type === 'expense';
        toast(isExpense ? 'Gasto registrado' : 'Ingreso registrado', {
            description: `${currency}${val.toLocaleString()} - ${category || 'Otros'}`,
            className: isExpense
                ? "!bg-rose-50 dark:!bg-rose-950/30 !text-rose-600 dark:!text-rose-400 !border-rose-200 dark:!border-rose-800"
                : "!bg-emerald-50 dark:!bg-emerald-950/30 !text-emerald-600 dark:!text-emerald-400 !border-emerald-200 dark:!border-emerald-800",
            icon: isExpense ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />
        });

        handleClose();
    };

    if (!isOpen && !isClosing) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-zinc-900 dark:bg-emerald-600 text-white rounded-full shadow-2xl shadow-zinc-900/40 dark:shadow-emerald-600/40 flex items-center justify-center active:scale-95 transition-transform z-50"
                aria-label="Agregar transacción"
            >
                <Plus size={32} strokeWidth={2.5} />
            </button>
        );
    }

    const categories = type === 'expense' ? expenseCats : incomeCats;

    return (
        <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300",
                    isClosing ? "opacity-0" : "opacity-100"
                )}
                onClick={handleClose}
            />

            {/* Bottom Sheet */}
            <div
                className={clsx(
                    "w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-out border-t border-zinc-100/10 max-h-[90vh] flex flex-col",
                    isClosing ? "translate-y-full" : "translate-y-0"
                )}
            >
                {/* Drag Handle Area */}
                <div className="w-full flex justify-center pt-4 pb-2" onClick={handleClose}>
                    <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Header Actions */}
                <div className="px-6 pb-2 flex items-center justify-between">
                    <button
                        onClick={handleClose}
                        className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                        <ChevronDown size={28} />
                    </button>
                    <span className="font-bold text-zinc-400 text-xs uppercase tracking-widest">
                        Nueva Transacción
                    </span>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>

                <div className="px-6 pb-8 overflow-y-auto no-scrollbar">

                    {/* PRESETS SCROLL (BOTONERA) */}
                    {presets.length > 0 && (
                        <div className="mb-8">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Atajos Rápidos</p>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar snap-x">
                                {presets.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => {
                                            if (!preset.amount) return; // Should not happen for quick add presets usually

                                            addTransaction({
                                                amount: preset.amount,
                                                type: preset.type,
                                                category: preset.category,
                                                date: new Date().toLocaleDateString('en-CA'),
                                                description: preset.label
                                            });

                                            // Feedback
                                            playSound();
                                            if (navigator.vibrate) navigator.vibrate(50);

                                            const isPresetExpense = preset.type === 'expense';
                                            toast("Atajo ejecutado", {
                                                description: `${preset.label}: ${currency}${preset.amount}`,
                                                className: isPresetExpense
                                                    ? "!bg-rose-50 dark:!bg-rose-950/30 !text-rose-600 dark:!text-rose-400 !border-rose-200 dark:!border-rose-800"
                                                    : "!bg-emerald-50 dark:!bg-emerald-950/30 !text-emerald-600 dark:!text-emerald-400 !border-emerald-200 dark:!border-emerald-800",
                                                icon: isPresetExpense ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />
                                            });

                                            handleClose();
                                        }}
                                        className={clsx(
                                            "flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all snap-start",
                                            "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900 active:scale-95 active:bg-emerald-50 dark:active:bg-emerald-900/20 active:border-emerald-500",
                                            // Highlight if matching current selection (though less relevant now with instant click)
                                            (category === preset.category && type === preset.type)
                                                ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : ""
                                        )}
                                    >
                                        <div className={`w-8 h-8 rounded-full mb-1 flex items-center justify-center ${preset.type === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {preset.type === 'expense' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 truncate max-w-full px-1">
                                            {preset.label}
                                        </span>
                                        {preset.amount && (
                                            <span className="text-[9px] text-zinc-400 font-mono">
                                                {currency}{preset.amount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Segmented Control */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl mb-8">
                        <button
                            onClick={() => setType('expense')}
                            className={clsx(
                                "flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200",
                                type === 'expense'
                                    ? "bg-white dark:bg-zinc-800 text-rose-600 shadow-md transform scale-[1.02]"
                                    : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            <ArrowDownLeft size={20} strokeWidth={2.5} /> Gasto
                        </button>
                        <button
                            onClick={() => setType('income')}
                            className={clsx(
                                "flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200",
                                type === 'income'
                                    ? "bg-white dark:bg-zinc-800 text-emerald-600 shadow-md transform scale-[1.02]"
                                    : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            Ingreso <ArrowUpRight size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Amount Display - Super Large */}
                    <div className="mb-8 relative flex items-center justify-center">
                        <span className={clsx(
                            "text-3xl font-bold text-zinc-400 mr-2 pb-1 transition-all duration-300",
                            !amount ? "opacity-30" : "opacity-100"
                        )}>
                            {currency}
                        </span>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            autoFocus
                            className="bg-transparent text-center text-6xl font-black text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 py-2 caret-emerald-500 w-[180px]"
                        />
                    </div>

                    {/* Category Scroll - Horizontal */}
                    <div className="mb-6 space-y-3">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Categoría</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar snap-x">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={clsx(
                                        "flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all snap-start whitespace-nowrap",
                                        category === cat
                                            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                                            : "border-zinc-100 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                            <button
                                onClick={() => setCategory('Otros')}
                                className={clsx(
                                    "flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-all snap-start",
                                    category === 'Otros'
                                        ? "border-zinc-900 bg-zinc-900 text-white"
                                        : "border-zinc-100 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
                                )}
                            >
                                Otros
                            </button>
                        </div>
                    </div>

                    {/* Note Input */}
                    <div className="mb-8">
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={type === 'expense' ? "¿En qué gastaste?" : "¿De dónde provino?"}
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border-none rounded-2xl px-5 py-4 text-base font-medium placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!amount}
                        className={clsx(
                            "w-full py-5 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]",
                            amount
                                ? "bg-zinc-900 dark:bg-emerald-600 shadow-zinc-900/20 dark:shadow-emerald-600/20"
                                : "bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                        )}
                    >
                        <Check size={28} strokeWidth={3} />
                        {amount ? 'Confirmar' : 'Ingresa un monto'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileQuickAdd;
