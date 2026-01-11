import type { Transaction } from '../../types';
import { Trash2, ArrowUpRight, ArrowDownLeft, Pencil } from 'lucide-react';
import { clsx } from 'clsx';

interface TransactionListProps {
    transactions: Transaction[];
    onDelete: (id: string) => void;
    onEdit?: (transaction: Transaction) => void;
}

const TransactionList = ({ transactions, onDelete, onEdit }: TransactionListProps) => {
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
                            <th className="px-6 py-3 font-medium uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Monto</th>
                            <th className="px-6 py-3 font-medium uppercase tracking-wider text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {transactions.map((t) => (
                            <tr key={t.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors bg-white dark:bg-zinc-900">
                                <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 whitespace-nowrap font-mono text-sm font-medium">
                                    {t.date}
                                </td>
                                <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">
                                    <div className="flex items-center gap-2">
                                        {t.type === 'income'
                                            ? <ArrowUpRight size={16} className="text-emerald-600" />
                                            : <ArrowDownLeft size={16} className="text-rose-600" />
                                        }
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                            {t.description}
                                            {t.isRecurring && (
                                                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/50">
                                                    Fijo
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                                        {t.category || 'General'}
                                    </span>
                                </td>
                                <td className={clsx(
                                    "px-6 py-4 text-right font-mono font-bold text-base",
                                    t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                )}>
                                    {t.type === 'expense' ? '-' : '+'}
                                    ${t.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(t)}
                                            className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 mr-2"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(t.id)}
                                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 size={18} />
                                    </button>
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
