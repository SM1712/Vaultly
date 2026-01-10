import { useState } from 'react';
import { useLedger } from '../../hooks/useLedger';
import { useFinance } from '../../context/FinanceContext';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../ui/Modal';
import MonthSelector from '../MonthSelector';
import { ArrowUpLeft, ArrowDownRight, Search, Filter, Briefcase, Landmark, CreditCard, Wallet } from 'lucide-react';
import { clsx } from 'clsx';

interface LedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SourceFilter = 'all' | 'transaction' | 'fund' | 'credit' | 'project';

const LedgerModal = ({ isOpen, onClose }: LedgerModalProps) => {
    const { ledgerEntries } = useLedger();
    const { selectedDate } = useFinance();
    const { currency } = useSettings();

    // Local filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

    const filtered = ledgerEntries.filter(t => {
        // Source Filter
        if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;

        // Search Filter
        const searchLower = searchTerm.toLowerCase();
        return (
            t.description.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower) ||
            (t.fundName && t.fundName.toLowerCase().includes(searchLower)) ||
            (t.creditName && t.creditName.toLowerCase().includes(searchLower)) ||
            (t.projectName && t.projectName.toLowerCase().includes(searchLower))
        );
    });

    const monthFiltered = filtered.filter(t => {
        const [year, month] = t.date.split('-').map(Number);
        return month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();
    });

    const income = monthFiltered.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthFiltered.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    const getIconForSource = (source: string) => {
        switch (source) {
            case 'fund': return <Landmark size={14} className="text-amber-500" />;
            case 'credit': return <CreditCard size={14} className="text-purple-500" />;
            case 'project': return <Briefcase size={14} className="text-blue-500" />;
            default: return <Wallet size={14} className="text-zinc-500" />;
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'fund': return 'Fondo';
            case 'credit': return 'Crédito';
            case 'project': return 'Proyecto';
            default: return 'Billetera';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Libro Contable Unificado">
            <div className="space-y-6">
                {/* Month Selector */}
                <div className="flex justify-center">
                    <MonthSelector />
                </div>

                {/* Filters Row */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(['all', 'transaction', 'fund', 'credit', 'project'] as SourceFilter[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setSourceFilter(filter)}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                                sourceFilter === filter
                                    ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900"
                                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400"
                            )}
                        >
                            {filter === 'all' ? 'Todos' :
                                filter === 'transaction' ? 'Transacciones' :
                                    filter === 'fund' ? 'Fondos' :
                                        filter === 'credit' ? 'Créditos' : 'Proyectos'}
                        </button>
                    ))}
                </div>

                {/* Stats Header */}
                <div className="grid grid-cols-3 gap-4 text-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Entradas</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-lg">
                            +{currency}{income.toFixed(2)}
                        </p>
                    </div>
                    <div className="space-y-1 border-x border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Flujo Neto</p>
                        <p className={clsx("font-mono font-bold text-lg", balance >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-600')}>
                            {balance >= 0 ? '+' : ''}{currency}{Math.abs(balance).toFixed(2)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Salidas</p>
                        <p className="text-rose-600 dark:text-rose-400 font-mono font-bold text-lg">
                            -{currency}{expense.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por descripción, categoría, fondo..."
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Unified List */}
                <div className="space-y-2 min-h-[300px] max-h-[50vh] overflow-y-auto pr-1">
                    {monthFiltered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-400 opacity-60">
                            <Filter size={48} className="mb-4" />
                            <p className="italic text-sm">No se encontraron movimientos.</p>
                        </div>
                    ) : (
                        monthFiltered.map(t => (
                            <div key={t.id} className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        t.type === 'income'
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                    )}>
                                        {t.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpLeft size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                                                {getIconForSource(t.source)}
                                                {getSourceLabel(t.source)}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-medium">
                                                {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate pr-2">{t.description}</p>
                                        <p className="text-xs text-zinc-500 truncate">{t.category}</p>
                                    </div>
                                </div>
                                <span className={clsx("font-mono font-bold text-sm whitespace-nowrap",
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
