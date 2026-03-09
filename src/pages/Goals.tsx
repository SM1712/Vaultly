import React, { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../context/SettingsContext';
import { useFunds } from '../hooks/useFunds';
import {
    Target, Trash2, Edit2, TrendingUp, AlertTriangle,
    MinusCircle, PlusCircle, Pencil, ChevronsRight, Zap,
    Gift, DollarSign, Heart, Flame, PiggyBank, Wallet, Star, Smile,
    Briefcase, Car, Plane, Home, Coffee, Gamepad2, Smartphone, Lock, Plus, ChevronDown
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import type { Goal } from '../types';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { DatePicker } from '../components/ui/DatePicker';

// Updated Icon Map
const ICON_MAP: Record<string, React.ElementType> = {
    'gift': Gift,
    'money': DollarSign,
    'heart': Heart,
    'phoenix': Flame,
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
    'target': Target
};

// --- Reusable Form Component ---
export interface GoalFormProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    editingId: string | null;
    onCancel: () => void;
    currency: string;
}

export const GoalForm = ({ formData, setFormData, onSubmit, editingId, onCancel, currency }: GoalFormProps) => {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {editingId ? 'Editar Meta' : 'Nueva Meta'}
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium">Define tu próximo objetivo</p>
                </div>
                {editingId && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-rose-500"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            {/* Hero Amount Input */}
            <div className="relative group">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block text-center">Monto Objetivo</label>
                <div className="relative flex items-center justify-center border-b-2 border-zinc-100 dark:border-zinc-800 focus-within:border-emerald-500 transition-all py-4">
                    <span className="text-3xl font-black text-zinc-400 mr-2 transition-colors group-focus-within:text-emerald-500">{currency}</span>
                    <input
                        type="number"
                        required
                        className="bg-transparent text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-100 placeholder-zinc-200 dark:placeholder-zinc-800 focus:outline-none p-0 border-none w-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                        style={{ width: `${Math.max(1, (formData.targetAmount.length || 0) + 1)}ch` }}
                        value={formData.targetAmount}
                        onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                    />
                </div>
            </div>

            {/* Name Input */}
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1 block">Nombre de la Meta</label>
                <input
                    type="text"
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-normal"
                    placeholder="Ej. Viaje a Japón, Auto Nuevo..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            {/* Icon Selector */}
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1 block">Icono</label>
                <div className="grid grid-cols-7 gap-2">
                    {Object.keys(ICON_MAP).map(key => {
                        const Icon = ICON_MAP[key];
                        const isSelected = formData.icon === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setFormData({ ...formData, icon: key })}
                                className={clsx("aspect-square rounded-xl flex items-center justify-center transition-all duration-300",
                                    isSelected
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110"
                                        : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105"
                                )}
                            >
                                <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Date Picker */}
            <div>
                <DatePicker
                    label="Fecha Límite"
                    value={formData.deadline}
                    onChange={(date) => setFormData({ ...formData, deadline: date })}
                    className="w-full"
                />
                {formData.deadline && (
                    <p className="text-xs text-right text-zinc-400 mt-1.5 font-medium">
                        {/* Simple calc for months remaining could go here visually if needed */}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
                {editingId && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    id="create-goal-btn"
                    type="submit"
                    className={clsx("flex-[2] py-4 rounded-xl font-bold px-4 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                        editingId
                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                            : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-zinc-900/20"
                    )}
                >
                    {editingId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
                    {editingId ? 'Guardar Cambios' : 'Crear Meta'}
                </button>
            </div>
        </form>
    );
};

const GoalCard = ({
    goal,
    currency,
    getMonthlyQuota,
    getGoalHealth,
    isGoalPaidThisMonth,
    availableBalance,
    updateGoal,
    editingId,
    handleEditClick,
    handleDeleteClick,
    contributeToGoal,
    setTransferModal,
    setWithdrawStrategy,
    getIcon
}: {
    goal: Goal;
    currency: string;
    getMonthlyQuota: (goal: Goal, targetDate?: Date, simulatedAddedAmount?: number) => number;
    getGoalHealth: (goal: Goal) => 'on_track' | 'behind' | 'ahead';
    isGoalPaidThisMonth: (goal: Goal) => boolean;
    availableBalance: number;
    updateGoal: (id: string, updates: Partial<Goal>) => void;
    editingId: string | null;
    handleEditClick: (goal: Goal) => void;
    handleDeleteClick: (id: string) => void;
    contributeToGoal: (id: string, amount: number) => void;
    setTransferModal: (modal: { open: boolean; type: 'deposit' | 'withdraw'; goalId: string }) => void;
    setWithdrawStrategy: (strategy: 'spread' | 'catch_up') => void;
    getIcon: (iconName: string) => React.ReactNode;
}) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const monthlyQuota = getMonthlyQuota(goal);
    const health = getGoalHealth(goal);
    const canPay = availableBalance >= monthlyQuota;
    const isPaid = isGoalPaidThisMonth(goal);

    // --- New Logic: Quota Progress ---
    const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    // Quota Progress
    const start = new Date(goal.startDate);
    const end = new Date(goal.deadline);
    const now = new Date();
    const totalQuotas = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    const currentQuotaNum = Math.min(totalQuotas, Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1));
    // -----------------------------------------

    // Analytics Math
    const remainingBeforePayment = Math.max(0, goal.targetAmount - goal.currentAmount);

    // Visual health colors for glowing border
    const borderGlowColor = health === 'on_track' ? 'border-emerald-500/20' : (health === 'behind' ? 'border-rose-500/20' : 'border-blue-500/20');
    const glowBg = health === 'on_track' ? 'bg-emerald-500' : (health === 'behind' ? 'bg-rose-500' : 'bg-blue-500');

    return (
        <div key={goal.id} className={clsx(
            "group relative flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden",
            editingId === goal.id ? "border-blue-500 ring-4 ring-blue-500/20" : `border-zinc-200/80 dark:border-zinc-800/80 hover:${borderGlowColor} dark:hover:${borderGlowColor}`,
            isPaid && "opacity-75 hover:opacity-100 grayscale-[0.1]"
        )}>
            {/* Ambient Glow */}
            <div className={clsx("absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-opacity duration-700 group-hover:opacity-30 pointer-events-none", glowBg)} />

            {/* Header Layout */}
            <div className="relative flex justify-between items-start gap-4 mb-6">
                <div className="flex gap-4 flex-1">
                    {/* Icon */}
                    <div className={clsx(
                        "flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 shadow-inner",
                        health === 'on_track' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                            (health === 'behind' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30')
                    )}>
                        {getIcon(goal.icon || 'target')}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate mb-1">{goal.name}</h3>

                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                            <span className="text-zinc-500">
                                Meta: <strong className="text-zinc-800 dark:text-zinc-200">{currency}{goal.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="text-zinc-500">
                                Meta para: <strong className="text-zinc-800 dark:text-zinc-200">{new Date(goal.deadline + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button onClick={() => {
                        const newMethod = goal.calculationMethod === 'dynamic' ? 'static' : 'dynamic';
                        updateGoal(goal.id, { calculationMethod: newMethod });
                        toast.info(`Ahorro Dinámico: ${newMethod === 'dynamic' ? 'Activado' : 'Desactivado'}`);
                    }}
                        className={clsx("p-2.5 rounded-xl transition-colors shadow-sm", goal.calculationMethod === 'dynamic' ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-400 hover:text-zinc-600")}
                        title="Alternar Modo Dinámico"
                    >
                        <Zap size={16} className={goal.calculationMethod === 'dynamic' ? "fill-current" : ""} />
                    </button>
                    <button onClick={() => handleEditClick(goal)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-blue-600 rounded-xl transition-colors shadow-sm">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(goal.id)} className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-600 rounded-xl transition-colors shadow-sm">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Core Metrics & Progress */}
            <div className="relative space-y-4 mb-8">
                <div className="flex justify-between items-end gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Acumulado</p>
                        <p className="text-3xl font-mono font-black text-zinc-900 dark:text-zinc-100 tracking-tighter truncate">
                            <span className="text-base text-zinc-400 font-sans mr-1">{currency}</span>
                            {goal.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Progreso</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{progress.toFixed(1)}%</p>
                    </div>
                </div>

                <div className="h-4 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="relative mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800/60">

                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                    <div className="shrink-0">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1 flex items-center gap-2">
                            Cuota de {capitalizedMonth}
                            {isPaid && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px]">PAGADA</span>}
                        </p>
                        <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                            <span className="text-sm font-normal text-zinc-500 mr-1">{currency}</span>
                            {monthlyQuota.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start xl:justify-end gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                        {isPaid ? (
                            <>
                                <button
                                    onClick={() => setTransferModal({ open: true, type: 'withdraw', goalId: goal.id })}
                                    disabled={goal.currentAmount <= 0}
                                    className="flex-1 sm:flex-none h-11 px-4 bg-rose-600/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm hover:bg-rose-600/20"
                                    title="Retirar Dinero"
                                >
                                    <MinusCircle size={16} className="shrink-0" />
                                </button>
                                <button
                                    onClick={() => setTransferModal({ open: true, type: 'deposit', goalId: goal.id })}
                                    disabled={availableBalance <= 0}
                                    className={clsx(
                                        "flex-[2] sm:flex-none min-w-[120px] h-11 px-4 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm",
                                        availableBalance > 0
                                            ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400"
                                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                    )}
                                >
                                    <Plus size={16} className="shrink-0" /> <span>{availableBalance > 0 ? 'Aportar Más' : 'Sin Saldo'}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setTransferModal({ open: true, type: 'withdraw', goalId: goal.id })}
                                    disabled={goal.currentAmount <= 0}
                                    className="flex-1 sm:flex-none h-11 px-4 bg-rose-600/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm hover:bg-rose-600/20"
                                    title="Retirar Dinero"
                                >
                                    <MinusCircle size={16} className="shrink-0" />
                                </button>
                                <button
                                    onClick={() => { contributeToGoal(goal.id, monthlyQuota); toast.success(`Cuota pagada: ${currency}${monthlyQuota}`); }}
                                    disabled={!canPay}
                                    className={clsx(
                                        "flex-[2] sm:flex-none min-w-[130px] h-11 px-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 text-sm whitespace-nowrap",
                                        canPay ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-zinc-900/20" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    <span>{canPay ? 'Pagar Cuota' : 'Sin Saldo'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Goals = () => {
    const { goals, addGoal, deleteGoal, contributeToGoal, addContribution, withdraw, getMonthlyQuota, updateGoal, isGoalPaidThisMonth } = useGoals();
    const { total: totalIncome } = useTransactions('income');
    const { total: totalExpenses } = useTransactions('expense');
    const { currency, goalPreferences } = useSettings();
    const { funds } = useFunds();

    // Calculate Available Balance
    const totalSaved = React.useMemo(() => goals.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0), [goals]);
    const totalFunds = React.useMemo(() => funds.reduce((acc: number, fund: any) => acc + (fund.currentAmount || 0), 0), [funds]);
    const availableBalance = React.useMemo(() => (totalIncome - totalExpenses) - totalSaved - totalFunds, [totalIncome, totalExpenses, totalSaved, totalFunds]);

    // State for Create/Edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        deadline: '',
        icon: 'target',
        calculationMethod: goalPreferences.defaultCalculationMethod
    });
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    const [transferModal, setTransferModal] = useState<{ open: boolean; type: 'deposit' | 'withdraw'; goalId: string; }>({
        open: false, type: 'deposit', goalId: ''
    });
    const [transferAmount, setTransferAmount] = useState('');
    const [withdrawStrategy, setWithdrawStrategy] = useState<'spread' | 'catch_up'>('spread');

    // --- Helpers ---
    const getGoalHealth = (goal: Goal) => {
        const quota = getMonthlyQuota(goal);
        const originalMonthly = goal.targetAmount / (Math.max(1, (new Date(goal.deadline).getFullYear() - new Date(goal.startDate).getFullYear()) * 12 + (new Date(goal.deadline).getMonth() - new Date(goal.startDate).getMonth())));

        if (quota > originalMonthly * 1.1) return 'behind';
        if (quota < originalMonthly * 0.9) return 'ahead';
        return 'on_track';
    };

    const getIcon = (iconName: string) => {
        const Icon = ICON_MAP[iconName] || Target;
        return <Icon size={24} />;
    };

    // --- Handlers ---
    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            targetAmount: '',
            deadline: '',
            icon: 'target',
            calculationMethod: goalPreferences.defaultCalculationMethod
        });
        setIsMobileModalOpen(false);
    };

    const handleEditClick = (goal: Goal) => {
        setEditingId(goal.id);
        setFormData({
            name: goal.name,
            targetAmount: goal.targetAmount.toString(),
            deadline: goal.deadline,
            icon: goal.icon || 'target',
            calculationMethod: goal.calculationMethod || 'dynamic'
        });
        setIsMobileModalOpen(true);
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; goalId: string | null }>({
        isOpen: false,
        goalId: null
    });

    const handleDeleteClick = (goalId: string) => {
        setDeleteConfirmation({ isOpen: true, goalId });
    };

    const handleConfirmDelete = () => {
        if (deleteConfirmation.goalId) {
            deleteGoal(deleteConfirmation.goalId);
            toast.success('Meta eliminada');
            setDeleteConfirmation({ isOpen: false, goalId: null });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.targetAmount || !formData.deadline) return;

        if (editingId) {
            updateGoal(editingId, {
                name: formData.name,
                targetAmount: Number(formData.targetAmount),
                deadline: formData.deadline,
                icon: formData.icon,
                calculationMethod: formData.calculationMethod as any
            });
            toast.success('Meta actualizada');
        } else {
            addGoal({
                name: formData.name,
                targetAmount: Number(formData.targetAmount),
                deadline: formData.deadline,
                startDate: new Date().toISOString().split('T')[0],
                icon: formData.icon,
                calculationMethod: formData.calculationMethod as any,
                recoveryStrategy: goalPreferences.defaultRecoveryStrategy
            });
            toast.success('Meta creada con éxito');
        }
        resetForm();
    };

    const handleTransferSubmit = () => {
        const amount = Number(transferAmount);
        if (!amount || amount <= 0) return;

        if (transferModal.type === 'withdraw') {
            withdraw(transferModal.goalId, amount, undefined, withdrawStrategy);
            toast.success(`Retirado ${currency}${amount}`);
        } else {
            if (availableBalance < amount) {
                toast.error(`Saldo insuficiente (Disponible: ${currency}${availableBalance})`);
                return;
            }
            addContribution(transferModal.goalId, amount, 'Ingreso Extra');
            toast.success(`Ingresado ${currency}${amount}`);
        }
        setTransferModal({ ...transferModal, open: false });
        setTransferAmount('');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header VIP */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
                        <Target size={14} /> Destinos Financieros
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Mis Metas</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-md">
                        Visualiza tus objetivos, analiza proyecciones y acelera tu progreso hacia lo que más deseas.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                    {/* Resumen Total Ahorrado (Desktop VIP look) */}
                    <div className="hidden lg:flex flex-col bg-zinc-900 dark:bg-zinc-100 px-6 py-3 rounded-2xl shadow-xl">
                        <p className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold tracking-widest">Ahorro Consolidado</p>
                        <p className="text-2xl font-black text-white dark:text-zinc-900 tracking-tighter">
                            <span className="text-sm font-normal text-zinc-500 mr-1">{currency}</span>
                            {totalSaved.toLocaleString()}
                        </p>
                    </div>

                    <button
                        onClick={() => { resetForm(); setIsMobileModalOpen(true); }}
                        className="group relative flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 md:py-3 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 overflow-hidden w-full md:w-auto"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Plus size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="relative z-10 whitespace-nowrap">Forjar Meta</span>
                    </button>
                </div>
            </div>

            <div className="w-full">
                {/* Goals List */}
                <div className={clsx(
                    "grid gap-6 align-top content-start",
                    goals.length === 0 ? "grid-cols-1" :
                        "grid-cols-1 xl:grid-cols-2"
                )}>
                    {goals.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center">
                            <div className="inline-flex p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                                <Target size={32} className="text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin metas activas</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto mt-2">Crea tu primera meta de ahorro para empezar a planificar tu futuro financiero.</p>
                        </div>
                    ) : (
                        goals.map((goal) => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                currency={currency}
                                getMonthlyQuota={getMonthlyQuota}
                                getGoalHealth={getGoalHealth}
                                isGoalPaidThisMonth={isGoalPaidThisMonth}
                                availableBalance={availableBalance}
                                updateGoal={updateGoal}
                                editingId={editingId}
                                handleEditClick={handleEditClick}
                                handleDeleteClick={handleDeleteClick}
                                contributeToGoal={contributeToGoal}
                                setTransferModal={setTransferModal}
                                setWithdrawStrategy={setWithdrawStrategy}
                                getIcon={getIcon}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Mobile Create/Edit Modal */}
            <Modal
                isOpen={isMobileModalOpen}
                onClose={() => resetForm()}
                title={editingId ? "Editar Meta" : "Nueva Meta"}
            >
                <GoalForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={(e) => {
                        handleSubmit(e);
                        // Main close handled by handleSubmit -> resetForm
                    }}
                    editingId={editingId}
                    onCancel={resetForm}
                    currency={currency}
                />
            </Modal>

            {/* Transfer / Withdraw Modal */}
            <Modal
                isOpen={transferModal.open}
                onClose={() => setTransferModal({ ...transferModal, open: false })}
                title={transferModal.type === 'deposit' ? 'Ingreso Extra' : 'Retirar Fondos'}
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {transferModal.type === 'deposit'
                            ? 'Añade fondos adicionales desde tu saldo disponible.'
                            : 'Retira dinero de esta meta. Podrás elegir cómo recuperar el faltante.'}
                    </p>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase block">Monto</label>
                            {transferModal.type === 'deposit' && (
                                <span className={clsx("text-xs font-bold", availableBalance < Number(transferAmount) ? "text-rose-500" : "text-zinc-400")}>
                                    Disponible: {currency}{availableBalance.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            autoFocus
                            max={transferModal.type === 'deposit' ? availableBalance : undefined}
                            className={clsx(
                                "w-full text-3xl font-bold bg-zinc-50 dark:bg-zinc-900 border rounded-xl px-4 py-4 text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors",
                                transferModal.type === 'deposit' && availableBalance < Number(transferAmount)
                                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                                    : "border-zinc-200 dark:border-zinc-800 focus:border-emerald-500"
                            )}
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={e => {
                                const val = Number(e.target.value);
                                if (transferModal.type === 'deposit' && val > availableBalance) {
                                    // Optional: Prevent typing over the limit directly (user feedback is better though)
                                    // setTransferAmount(availableBalance.toString());
                                }
                                setTransferAmount(e.target.value);
                            }}
                        />
                        {transferModal.type === 'deposit' && availableBalance < Number(transferAmount) && (
                            <p className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> El monto supera tu saldo disponible.
                            </p>
                        )}
                    </div>

                    {transferModal.type === 'withdraw' && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4">
                            <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-3 text-sm flex items-center gap-2">
                                <AlertTriangle size={16} /> Estrategia de Recuperación
                            </h4>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        checked={withdrawStrategy === 'spread'}
                                        onChange={() => setWithdrawStrategy('spread')}
                                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <span className="block font-bold text-sm text-zinc-800 dark:text-zinc-200">Prorratear a futuro</span>
                                        <span className="block text-xs text-zinc-500">El dinero retirado se dividirá en partes iguales entre todos los meses que faltan. Tus próximas cuotas subirán de forma más suave.</span>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        checked={withdrawStrategy === 'catch_up'}
                                        onChange={() => setWithdrawStrategy('catch_up')}
                                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <span className="block font-bold text-sm text-zinc-800 dark:text-zinc-200">Recuperar de golpe (Próximo Mes)</span>
                                        <span className="block text-xs text-zinc-500">Se sumará la totalidad de este retiro a tu cuota del siguiente mes para no alterar el resto de tu plan.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleTransferSubmit}
                        disabled={transferModal.type === 'deposit' && (Number(transferAmount) > availableBalance || Number(transferAmount) <= 0)}
                        className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${transferModal.type === 'deposit'
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                            : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                            }`}
                    >
                        {transferModal.type === 'deposit' ? 'Confirmar Ingreso' : 'Confirmar Retiro'}
                    </button>
                </div>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, goalId: null })}
                title="Eliminar Meta"
                maxWidth="max-w-sm"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center p-2">
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-500">
                            <Trash2 size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">¿Estás seguro?</h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Esta acción eliminará la meta y todo su historial de progresos permanentemente. No se puede deshacer.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setDeleteConfirmation({ isOpen: false, goalId: null })}
                            className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Goals;
