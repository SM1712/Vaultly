import { useMemo, useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useFinance } from '../../context/FinanceContext';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../ui/Modal';
import MonthSelector from '../MonthSelector';
import { ArrowUpLeft, ArrowDownRight, Search } from 'lucide-react';

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
            <div className="space-y-6 max-h-[70vh] flex flex-col">
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

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
                    {monthFiltered.length === 0 ? (
                        <p className="text-center text-zinc-500 py-10 italic text-sm">No hay movimientos este mes.</p>
                    ) : (
                        monthFiltered.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income'
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                        }`}>
                                        {t.type === 'income' ? <ArrowDownRight size={14} /> : <ArrowUpLeft size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.description || 'Sin descripción'}</p>
                                        <div className="flex gap-2 text-xs text-zinc-500">
                                            <span>{new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                            <span>•</span>
                                            <span>{t.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`font-mono font-bold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    }`}>
                                    {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
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
