import React, { useState } from 'react';
import { toast } from 'sonner';
import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';
import { useSettings } from '../context/SettingsContext';
import {
    Plus, Trash2, Gift, DollarSign, Heart, Flame,
    PiggyBank, Wallet, Star, Smile, Briefcase, Car,
    Plane, Home, Coffee, Gamepad2, Smartphone,
    MoreHorizontal, ArrowUpRight, ArrowDownLeft, Check
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import { clsx } from 'clsx';

// Icon Map for dynamic rendering
const ICON_MAP: Record<string, React.ElementType> = {
    'gift': Gift,
    'money': DollarSign,
    'heart': Heart,
    'phoenix': Flame, // "Fenix"
    'piggy': PiggyBank,
    'wallet': Wallet,
    'star': Star,
    'smile': Smile,
    'briefcase': Briefcase,
    'car': Car,
    'plane': Plane,
    'home': Home,
    'coffee': Coffee,
    'game': Gamepad2,
    'phone': Smartphone,
    'other': MoreHorizontal
};

const Funds = () => {
    const { funds, addFund, deleteFund, addTransaction } = useFunds();
    const { currency } = useSettings();

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFund, setNewFund] = useState({ name: '', icon: 'piggy', description: '', color: 'emerald' });

    // Transaction Modal State
    const [txModal, setTxModal] = useState<{ open: boolean; type: 'deposit' | 'withdraw'; fundId: string }>({
        open: false, type: 'deposit', fundId: ''
    });
    const [txAmount, setTxAmount] = useState('');
    const [txNote, setTxNote] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFund.name) return;
        addFund(newFund);
        setNewFund({ name: '', icon: 'piggy', description: '', color: 'emerald' });
        setIsCreateOpen(false);
    };

    const { currentBalance } = useBalance();

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(txAmount);
        if (!amount || amount <= 0) return;

        if (txModal.type === 'deposit' && amount > currentBalance) {
            toast.error(`Fondos insuficientes. Solo tienes ${currency}${currentBalance.toLocaleString()} disponibles.`);
            return;
        }

        addTransaction(txModal.fundId, amount, txModal.type, txNote);
        setTxModal({ ...txModal, open: false });
        setTxAmount('');
        setTxNote('');
    };

    const openTxModal = (type: 'deposit' | 'withdraw', fundId: string) => {
        setTxModal({ open: true, type, fundId });
    };

    const getIcon = (iconName: string) => {
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        return <Icon size={24} />;
    };

    const COLORS = [
        { id: 'emerald', class: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
        { id: 'blue', class: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
        { id: 'rose', class: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400' },
        { id: 'amber', class: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
        { id: 'violet', class: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400' },
        { id: 'zinc', class: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">Fondos de Ahorro</h1>
                    <p className="text-zinc-500 text-sm mt-1">Espacios personalizados para tu dinero</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-5 py-2.5 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zinc-200 dark:shadow-zinc-900/50"
                >
                    <Plus size={20} /> Nuevo Fondo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {funds.length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                        <div className="inline-flex p-4 bg-white dark:bg-zinc-900 rounded-full text-zinc-400 mb-4 shadow-sm">
                            <PiggyBank size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin Fondos</h3>
                        <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
                            Crea tu primer fondo para guardar dinero para regalos, emergencias o gustos personales.
                        </p>
                    </div>
                ) : (
                    funds.map(fund => {
                        const colorClass = COLORS.find(c => c.id === fund.color)?.class || COLORS[0].class;

                        return (
                            <div key={fund.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm dark:shadow-none hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={clsx("p-3 rounded-xl transition-colors", colorClass)}>
                                        {getIcon(fund.icon)}
                                    </div>
                                    <button
                                        onClick={() => deleteFund(fund.id)}
                                        className="text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{fund.name}</h3>
                                {fund.description && <p className="text-sm text-zinc-500 mb-4 line-clamp-1">{fund.description}</p>}

                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Saldo Actual</p>
                                    <p className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {currency}{fund.currentAmount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <button
                                        onClick={() => openTxModal('deposit', fund.id)}
                                        className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <ArrowDownLeft size={16} /> Ingresar
                                    </button>
                                    <button
                                        onClick={() => openTxModal('withdraw', fund.id)}
                                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 py-2 rounded-lg text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <ArrowUpRight size={16} /> Retirar
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Nuevo Fondo">
                <form onSubmit={handleCreate} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Nombre</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                                placeholder="Ej. Fondo de Emergencia"
                                value={newFund.name}
                                onChange={e => setNewFund({ ...newFund, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Icono</label>
                            <div className="grid grid-cols-6 gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-40 overflow-y-auto">
                                {Object.keys(ICON_MAP).map(key => {
                                    const Icon = ICON_MAP[key];
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setNewFund({ ...newFund, icon: key })}
                                            className={clsx("p-2 rounded-md flex items-center justify-center transition-all",
                                                newFund.icon === key
                                                    ? "bg-emerald-500 text-white shadow-sm"
                                                    : "text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            <Icon size={20} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Color</label>
                            <div className="flex gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => setNewFund({ ...newFund, color: color.id })}
                                        className={clsx("w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                                            color.class.split(' ')[1], // Use background class
                                            newFund.color === color.id
                                                ? "border-zinc-900 dark:border-white scale-110"
                                                : "border-transparent opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        {newFund.color === color.id && <Check size={14} className="text-current" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Descripción (Opcional)</label>
                            <input
                                type="text"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                                placeholder="Notas sobre este fondo"
                                value={newFund.description}
                                onChange={e => setNewFund({ ...newFund, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                        Crear Fondo
                    </button>
                </form>
            </Modal>

            {/* Transaction Modal */}
            <Modal isOpen={txModal.open} onClose={() => setTxModal({ ...txModal, open: false })} title={txModal.type === 'deposit' ? 'Ingresar dinero' : 'Retirar dinero'}>
                <form onSubmit={handleTransaction} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Monto</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono">{currency}</span>
                            <input
                                autoFocus
                                type="number"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                                placeholder="0.00"
                                value={txAmount}
                                onChange={e => setTxAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Nota (Opcional)</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                            placeholder={txModal.type === 'deposit' ? 'Ahorro semanal...' : 'Para gastos...'}
                            value={txNote}
                            onChange={e => setTxNote(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className={clsx("w-full py-2 rounded-lg font-medium text-white transition-colors",
                            txModal.type === 'deposit' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                        )}
                    >
                        Confirmar {txModal.type === 'deposit' ? 'Ingreso' : 'Retiro'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Funds;
