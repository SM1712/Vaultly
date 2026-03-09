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
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-8 text-center">
                <p className="text-zinc-500 italic">No hay registros en este periodo.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="hidden md:table-cell px-6 py-3 font-medium uppercase tracking-wider">Fecha</th>
                            <th className="px-4 md:px-6 py-3 font-medium uppercase tracking-wider">Descripción</th>
                            <th className="hidden sm:table-cell px-4 md:px-6 py-3 font-medium uppercase tracking-wider">Categoría</th>
                            <th className="px-4 md:px-6 py-3 font-medium uppercase tracking-wider text-right">Monto</th>
                            <th className="px-4 md:px-6 py-3 font-medium uppercase tracking-wider text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {transactions.map((t) => (
                            <tr key={t.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors bg-white dark:bg-zinc-900">
                                <td className="hidden md:table-cell px-6 py-4 text-zinc-900 dark:text-zinc-100 whitespace-nowrap font-mono text-sm font-medium">
                                    {t.date}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">
                                    <div className="flex items-center gap-2 mb-1 md:mb-0">
                                        {t.type === 'income'
                                            ? <ArrowUpRight size={16} className="text-emerald-600 shrink-0" />
                                            : <ArrowDownLeft size={16} className="text-rose-600 shrink-0" />
                                        }
                                        <div className="flex flex-col">
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 leading-tight">
                                                <span className="truncate max-w-[120px] sm:max-w-[200px]">{t.description}</span>
                                                {t.isRecurring && (
                                                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/50 shrink-0">
                                                        Fijo
                                                    </span>
                                                )}
                                            </p>
                                            <span className="md:hidden text-xs text-zinc-400 font-mono mt-0.5">{t.date}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden sm:table-cell px-4 md:px-6 py-4">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className={clsx(
                                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border",
                                            t.relatedTo
                                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
                                        )}>
                                            {t.relatedTo && (
                                                <span className="mr-1.5 opacity-70">
                                                    {t.relatedTo.type === 'credit' && <Landmark size={12} />}
                                                    {t.relatedTo.type === 'goal' && <Target size={12} />}
                                                    {t.relatedTo.type === 'project' && <Briefcase size={12} />}
                                                    {t.relatedTo.type === 'fund' && <PiggyBank size={12} />}
                                                </span>
                                            )}
                                            {t.category || 'General'}
                                        </span>
                                    </div>
                                </td>
                                <td className={clsx(
                                    "px-4 md:px-6 py-4 text-right font-mono font-bold text-base whitespace-nowrap",
                                    t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                )}>
                                    {t.type === 'expense' ? '-' : '+'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-center">
                                    <div className="flex items-center justify-center -mr-2 md:mr-0">
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(t)}
                                                className="p-2 md:p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onDelete(t.id)}
                                            className="p-2 md:p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400/80 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            title="Eliminar registro"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionList;
