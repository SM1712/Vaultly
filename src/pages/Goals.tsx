import React, { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../context/SettingsContext';
import {
    Target, Calculator, Trash2, Edit2, TrendingUp, AlertTriangle,
    MinusCircle, PlusCircle, Pencil, ChevronsRight, Zap,
    Gift, DollarSign, Heart, Flame, PiggyBank, Wallet, Star, Smile,
    Briefcase, Car, Plane, Home, Coffee, Gamepad2, Smartphone, Lock, Plus, ChevronDown
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import type { Goal } from '../types';
import { clsx } from 'clsx';
import { toast } from 'sonner';

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
interface GoalFormProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    editingId: string | null;
    onCancel: () => void;
    currency: string;
}

const GoalForm = ({ formData, setFormData, onSubmit, editingId, onCancel, currency }: GoalFormProps) => {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        {editingId ? <Edit2 size={20} className="text-blue-500" /> : <Calculator size={20} className="text-zinc-600 dark:text-zinc-300" />}
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{editingId ? 'Editar Meta' : 'Nueva Meta'}</h3>
                </div>
                {editingId && (
                    <button type="button" onClick={onCancel} className="text-xs text-zinc-400 hover:text-zinc-600 underline">Cancelar</button>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Nombre</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Ej. Viaje Japón"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Icono</label>
                    <div className="grid grid-cols-6 gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-32 overflow-y-auto custom-scrollbar">
                        {Object.keys(ICON_MAP).map(key => {
                            const Icon = ICON_MAP[key];
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon: key })}
                                    className={clsx("p-2 rounded-lg flex items-center justify-center transition-all aspect-square",
                                        formData.icon === key
                                            ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-900"
                                            : "text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <Icon size={18} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Monto Objetivo ({currency})</label>
                    <input
                        type="number"
                        required
                        className="w-full text-lg font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="5000"
                        value={formData.targetAmount}
                        onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Fecha Límite</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.deadline}
                        onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    />
                </div>
            </div>

            <button
                type="submit"
                className={clsx("w-full py-3 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]",
                    editingId
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                        : "bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:scale-[1.02] shadow-zinc-900/10 dark:shadow-none"
                )}
            >
                {editingId ? 'Guardar Cambios' : 'Crear Meta'}
            </button>
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
                                    "bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative",
                                    editingId === goal.id ? "border-blue-500 ring-2 ring-blue-500/20" : "border-zinc-200 dark:border-zinc-800"
                                )}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="flex items-center justify-center w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-600 dark:text-zinc-300">
                                                {getIcon(goal.icon || 'target')}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{goal.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {health === 'on_track' && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">En Camino</span>}
                                                    {health === 'behind' && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Atrasado</span>}
                                                    {health === 'ahead' && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Adelantado</span>}
                                                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                        • Vence {new Date(goal.deadline).toLocaleDateString()}
                                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-mono ml-1 text-zinc-500">
                                                            Cuota {currentQuotaNum}/{totalQuotas}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex gap-1 z-10">
                                            <button
                                                onClick={() => {
                                                    const newMethod = goal.calculationMethod === 'dynamic' ? 'static' : 'dynamic';
                                                    updateGoal(goal.id, { calculationMethod: newMethod });
                                                    toast.info(`Ahorro Dinámico: ${newMethod === 'dynamic' ? 'Activado' : 'Desactivado'}`);
                                                }}
                                                className={clsx(
                                                    "p-2 rounded-lg transition-colors",
                                                    goal.calculationMethod === 'dynamic'
                                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                                )}
                                                title={goal.calculationMethod === 'dynamic' ? "Ahorro Dinámico ACTIVO (Click para desactivar)" : "Ahorro Dinámico DESACTIVADO (Click para activar)"}
                                            >
                                                <Zap size={18} className={goal.calculationMethod === 'dynamic' ? "fill-current" : ""} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(goal)}
                                                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-blue-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                title="Editar Meta"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(goal.id)}
                                                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                title="Eliminar Meta"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Progress Bar - TEXTURE REMOVED */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-1.5 font-medium">
                                                <span className="text-zinc-500">Progreso</span>
                                                <span className="text-zinc-900 dark:text-zinc-100">{progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-700/50">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                                        }`}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs mt-2 font-mono text-zinc-400">
                                                <span>{currency}{goal.currentAmount.toLocaleString()}</span>
                                                <span>{currency}{goal.targetAmount.toLocaleString()}</span>
                                            </div>
                                            {/* Strategy Indicator */}
                                            {goal.recoveryStrategy === 'catch_up' && (
                                                <p className="text-[10px] text-amber-600 mt-1 font-bold flex items-center gap-1">
                                                    <AlertTriangle size={10} /> Recuperación Rápida Activa
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions Bar */}
                                        <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="text-center sm:text-left">
                                                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Cuota {capitalizedMonth}</p>
                                                <div className="flex flex-col gap-1 items-center sm:items-start">
                                                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                                            {currency}{monthlyQuota.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </p>
                                                        {/* Trend Indicator */}
                                                        {trend === 'up' && (
                                                            <div className={`flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${warningLimit
                                                                ? "text-amber-600 bg-amber-100 dark:bg-amber-900/30"
                                                                : "text-rose-500 bg-rose-100 dark:bg-rose-900/30"}`}
                                                                title={warningLimit ? "La cuota subirá drásticamente el próximo mes. ¡Modera tus gastos!" : "La cuota subirá el próximo mes"}>
                                                                <TrendingUp size={14} className="mr-0.5" />
                                                                {warningLimit && <AlertTriangle size={12} className="ml-1" />}
                                                            </div>
                                                        )}
                                                        {trend === 'down' && (
                                                            <div className="flex items-center text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-xs font-bold" title="La cuota bajará el próximo mes">
                                                                <ChevronDown size={14} className="mr-0.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {warningLimit && (
                                                        <p className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30 text-center sm:text-left max-w-[200px] leading-tight">
                                                            ¡Ojo! La próxima ola viene grande. Modera gastos.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 w-full sm:w-auto relative z-20">
                                                <button
                                                    onClick={() => {
                                                        console.log("Withdraw clicked", goal.id);
                                                        setTransferModal({ open: true, type: 'withdraw', goalId: goal.id });
                                                        setWithdrawStrategy(goal.recoveryStrategy || 'spread');
                                                    }}
                                                    className="flex-1 sm:flex-none p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors pointer-events-auto"
                                                    title="Retirar Fondos"
                                                >
                                                    <MinusCircle size={24} />
                                                </button>

                                                {isPaid ? (
                                                    <button
                                                        onClick={() => {
                                                            console.log("Advance clicked", goal.id);
                                                            // For advancing, we use the deposit modal logic or a direct action?
                                                            // User wants to advance. Let's use the TransferModal with 'deposit' type
                                                            // but maybe we can trigger it directly or rename it.
                                                            // Reuse existing flow for manual deposit as it allows custom amount.
                                                            setTransferModal({ open: true, type: 'deposit', goalId: goal.id });
                                                        }}
                                                        disabled={availableBalance <= 0}
                                                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                                                        title="Adelantar pagos para reducir cuotas futuras"
                                                    >
                                                        <ChevronsRight size={20} />
                                                        Adelantar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            console.log("Pay quota clicked", goal.id);
                                                            contributeToGoal(goal.id, monthlyQuota);
                                                            toast.success(`Cuota pagada: ${currency}${monthlyQuota}`);
                                                        }}
                                                        disabled={!canPay}
                                                        className={clsx(
                                                            "flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 pointer-events-auto",
                                                            canPay
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 !bg-none"
                                                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                                        )}
                                                        title={!canPay ? `Saldo insuficiente (Te faltan ${currency}${(monthlyQuota - availableBalance).toFixed(2)})` : 'Pagar Cuota Mensual'}
                                                    >
                                                        {canPay ? <PlusCircle size={20} /> : <Lock size={20} />}
                                                        {canPay ? 'Pagar Cuota' : 'Sin Saldo'}
                                                    </button>
                                                )}
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
