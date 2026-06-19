import React, { useState, useMemo } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useSettings } from '../context/SettingsContext';
import { useBalance } from '../hooks/useBalance';
import { useGamification } from '../context/GamificationContext';
import {
    Target, Trash2, Edit2, TrendingUp, AlertTriangle,
    MinusCircle, PlusCircle, Pencil, Zap,
    Gift, DollarSign, Heart, Flame, PiggyBank, Wallet, Star, Smile,
    Briefcase, Car, Plane, Home, Coffee, Gamepad2, Smartphone, Plus,
    ChevronDown, ChevronUp, CheckSquare, Square, Trophy
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import type { Goal, Milestone } from '../types';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { DatePicker } from '../components/ui/DatePicker';

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

// --- Reusable Form Component with Milestones support ---
export interface GoalFormProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    editingId: string | null;
    onCancel: () => void;
    currency: string;
}

export const GoalForm = ({ formData, setFormData, onSubmit, editingId, onCancel, currency }: GoalFormProps) => {
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

    const addMilestone = () => {
        if (!newMilestoneTitle.trim()) return;
        const newMs: Milestone = {
            id: crypto.randomUUID(),
            title: newMilestoneTitle.trim(),
            status: 'pending'
        };
        setFormData({
            ...formData,
            milestones: [...(formData.milestones || []), newMs]
        });
        setNewMilestoneTitle('');
    };

    const removeMilestone = (id: string) => {
        setFormData({
            ...formData,
            milestones: (formData.milestones || []).filter((m: Milestone) => m.id !== id)
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {editingId ? 'Editar Meta' : 'Nueva Meta'}
                </h3>
                <p className="text-sm text-zinc-500 font-medium">Define tu próximo objetivo financiero</p>
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
                <div className="grid grid-cols-8 gap-2">
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
                                <Icon size={16} strokeWidth={isSelected ? 2.5 : 2} />
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
            </div>

            {/* Milestones Editor inside form */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1 block">Hitos / Sub-objetivos de Ahorro</label>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        placeholder="Ej. Comprar boletos, Reservar hotel..."
                        className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                        value={newMilestoneTitle}
                        onChange={e => setNewMilestoneTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                    />
                    <button
                        type="button"
                        onClick={addMilestone}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm"
                    >
                        Añadir
                    </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {(formData.milestones || []).map((m: Milestone) => (
                        <div key={m.id} className="flex justify-between items-center p-2.5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800 rounded-xl text-xs">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{m.title}</span>
                            <button
                                type="button"
                                onClick={() => removeMilestone(m.id)}
                                className="text-rose-500 hover:text-rose-700 font-bold"
                            >
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
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
    getIcon: (iconName: string) => React.ReactNode;
}) => {
    const { addXp } = useGamification();
    const [showOptimizer, setShowOptimizer] = useState(false);
    const [simulatedExtra, setSimulatedExtra] = useState(0);

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const monthlyQuota = getMonthlyQuota(goal);
    const health = getGoalHealth(goal);
    const canPay = availableBalance >= monthlyQuota;
    const isPaid = isGoalPaidThisMonth(goal);

    const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    const healthLabel = health === 'on_track' ? 'Al día' : (health === 'behind' ? 'Retrasado' : 'Adelantado');
    const healthBg = health === 'on_track' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
        (health === 'behind' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400');
    const glowBg = health === 'on_track' ? 'bg-emerald-500' : (health === 'behind' ? 'bg-rose-500' : 'bg-blue-500');
    const borderGlowColor = health === 'on_track' ? 'hover:border-emerald-500/30' : (health === 'behind' ? 'hover:border-rose-500/30' : 'hover:border-blue-500/30');

    // Simulated quota calculation using the slider value
    const simulatedQuota = useMemo(() => {
        return getMonthlyQuota(goal, new Date(), simulatedExtra);
    }, [goal, getMonthlyQuota, simulatedExtra]);

    // Handle milestone toggling
    const toggleMilestone = (msId: string) => {
        const updatedMs = (goal.milestones || []).map(m => {
            if (m.id === msId) {
                const newStatus = m.status === 'completed' ? 'pending' as const : 'completed' as const;
                if (newStatus === 'completed') {
                    addXp(15); // Award 15 XP for completing a milestone!
                    toast.success("¡Hito Completado!", {
                        description: `Has completado "${m.title}". ¡Ganaste +15 XP! 🏆`
                    });
                }
                return { ...m, status: newStatus };
            }
            return m;
        });
        updateGoal(goal.id, { milestones: updatedMs });
    };

    return (
        <div key={goal.id} className={clsx(
            "group relative flex flex-col bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border rounded-[2rem] p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border-zinc-200/60 dark:border-zinc-800/80",
            editingId === goal.id ? "border-indigo-500 ring-4 ring-indigo-500/10" : borderGlowColor
        )}>
            {/* Ambient Glow */}
            <div className={clsx("absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-opacity duration-700 group-hover:opacity-25 pointer-events-none", glowBg)} />

            {/* Header Layout */}
            <div className="relative flex justify-between items-start gap-4 mb-6">
                <div className="flex gap-4 flex-1">
                    {/* Icon */}
                    <div className={clsx(
                        "flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 shadow-inner",
                        health === 'on_track' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            (health === 'behind' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400')
                    )}>
                        {getIcon(goal.icon || 'target')}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate">{goal.name}</h3>
                            <span className={clsx("px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-widest", healthBg)}>
                                {healthLabel}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-400 mt-1">
                            <span>Meta: <strong className="text-zinc-800 dark:text-zinc-300">{currency}{goal.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span>
                            <span>•</span>
                            <span>Límite: <strong className="text-zinc-800 dark:text-zinc-300">{new Date(goal.deadline + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Edit/Delete Actions */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => {
                        const newMethod = goal.calculationMethod === 'dynamic' ? 'static' : 'dynamic';
                        updateGoal(goal.id, { calculationMethod: newMethod });
                        toast.info("Ahorro Dinámico", {
                            description: newMethod === 'dynamic'
                                ? `Activado para "${goal.name}". La cuota se ajustará según tu progreso.`
                                : `Desactivado para "${goal.name}". La cuota volverá a ser fija.`
                        });
                    }}
                        className={clsx("p-2 rounded-xl transition-colors shadow-sm", goal.calculationMethod === 'dynamic' ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600")}
                        title="Alternar Modo Dinámico"
                    >
                        <Zap size={14} className={goal.calculationMethod === 'dynamic' ? "fill-current" : ""} />
                    </button>
                    <button onClick={() => handleEditClick(goal)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-blue-600 rounded-xl transition-colors shadow-sm">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteClick(goal.id)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-600 rounded-xl transition-colors shadow-sm">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Core Metrics & Segmented Progress Bar */}
            <div className="relative space-y-4 mb-6">
                <div className="flex justify-between items-end gap-2">
                    <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mb-0.5">Acumulado</p>
                        <p className="text-2xl font-mono font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
                            <span className="text-sm text-zinc-400 font-sans mr-1">{currency}</span>
                            {goal.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mb-0.5">Progreso</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{progress.toFixed(0)}%</p>
                    </div>
                </div>

                {/* Progress bar container */}
                <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                        className={clsx(
                            "h-full rounded-full transition-all duration-1000",
                            progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>

            {/* SAVINGS GOAL MILESTONES (HITOS) SECTION */}
            {goal.milestones && goal.milestones.length > 0 && (
                <div className="mb-6 space-y-2">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Trophy size={12} className="text-yellow-500" /> Hitos Alcanzados ({(goal.milestones.filter(m => m.status === 'completed').length)}/{goal.milestones.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl">
                        {goal.milestones.map(m => {
                            const isDone = m.status === 'completed';
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => toggleMilestone(m.id)}
                                    className="flex items-center gap-2 text-left p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group/ms"
                                >
                                    {isDone ? (
                                        <CheckSquare size={16} className="text-emerald-500 shrink-0" />
                                    ) : (
                                        <Square size={16} className="text-zinc-400 group-hover/ms:text-zinc-600 shrink-0" />
                                    )}
                                    <span className={clsx("text-xs font-semibold truncate", isDone ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300")}>
                                        {m.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CATCH-UP OPTIMIZER SIMULATOR PANEL */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => {
                        setShowOptimizer(!showOptimizer);
                        setSimulatedExtra(0);
                    }}
                    className="flex items-center justify-between w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl transition-colors text-xs font-bold text-zinc-600 dark:text-zinc-400"
                >
                    <span className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-indigo-500" /> Catch-up Optimizer
                    </span>
                    {showOptimizer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showOptimizer && (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl mt-2 space-y-4 animate-in slide-in-from-top-2 fade-in">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-zinc-500">Aporte Extraúnico</span>
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{currency}{simulatedExtra}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={Math.max(100, goal.targetAmount - goal.currentAmount)}
                                step="10"
                                value={simulatedExtra}
                                onChange={e => setSimulatedExtra(Number(e.target.value))}
                                className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        <div className="bg-white dark:bg-zinc-900/60 border border-indigo-100/30 dark:border-indigo-900/10 p-3 rounded-xl flex justify-between items-center text-xs">
                            <div>
                                <span className="text-[10px] text-zinc-500 block">Cuota mensual reducida</span>
                                <span className="font-mono font-black text-zinc-900 dark:text-zinc-100 text-sm">
                                    {currency}{simulatedQuota.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            {simulatedExtra > 0 && (
                                <div className="text-right">
                                    <span className="text-[9px] text-emerald-500 font-bold uppercase block">¡Ahorras!</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        -{currency}{Math.max(0, monthlyQuota - simulatedQuota).toLocaleString(undefined, { maximumFractionDigits: 0 })} / mes
                                    </span>
                                </div>
                            )}
                        </div>

                        {simulatedExtra > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setTransferModal({ open: true, type: 'deposit', goalId: goal.id });
                                }}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                                Registrar este aporte de {currency}{simulatedExtra}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Control Area */}
            <div className="relative mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mb-0.5 flex items-center gap-2">
                        Cuota de {capitalizedMonth}
                        {isPaid && <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.2 rounded text-[8px] font-bold">COMPLETADA</span>}
                    </p>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                        <span className="text-sm font-normal text-zinc-500 mr-0.5">{currency}</span>
                        {monthlyQuota.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTransferModal({ open: true, type: 'withdraw', goalId: goal.id })}
                        disabled={goal.currentAmount <= 0}
                        className="h-11 px-4 bg-rose-600/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm hover:bg-rose-600/20 disabled:opacity-50"
                        title="Retirar Dinero"
                    >
                        <MinusCircle size={16} className="shrink-0" />
                    </button>
                    {isPaid ? (
                        <button
                            onClick={() => setTransferModal({ open: true, type: 'deposit', goalId: goal.id })}
                            disabled={availableBalance <= 0}
                            className={clsx(
                                "flex-1 sm:flex-none min-w-[130px] h-11 px-5 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm",
                                availableBalance > 0
                                    ? "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            <Plus size={16} /> <span>Aportar Más</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                contributeToGoal(goal.id, monthlyQuota);
                            }}
                            disabled={!canPay}
                            className={clsx(
                                "flex-1 sm:flex-none min-w-[130px] h-11 px-5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 text-sm",
                                canPay ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-zinc-900/20" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            <span>{canPay ? 'Pagar Cuota' : 'Saldo Insuficiente'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const Goals = () => {
    const { goals, addGoal, deleteGoal, contributeToGoal, addContribution, withdraw, getMonthlyQuota, updateGoal, isGoalPaidThisMonth } = useGoals();
    const { currency, goalPreferences } = useSettings();
    const { availableBalance } = useBalance();

    const totalSaved = React.useMemo(() => goals.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0), [goals]);

    // State for Create/Edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        deadline: '',
        icon: 'target',
        calculationMethod: goalPreferences.defaultCalculationMethod,
        milestones: [] as Milestone[]
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
        const start = new Date(goal.startDate);
        const end = new Date(goal.deadline);
        const monthsDiff = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
        const originalMonthly = goal.targetAmount / monthsDiff;

        if (quota > originalMonthly * 1.1) return 'behind';
        if (quota < originalMonthly * 0.9) return 'ahead';
        return 'on_track';
    };

    const getIcon = (iconName: string) => {
        const Icon = ICON_MAP[iconName] || Target;
        return <Icon size={22} />;
    };

    // --- Handlers ---
    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            targetAmount: '',
            deadline: '',
            icon: 'target',
            calculationMethod: goalPreferences.defaultCalculationMethod,
            milestones: []
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
            calculationMethod: goal.calculationMethod || 'dynamic',
            milestones: goal.milestones || []
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
                calculationMethod: formData.calculationMethod as any,
                milestones: formData.milestones
            });
            toast.success("Meta Actualizada", {
                description: `Se guardaron los cambios para la meta "${formData.name}".`
            });
        } else {
            addGoal({
                name: formData.name,
                targetAmount: Number(formData.targetAmount),
                deadline: formData.deadline,
                startDate: new Date().toISOString().split('T')[0],
                icon: formData.icon,
                calculationMethod: formData.calculationMethod as any,
                recoveryStrategy: goalPreferences.defaultRecoveryStrategy,
                milestones: formData.milestones
            });
            toast.success("Meta Creada", {
                description: `La meta de ahorro "${formData.name}" ha sido creada.`
            });
        }
        resetForm();
    };

    const handleTransferSubmit = () => {
        const amount = Number(transferAmount);
        if (!amount || amount <= 0) return;

        if (transferModal.type === 'withdraw') {
            withdraw(transferModal.goalId, amount, undefined, withdrawStrategy);
        } else {
            if (availableBalance < amount) {
                toast.error("Saldo Insuficiente", {
                    description: `Solo tienes ${currency}${availableBalance.toLocaleString()} disponible en Wallet.`
                });
                return;
            }
            addContribution(transferModal.goalId, amount, 'Ingreso Extra');
        }
        setTransferModal({ ...transferModal, open: false });
        setTransferAmount('');
    };

    return (
        <div className="space-y-8 pb-24 md:pb-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-zinc-200/60 dark:border-zinc-800">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                        <Target size={14} /> Destinos Financieros
                    </div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Mis Metas de Ahorro</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md">
                        Define metas, realiza aportes y optimiza tus plazos con simulación en tiempo real.
                    </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Consolidado */}
                    <div className="hidden lg:flex flex-col bg-zinc-900 dark:bg-zinc-100 px-6 py-3 rounded-2xl shadow-xl">
                        <p className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold tracking-widest">Ahorro Consolidado</p>
                        <p className="text-xl font-black text-white dark:text-zinc-900 tracking-tighter">
                            <span className="text-sm font-normal text-zinc-500 mr-0.5">{currency}</span>
                            {totalSaved.toLocaleString()}
                        </p>
                    </div>

                    <button
                        onClick={() => { resetForm(); setIsMobileModalOpen(true); }}
                        className="group relative flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto"
                    >
                        <Plus size={18} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="relative z-10 whitespace-nowrap">Forjar Meta</span>
                    </button>
                </div>
            </div>

            {/* Goals Grid */}
            <div className="w-full">
                {goals.length === 0 ? (
                    <div className="bg-white/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                        <div className="inline-flex p-4 bg-zinc-50 dark:bg-zinc-800 rounded-full mb-4">
                            <Target size={32} className="text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin metas activas</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto mt-2">Crea tu primera meta de ahorro para empezar a planificar tu futuro financiero.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                        {goals.map((goal) => (
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
                                getIcon={getIcon}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={isMobileModalOpen}
                onClose={() => resetForm()}
                title={editingId ? "Editar Meta" : "Nueva Meta"}
            >
                <GoalForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleSubmit}
                    editingId={editingId}
                    onCancel={resetForm}
                    currency={currency}
                />
            </Modal>

            {/* Transfer Modal */}
            <Modal
                isOpen={transferModal.open}
                onClose={() => setTransferModal({ ...transferModal, open: false })}
                title={transferModal.type === 'deposit' ? 'Ingreso Extra' : 'Retirar Fondos'}
                maxWidth="max-w-md"
            >
                <div className="space-y-6">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
                            onChange={e => setTransferAmount(e.target.value)}
                        />
                        {transferModal.type === 'deposit' && availableBalance < Number(transferAmount) && (
                            <p className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> El monto supera tu saldo disponible.
                            </p>
                        )}
                    </div>

                    {transferModal.type === 'withdraw' && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4">
                            <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-3 text-sm flex items-center gap-2">
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
