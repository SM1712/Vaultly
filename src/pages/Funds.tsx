import React, { useState } from 'react';
import { toast } from 'sonner';
import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';
import { useSettings } from '../context/SettingsContext';
import {
    Plus, Trash2, Gift, DollarSign, Heart, Flame,
    PiggyBank, Wallet, Star, Smile, Briefcase, Car,
    Plane, Home, Coffee, Gamepad2, Smartphone,
    MoreHorizontal, ArrowUpRight, ArrowDownLeft, Check,
    Pencil, Zap, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import { clsx } from 'clsx';
import type { Fund } from '../types';

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
    const { funds, addFund, deleteFund, addTransaction, updateFund } = useFunds();
    const { currency } = useSettings();

    // Create/Edit Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingFundId, setEditingFundId] = useState<string | null>(null);
    const [newFund, setNewFund] = useState<Partial<Fund> & { name: string, icon: string, color: string }>({ name: '', icon: 'piggy', description: '', color: 'emerald' });


    // Transaction Modal State
    const [txModal, setTxModal] = useState<{ open: boolean; type: 'deposit' | 'withdraw'; fundId: string }>({
        open: false, type: 'deposit', fundId: ''
    });
    const [txAmount, setTxAmount] = useState('');
    const [txNote, setTxNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFund.name) return;

        if (editingFundId) {
            updateFund(editingFundId, newFund);
            toast.success('Fondo actualizado');
        } else {
            addFund(newFund);
            toast.success('Fondo creado');
        }

        setNewFund({ name: '', icon: 'piggy', description: '', color: 'emerald' });
        setEditingFundId(null);
        setIsCreateOpen(false);
    };

    const openCreate = () => {
        setEditingFundId(null);
        setNewFund({ name: '', icon: 'piggy', description: '', color: 'emerald' });
        setIsCreateOpen(true);
    };

    const openEdit = (fund: any) => {
        setEditingFundId(fund.id);
        setNewFund({
            name: fund.name,
            icon: fund.icon,
            description: fund.description || '',
            color: fund.color || 'emerald'
        });
        setIsCreateOpen(true);
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
        { id: 'emerald', class: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400', solidClass: 'bg-emerald-500' },
        { id: 'blue', class: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', solidClass: 'bg-blue-500' },
        { id: 'rose', class: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400', solidClass: 'bg-rose-500' },
        { id: 'amber', class: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400', solidClass: 'bg-amber-500' },
        { id: 'violet', class: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400', solidClass: 'bg-violet-500' },
        { id: 'zinc', class: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400', solidClass: 'bg-zinc-500' },
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
                    onClick={openCreate}
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
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEdit(fund)}
                                            className="text-zinc-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteFund(fund.id)}
                                            className="text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
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

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={editingFundId ? "Editar Fondo" : "Crear Nuevo Fondo"}>
                <form onSubmit={handleSubmit} className="space-y-8 pt-4">

                    {/* Hero Section: Preview & Name */}
                    <div className="flex flex-col items-center">
                        <div className={clsx(
                            "w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 shadow-2xl",
                            COLORS.find(c => c.id === newFund.color)?.class || COLORS[0].class
                        )}>
                            {getIcon(newFund.icon)}
                        </div>

                        <div className="w-full relative group">
                            <input
                                autoFocus
                                type="text"
                                required
                                className="w-full text-center text-3xl font-black bg-transparent border-b-2 border-zinc-100 dark:border-zinc-800 py-2 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-800 text-zinc-900 dark:text-zinc-100"
                                placeholder="Nombre del Fondo"
                                value={newFund.name}
                                onChange={e => setNewFund({ ...newFund, name: e.target.value })}
                            />
                            <label className="block text-center text-xs font-bold text-zinc-400 uppercase tracking-wider mt-2 group-focus-within:text-emerald-500 transition-colors">
                                Nombre del Ahorro
                            </label>
                        </div>
                    </div>

                    {/* Color Selector - Solid Buttons */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block text-center">Color de Etiqueta</label>
                        <div className="flex flex-wrap justify-center gap-3">
                            {COLORS.map(color => (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setNewFund({ ...newFund, color: color.id })}
                                    className={clsx(
                                        "w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110",
                                        color.solidClass,
                                        newFund.color === color.id
                                            ? "ring-4 ring-offset-2 ring-zinc-200 dark:ring-zinc-700 dark:ring-offset-zinc-900 scale-110 shadow-lg"
                                            : "opacity-40 hover:opacity-100"
                                    )}
                                >
                                    {newFund.color === color.id && <Check size={18} className="text-white drop-shadow-md" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Icon Selector */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block text-center">Icono</label>
                        <div className="grid grid-cols-7 gap-2">
                            {Object.keys(ICON_MAP).map(key => {
                                const Icon = ICON_MAP[key];
                                const isSelected = newFund.icon === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setNewFund({ ...newFund, icon: key })}
                                        className={clsx("aspect-square rounded-xl flex items-center justify-center transition-all duration-300",
                                            isSelected
                                                ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-lg scale-110"
                                                : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105"
                                        )}
                                    >
                                        <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description - Subtle */}
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 ring-zinc-500/20 transition-all placeholder:text-zinc-400"
                            placeholder="Descripción opcional (Ej. Para gastos médicos...)"
                            value={newFund.description}
                            onChange={e => setNewFund({ ...newFund, description: e.target.value })}
                        />
                    </div>

                    {/* Auto-Save Configuration Section */}
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={clsx("p-2 rounded-lg transition-colors", newFund.autoSaveConfig?.enabled ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800")}>
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Auto-Ahorro</h4>
                                    <p className="text-xs text-zinc-500">Depositar automáticamente cada mes</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNewFund({
                                    ...newFund,
                                    autoSaveConfig: {
                                        ...newFund.autoSaveConfig,
                                        enabled: !newFund.autoSaveConfig?.enabled,
                                        type: newFund.autoSaveConfig?.type || 'fixed',
                                        amount: newFund.autoSaveConfig?.amount || 0,
                                        dayOfMonth: newFund.autoSaveConfig?.dayOfMonth || 1
                                    } as any
                                })}
                                className={clsx("w-12 h-6 rounded-full transition-colors relative", newFund.autoSaveConfig?.enabled ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700")}
                            >
                                <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300", newFund.autoSaveConfig?.enabled ? "left-7" : "left-1")} />
                            </button>
                        </div>

                        {newFund.autoSaveConfig?.enabled && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-300 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                {/* Type Selector */}
                                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig, type: 'fixed' } as any })}
                                        className={clsx("py-1.5 text-xs font-bold rounded-md transition-all",
                                            newFund.autoSaveConfig.type === 'fixed'
                                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        Monto Fijo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig, type: 'percentage' } as any })}
                                        className={clsx("py-1.5 text-xs font-bold rounded-md transition-all",
                                            newFund.autoSaveConfig.type === 'percentage'
                                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        Porcentaje (%)
                                    </button>
                                </div>

                                {/* Day Selector (Stepper Style) */}
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Día del Mes</label>
                                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = newFund.autoSaveConfig?.dayOfMonth || 1;
                                                const prev = current === 1 ? 31 : current - 1;
                                                setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig, dayOfMonth: prev } as any });
                                            }}
                                            className="p-3 bg-white dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700 transition-transform active:scale-95 flex items-center justify-center"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>

                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                <Calendar size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Se ejecuta el</span>
                                            </div>
                                            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 select-none">
                                                Día {newFund.autoSaveConfig?.dayOfMonth}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = newFund.autoSaveConfig?.dayOfMonth || 1;
                                                const next = current === 31 ? 1 : current + 1;
                                                setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig, dayOfMonth: next } as any });
                                            }}
                                            className="p-3 bg-white dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700 transition-transform active:scale-95 flex items-center justify-center"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                        {newFund.autoSaveConfig.type === 'fixed' ? `Monto (${currency})` : 'Porcentaje del Saldo'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-emerald-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                            placeholder="0"
                                            value={newFund.autoSaveConfig.amount === 0 ? '' : newFund.autoSaveConfig.amount}
                                            onChange={e => setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig, amount: e.target.value === '' ? 0 : Number(e.target.value) } as any })}
                                        />
                                        {newFund.autoSaveConfig.type === 'percentage' && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 text-center italic">
                                    {newFund.autoSaveConfig.type === 'fixed'
                                        ? `Se guardarán ${currency}${newFund.autoSaveConfig.amount} el día ${newFund.autoSaveConfig.dayOfMonth} de cada mes.`
                                        : `Se guardará el ${newFund.autoSaveConfig.amount}% de tu saldo disponible el día ${newFund.autoSaveConfig.dayOfMonth}.`
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-4 rounded-xl font-black text-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {editingFundId ? <Pencil size={18} /> : <Plus size={18} />}
                        {editingFundId ? 'Guardar Cambios' : 'Crear Fondo'}
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
        </div >
    );
};

export default Funds;
