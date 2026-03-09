import type { Transaction } from '../../types';
import { Trash2, ArrowUpRight, ArrowDownLeft, Pencil, Landmark, Target, Briefcase, PiggyBank } from 'lucide-react';
import { clsx } from 'clsx';
import { useSettings } from '../../context/SettingsContext';

interface TransactionListProps {
    transactions: Transaction[];
    onDelete: (id: string) => void;
    onEdit?: (transaction: Transaction) => void;
}

const TransactionList = ({ transactions, onDelete, onEdit }: TransactionListProps) => {
    const { currency } = useSettings();

    if (transactions.length === 0) {
        return (
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-8 text-center">
                <p className="text-zinc-500 italic">No hay registros en este periodo.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 rounded-[2rem] shadow-xl shadow-zinc-200/40 dark:shadow-black/20 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-900">
            {transactions.map((t) => (
                <div
                    key={t.id}
                    className="px-5 py-4 flex items-center justify-between gap-4 group hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors relative"
                >
                    {/* Left: Icon & Main Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Transaction Icon */}
                        <div className={clsx(
                            "w-11 h-11 rounded-2xl flex shrink-0 items-center justify-center text-white shadow-inner",
                            t.type === 'income' ? "bg-emerald-500 shadow-emerald-600/20" : "bg-zinc-800 dark:bg-zinc-700 shadow-black/20"
                        )}>
                            {t.type === 'income'
                                ? <ArrowUpRight size={20} strokeWidth={2.5} />
                                : <ArrowDownLeft size={20} strokeWidth={2.5} />
                            }
                        </div>

                        {/* Title, Date & Badges */}
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base leading-snug truncate">
                                    {t.description || (t.category ? t.category : 'General')}
                                </h4>
                                {t.isRecurring && (
                                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-black tracking-widest bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg shrink-0">
                                        Fijo
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center flex-wrap gap-1.5 mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                <span className="">{new Date(t.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

                                {/* Category Badge */}
                                <span className={clsx(
                                    "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold",
                                    t.relatedTo
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                )}>
                                    {t.relatedTo && (
                                        <span className="mr-1 opacity-70">
                                            {t.relatedTo.type === 'credit' && <Landmark size={12} />}
                                            {t.relatedTo.type === 'goal' && <Target size={12} />}
                                            {t.relatedTo.type === 'project' && <Briefcase size={12} />}
                                            {t.relatedTo.type === 'fund' && <PiggyBank size={12} />}
                                        </span>
                                    )}
                                    {t.category || 'General'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        {/* Amount */}
                        <div className="flex flex-col items-end">
                            <span className={clsx(
                                "font-black text-base sm:text-lg whitespace-nowrap tracking-tight",
                                t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"
                            )}>
                                {t.type === 'expense' ? '-' : '+'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(t)}
                                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                    title="Editar"
                                >
                                    <Pencil size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => onDelete(t.id)}
                                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                title="Eliminar registro"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TransactionList;
