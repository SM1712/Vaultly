import { useState, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { 
    Search, ArrowDownLeft, ArrowUpRight, Trash2, Calendar, 
    Filter, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useSettings } from '../../context/SettingsContext';
import { useFinance } from '../../context/FinanceContext';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { ArtNumber } from '../../components/ui/ArtNumber';

// Individual Transaction Item with Swipe-To-Delete Gesture
const SwipeableTransactionItem = ({ 
    tx, 
    currency, 
    onDelete 
}: { 
    tx: any; 
    currency: string; 
    onDelete: (id: string) => void;
}) => {
    const controls = useAnimation();
    const isExpense = tx.type === 'expense';

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    const handleDragEnd = async (event: any, info: any) => {
        // If swiped left past threshold (e.g., -100px), trigger deletion
        if (info.offset.x < -100) {
            triggerHaptic();
            await controls.start({ x: '-100%', opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } });
            onDelete(tx.id);
        } else {
            // Snap back to normal position
            controls.start({ x: 0 });
        }
    };

    return (
        <div className="relative bg-rose-500 dark:bg-rose-900 rounded-2xl overflow-hidden mb-2">
            {/* Underlay Delete Indicator */}
            <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center text-white font-black text-xs gap-1">
                <Trash2 size={16} />
                <span>Borrar</span>
            </div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: -140, right: 0 }}
                dragElastic={{ left: 0.1, right: 0.3 }}
                animate={controls}
                onDragEnd={handleDragEnd}
                className="bg-white dark:bg-zinc-900 p-3.5 border border-zinc-100 dark:border-zinc-900/40 rounded-2xl shadow-sm flex justify-between items-center z-10 relative cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        isExpense ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"
                    )}>
                        {isExpense ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-200 truncate pr-2">
                            {tx.description}
                        </h4>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                            {tx.category} • {tx.date}
                        </p>
                    </div>
                </div>
                <span className={clsx(
                    "text-xs font-black shrink-0",
                    isExpense ? "text-rose-500" : "text-emerald-500"
                )}>
                    {!isExpense && <span className="mr-0.5 font-bold">+</span>}
                    <ArtNumber value={isExpense ? -tx.amount : tx.amount} symbol={currency} />
                </span>
            </motion.div>
        </div>
    );
};

const MobileTransactions = () => {
    const { transactions, deleteTransaction } = useTransactions();
    const { categories: expenseCats } = useCategories('expense');
    const { categories: incomeCats } = useCategories('income');
    const { currency } = useSettings();
    const { selectedDate, prevMonth, nextMonth, goToCurrentMonth } = useFinance();

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Dynamic Category List based on tab selection
    const allCategories = useMemo(() => {
        if (activeTab === 'expense') return expenseCats;
        if (activeTab === 'income') return incomeCats;
        return Array.from(new Set([...expenseCats, ...incomeCats]));
    }, [activeTab, expenseCats, incomeCats]);

    // Handle Month display formatting
    const monthLabel = useMemo(() => {
        const formatted = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(selectedDate);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }, [selectedDate]);

    const isCurrentMonth = useMemo(() => {
        const today = new Date();
        return selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
    }, [selectedDate]);

    // Filtered Transactions
    const filteredList = useMemo(() => {
        return transactions.filter(tx => {
            // 1. Filter by date (selected month)
            const [y, m] = tx.date.split('-').map(Number);
            const matchesDate = y === selectedDate.getFullYear() && m === (selectedDate.getMonth() + 1);
            if (!matchesDate) return false;

            // 2. Filter by tab (type)
            if (activeTab !== 'all' && tx.type !== activeTab) return false;

            // 3. Filter by category
            if (selectedCategory && tx.category !== selectedCategory) return false;

            // 4. Filter by search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const descMatch = tx.description.toLowerCase().includes(query);
                const catMatch = tx.category.toLowerCase().includes(query);
                if (!descMatch && !catMatch) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedDate, activeTab, selectedCategory, searchQuery]);

    // Calculate sum of currently filtered transactions
    const totalAmount = useMemo(() => {
        return filteredList.reduce((sum, tx) => {
            if (activeTab === 'all') {
                return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
            }
            return sum + tx.amount;
        }, 0);
    }, [filteredList, activeTab]);

    const handleDelete = (id: string) => {
        deleteTransaction(id);
        toast.success('Transacción eliminada correctamente');
    };

    return (
        <div className="space-y-4">
            {/* Inline Month Navigator Header */}
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 p-2 rounded-2xl shadow-sm">
                <button 
                    onClick={prevMonth}
                    className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 active:scale-90"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2 font-black text-sm text-zinc-800 dark:text-zinc-200">
                    <Calendar size={16} className="text-primary" />
                    <span>{monthLabel}</span>
                    {!isCurrentMonth && (
                        <button 
                            onClick={goToCurrentMonth}
                            className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1"
                        >
                            HOY
                        </button>
                    )}
                </div>
                <button 
                    onClick={nextMonth}
                    className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 active:scale-90"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Total Balance Card of Selected Filter */}
            <div className="p-4 bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 rounded-3xl text-white shadow-md flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest block">
                        Total {activeTab === 'all' ? 'Movimientos' : activeTab === 'expense' ? 'Gastos' : 'Ingresos'}
                    </span>
                    <h3 className="text-2xl font-black">
                        <ArtNumber value={totalAmount} symbol={currency} />
                    </h3>
                </div>
                <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider">
                    {filteredList.length} Items
                </div>
            </div>

            {/* Segmented Tab Control */}
            <div className="grid grid-cols-3 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 dark:border-zinc-850 rounded-2xl">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'expense', label: 'Gastos' },
                    { id: 'income', label: 'Ingresos' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setSelectedCategory(null); }}
                        className={clsx(
                            "py-2 rounded-xl text-xs font-black transition-all",
                            activeTab === tab.id
                                ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                                : "text-zinc-500 dark:text-zinc-400"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search and Category filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-3.5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nota o categoría..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl focus:ring-1 focus:ring-primary focus:outline-none text-xs dark:text-zinc-200 shadow-sm"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Categories Pills Carousel */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={clsx(
                            "flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all",
                            !selectedCategory
                                ? "border-primary bg-primary text-white"
                                : "border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
                        )}
                    >
                        Todas
                    </button>
                    {allCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={clsx(
                                "flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all",
                                selectedCategory === cat
                                    ? "border-primary bg-primary text-white"
                                    : "border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List with Swipe-to-delete */}
            <div className="space-y-1">
                <div className="flex items-center justify-between px-1 pb-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Desliza a la izquierda para borrar</p>
                </div>
                <div className="overflow-y-auto no-scrollbar max-h-[50vh] pb-12">
                    {filteredList.length === 0 ? (
                        <div className="p-10 text-center text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-900/60 rounded-3xl shadow-sm">
                            Ninguna transacción coincide con los filtros.
                        </div>
                    ) : (
                        filteredList.map(tx => (
                            <SwipeableTransactionItem
                                key={tx.id}
                                tx={tx}
                                currency={currency}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileTransactions;
