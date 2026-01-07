import { useMemo, useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useFinance } from '../../context/FinanceContext';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../ui/Modal';
import MonthSelector from '../MonthSelector';
import { ArrowUpLeft, ArrowDownRight, Search } from 'lucide-react';
import { clsx } from 'clsx';

interface LedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LedgerModal = ({ isOpen, onClose }: LedgerModalProps) => {
    const { allTransactions } = useTransactions();
    const { selectedDate } = useFinance();
    const { currency } = useSettings();

    // Sort all transactions by date DESC
    const sortedTransactions = useMemo(() => {
        return [...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allTransactions]);

    // Local filter state
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = sortedTransactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const monthFiltered = filtered.filter(t => {
        const [year, month] = t.date.split('-').map(Number);
        return month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();
    });

    const income = monthFiltered.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthFiltered.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Libro Contable">
            <div className="space-y-6">
                {/* Month Selector */}
                <div className="flex justify-center">
                    <MonthSelector />
                </div>

                {/* Stats Header */}
                <div className="grid grid-cols-3 gap-4 text-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1">
                        <p className="text-xs text-zinc-500 uppercase">Ingresos</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            +{currency}{income.toFixed(2)}
                        </p>
                    </div>
                    <div className="space-y-1 border-x border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 uppercase">Balance</p>
                        <p className={`font-mono font-bold ${balance >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-600'}`}>
                            {balance >= 0 ? '+' : ''}{currency}{Math.abs(balance).toFixed(2)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-zinc-500 uppercase">Gastos</p>
                        <p className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                            -{currency}{expense.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar transacción..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-300 dark:focus:border-zinc-700"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="space-y-2 min-h-[300px]">
                    {monthFiltered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-400 opacity-60">
                            <Search size={48} className="mb-4" />
                            <p className="italic text-sm">No hay movimientos que coincidan.</p>
                        </div>
                    ) : (
                        monthFiltered.map(t => (
                            <div key={t.id} className="group flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                                <div className="flex items-center gap-3.5">
                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                                        t.type === 'income'
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                    )}>
                                        {t.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpLeft size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{t.description || 'Sin descripción'}</p>
                                        <div className="flex gap-2 text-[11px] text-zinc-500 mt-0.5 font-medium uppercase tracking-wide">
                                            <span>{new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                            <span className="opacity-50">•</span>
                                            <span>{t.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={clsx("font-mono font-bold text-sm tracking-tight",
                                    t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                )}>
                                    {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default LedgerModal;
