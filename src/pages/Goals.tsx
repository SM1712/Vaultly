import React, { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../context/SettingsContext';
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
                <div className="relative flex items-center justify-center">
                    <span className="text-3xl font-black text-zinc-400 absolute left-4 sm:left-12 pointer-events-none transition-colors group-focus-within:text-emerald-500">{currency}</span>
                    <input
                        type="number"
                        required
                        className="w-full bg-transparent text-center text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-100 placeholder-zinc-200 dark:placeholder-zinc-800 focus:outline-none py-4 border-b-2 border-zinc-100 dark:border-zinc-800 focus:border-emerald-500 transition-all"
                        placeholder="0"
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
                    type="submit"
                    className={clsx("flex-[2] py-4 rounded-xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2",
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

const Goals = () => {
    const { goals, addGoal, deleteGoal, contributeToGoal, addContribution, withdraw, getMonthlyQuota, updateGoal, isGoalPaidThisMonth } = useGoals();
    const { total: totalIncome } = useTransactions('income');
    const { total: totalExpenses } = useTransactions('expense');
    const { currency, goalPreferences } = useSettings();

    // Calculate Available Balance
    const totalSaved = goals.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0);
    const availableBalance = (totalIncome - totalExpenses) - totalSaved;

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

        // Mobile Logic: Open Modal
        if (window.innerWidth < 1024) {
            setIsMobileModalOpen(true);
        } else {
            // Desktop Logic: Scroll to top side form
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toast.info(`Editando: ${goal.name}`);
        }
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Metas de Ahorro</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        Visualiza tus objetivos y ajusta tu ritmo de ahorro.
                    </p>
                </div>
                {/* Mobile Create Button */}
                <button
                    onClick={() => { resetForm(); setIsMobileModalOpen(true); }}
                    className="lg:hidden w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Nueva Meta
                </button>

                <div className="hidden lg:block bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs uppercase text-emerald-600 dark:text-emerald-400 font-bold">Total Ahorrado</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{currency}{totalSaved.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Desktop Side Form - Hidden on Mobile */}
                <div className="hidden lg:block lg:col-span-1">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm dark:shadow-none sticky top-4">
                        <GoalForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            editingId={editingId}
                            onCancel={resetForm}
                            currency={currency}
                        />
                    </div>
                </div>

                {/* Goals List */}
                <div className="lg:col-span-2 grid grid-cols-1 gap-4 align-top content-start">
                    {goals.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center">
                            <div className="inline-flex p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                                <Target size={32} className="text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin metas activas</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto mt-2">Crea tu primera meta de ahorro para empezar a planificar tu futuro financiero.</p>
                        </div>
                    ) : (
                        goals.map((goal) => {
                            const progress = (goal.currentAmount / goal.targetAmount) * 100;
                            const monthlyQuota = getMonthlyQuota(goal);
                            const health = getGoalHealth(goal);
                            const canPay = availableBalance >= monthlyQuota;
                            const isPaid = isGoalPaidThisMonth(goal);

                            // --- New Logic: Quota Trend & Progress ---
                            const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });
                            const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

                            // Trend Calculation
                            let trend: 'up' | 'down' | 'stable' | null = null;
                            let warningLimit = false;

                            if (goal.calculationMethod === 'dynamic') {
                                const nextMonth = new Date();
                                nextMonth.setMonth(nextMonth.getMonth() + 1);
                                // Predict considering we PAY the current quota
                                // Note: We simulate paying the quota to see the EFFECT on next month
                                const simulatedAddedAmount = isPaid ? 0 : monthlyQuota;
                                const nextQuota = getMonthlyQuota(goal, nextMonth, simulatedAddedAmount);

                                if (nextQuota > monthlyQuota + 5) trend = 'up';
                                else if (nextQuota < monthlyQuota - 5) trend = 'down';
                                else trend = 'stable';

                                // Check for 20% spike
                                if (nextQuota > monthlyQuota * 1.20) {
                                    warningLimit = true;
                                }
                            }

                            // Quota Progress
                            const start = new Date(goal.startDate);
                            const end = new Date(goal.deadline);
                            const now = new Date();
                            const totalQuotas = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
                            const currentQuotaNum = Math.min(totalQuotas, Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1));
                            // -----------------------------------------

                            return (
                                <div key={goal.id} className={clsx(
                                    "bg-white dark:bg-zinc-900 border rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden",
                                    editingId === goal.id ? "border-blue-500 ring-2 ring-blue-500/20" : "border-zinc-200 dark:border-zinc-800"
                                )}>
                                    {/* Mobile-First Header Layout */}
                                    <div className="flex justify-between items-start gap-3 mb-6">
                                        <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                                            {/* Icon Box */}
                                            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-600 dark:text-zinc-300 shrink-0">
                                                {getIcon(goal.icon || 'target')}
                                            </div>

                                            {/* Title & Chips */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate pr-2">{goal.name}</h3>

                                                {/* Chips Wrapper */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {/* Health Chip */}
                                                    {health === 'on_track' && <span className="inline-flex items-center text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">En Camino</span>}
                                                    {health === 'behind' && <span className="inline-flex items-center text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md">Atrasado</span>}
                                                    {health === 'ahead' && <span className="inline-flex items-center text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">Adelantado</span>}

                                                    {/* Quota Count Chip */}
                                                    <span className="inline-flex items-center text-[10px] sm:text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                                                        #{currentQuotaNum}/{totalQuotas}
                                                    </span>

                                                    {/* Date Chip - Hidden on very small screens if needed, or wrap */}
                                                    <span className="inline-flex items-center text-[10px] sm:text-xs text-zinc-500 px-1">
                                                        Vence: {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Stack */}
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => {
                                                    const newMethod = goal.calculationMethod === 'dynamic' ? 'static' : 'dynamic';
                                                    updateGoal(goal.id, { calculationMethod: newMethod });
                                                    toast.info(`Ahorro Dinámico: ${newMethod === 'dynamic' ? 'Activado' : 'Desactivado'}`);
                                                }}
                                                className={clsx(
                                                    "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-colors",
                                                    goal.calculationMethod === 'dynamic'
                                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200"
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200"
                                                )}
                                                title="Alternar Modo Dinámico"
                                            >
                                                <Zap size={16} className={goal.calculationMethod === 'dynamic' ? "fill-current" : ""} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(goal)}
                                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-blue-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(goal.id)}
                                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Progress Section */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-2 font-medium">
                                                <span className="text-zinc-500 dark:text-zinc-400">Progreso Global</span>
                                                <span className="text-zinc-900 dark:text-zinc-100 font-bold">{progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-3 sm:h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs mt-1.5 font-mono text-zinc-400">
                                                <span>{currency}{goal.currentAmount.toLocaleString()}</span>
                                                <span>{currency}{goal.targetAmount.toLocaleString()}</span>
                                            </div>

                                            {/* Strategy Pill */}
                                            {goal.recoveryStrategy === 'catch_up' && (
                                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-100 dark:border-rose-900/30">
                                                    <AlertTriangle size={10} /> RECUPERACIÓN AGRESIVA
                                                </div>
                                            )}
                                        </div>

                                        {/* Quota Action Box - Redesigned for Mobile */}
                                        <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-4">

                                                {/* Left: Quota Info */}
                                                <div className="text-center sm:text-left w-full sm:w-auto">
                                                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-1.5">Cuota de {capitalizedMonth}</p>
                                                    <div className="flex flex-col items-center sm:items-start gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-3xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                                                {currency}{monthlyQuota.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                            </span>

                                                            {(trend === 'up' || trend === 'down') && (
                                                                <div className={clsx("flex items-center px-2 py-1 rounded-lg text-xs font-bold animate-in fade-in zoom-in",
                                                                    trend === 'up' ? (warningLimit ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700") : "bg-emerald-100 text-emerald-700"
                                                                )}>
                                                                    {trend === 'up' ? <TrendingUp size={14} /> : <ChevronDown size={14} />}
                                                                    <span className="ml-1 hidden sm:inline">{trend === 'up' ? 'Sube' : 'Baja'}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {warningLimit && (
                                                            <span className="text-[10px] text-rose-500 font-medium bg-rose-50 dark:bg-rose-900/10 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/20">
                                                                +20% prox. mes
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right: Buttons */}
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => {
                                                            setTransferModal({ open: true, type: 'withdraw', goalId: goal.id });
                                                            setWithdrawStrategy(goal.recoveryStrategy || 'spread');
                                                        }}
                                                        className="h-12 w-12 sm:h-11 sm:w-11 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm active:scale-95"
                                                        title="Retirar Fondos"
                                                    >
                                                        <MinusCircle size={22} />
                                                    </button>

                                                    {isPaid ? (
                                                        <button
                                                            onClick={() => setTransferModal({ open: true, type: 'deposit', goalId: goal.id })}
                                                            disabled={availableBalance <= 0}
                                                            className="flex-1 sm:flex-none h-12 sm:h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <ChevronsRight size={18} />
                                                            <span>Adelantar</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                contributeToGoal(goal.id, monthlyQuota);
                                                                toast.success(`Cuota pagada: ${currency}${monthlyQuota}`);
                                                            }}
                                                            disabled={!canPay}
                                                            className={clsx(
                                                                "flex-1 sm:flex-none h-12 sm:h-11 px-5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95",
                                                                canPay
                                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none"
                                                            )}
                                                        >
                                                            {canPay ? <PlusCircle size={18} /> : <Lock size={18} />}
                                                            <span>{canPay ? 'Pagar' : 'Sin Saldo'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
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
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Monto</label>
                        <input
                            type="number"
                            autoFocus
                            className="w-full text-3xl font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-4 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={e => setTransferAmount(e.target.value)}
                        />
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
                                        <span className="block font-bold text-sm text-zinc-800 dark:text-zinc-200">Redistribuir (Spread)</span>
                                        <span className="block text-xs text-zinc-500">Divide el faltante entre todos los meses restantes. Tu cuota subirá ligeramente.</span>
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
                                        <span className="block font-bold text-sm text-zinc-800 dark:text-zinc-200">Pagar el Próximo Mes (Catch Up)</span>
                                        <span className="block text-xs text-zinc-500">Se sumará todo lo retirado a tu próxima cuota para volver al plan original de inmediato.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleTransferSubmit}
                        className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg ${transferModal.type === 'deposit'
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
