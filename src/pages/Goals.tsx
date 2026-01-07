import React, { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../context/SettingsContext';
import { Target, Calculator, Trash2, Edit2 } from 'lucide-react';
import Modal from '../components/ui/Modal';


const Goals = () => {
    const { goals, addGoal, deleteGoal, contributeToGoal, isGoalPaidThisMonth, addContribution, withdraw, getMonthlyQuota, updateGoal } = useGoals();
    const { total: totalIncome } = useTransactions('income');
    const { total: totalExpenses } = useTransactions('expense');
    const { currency } = useSettings();

    // Calculate Available Balance (Income - Expenses - Savings)
    const totalSaved = goals.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0);
    const availableBalance = (totalIncome - totalExpenses) - totalSaved;

    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        deadline: '',
        icon: '🎯' // Default emoji
    });

    // Derived for UI
    const targetDate = formData.deadline ? new Date(formData.deadline) : null;
    const monthsRemaining = targetDate ? Math.max(1, (targetDate.getFullYear() - new Date().getFullYear()) * 12 + (targetDate.getMonth() - new Date().getMonth())) : 0;

    const monthlySavings = formData.targetAmount && monthsRemaining > 0
        ? Number(formData.targetAmount) / monthsRemaining
        : 0;

    const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: React.ReactNode }>({
        open: false,
        title: '',
        message: ''
    });

    const [transferModal, setTransferModal] = useState<{ open: boolean; type: 'deposit' | 'withdraw'; goalId: string; goalName: string }>({
        open: false,
        type: 'deposit',
        goalId: '',
        goalName: ''
    });
    const [transferAmount, setTransferAmount] = useState('');

    const [editModal, setEditModal] = useState<{ open: boolean; goalId: string }>({
        open: false,
        goalId: ''
    });
    const [editFormData, setEditFormData] = useState({
        name: '',
        targetAmount: '',
        deadline: '',
        icon: ''
    });

    const openEditModal = (goal: any) => {
        setEditModal({ open: true, goalId: goal.id });
        setEditFormData({
            name: goal.name,
            targetAmount: goal.targetAmount.toString(),
            deadline: goal.deadline || '',
            icon: goal.icon || '🎯'
        });
    };

    const handleEditSubmit = () => {
        if (!editFormData.name || !editFormData.targetAmount || !editFormData.deadline) return;

        updateGoal(editModal.goalId, {
            name: editFormData.name,
            targetAmount: Number(editFormData.targetAmount),
            deadline: editFormData.deadline,
            icon: editFormData.icon
        });

        setEditModal({ open: false, goalId: '' });
    };



    const handleTransferSubmit = () => {
        const amount = Number(transferAmount);
        if (!amount || amount <= 0) return;

        if (transferModal.type === 'withdraw') {
            const goal = goals.find(g => g.id === transferModal.goalId);
            if (!goal || goal.currentAmount < amount) {
                alert('No hay suficientes fondos ahorrados en esta meta para retirar esa cantidad.');
                return;
            }
            withdraw(transferModal.goalId, amount);
        } else {
            if (availableBalance < amount) {
                alert(`No tienes saldo disponible suficiente (${currency}${availableBalance.toFixed(2)})`);
                return;
            }
            addContribution(transferModal.goalId, amount, 'Ingreso Extra');
        }
        setTransferModal({ ...transferModal, open: false });
    };

    const handleContribute = (goalId: string, amount: number, goalName: string) => {
        if (availableBalance >= amount) {
            contributeToGoal(goalId, amount);
        } else {
            setErrorModal({
                open: true,
                title: 'Saldo Insuficiente',
                message: (
                    <div className="space-y-4">
                        <p className="text-zinc-600 dark:text-zinc-300">
                            No tienes saldo disponible suficiente para pagar la cuota de <span className="font-bold text-zinc-900 dark:text-zinc-100">{goalName}</span>.
                        </p>
                        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg border border-rose-100 dark:border-rose-900/30 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-rose-800 dark:text-rose-300">Saldo Disponible:</span>
                                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{currency}{availableBalance.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-rose-800 dark:text-rose-300">Cuota Necesaria:</span>
                                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{currency}{amount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-rose-200 dark:border-rose-800/50 pt-2 mt-2 flex justify-between text-sm font-bold">
                                <span className="text-rose-900 dark:text-rose-200">Faltante:</span>
                                <span className="font-mono text-rose-600 dark:text-rose-400">-{currency}{(amount - availableBalance).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.targetAmount || !formData.deadline) return;

        addGoal({
            name: formData.name,
            targetAmount: Number(formData.targetAmount),
            deadline: formData.deadline,
            startDate: new Date().toISOString().split('T')[0],
            icon: formData.icon || '🎯'
        });

        setFormData({ name: '', targetAmount: '', deadline: '', icon: '🎯' });
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Calculadora de Metas</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Planifica tus compras y objetivos de ahorro</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario / Calculadora */}
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl space-y-4 shadow-sm dark:shadow-none">
                        <h3 className="text-lg font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Calculator size={18} />
                            Simular Meta
                        </h3>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Nombre del Objetivo</label>
                            <input
                                type="text"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                                placeholder="Ej. Coche Nuevo"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Monto Necesario</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                                placeholder="0.00"
                                value={formData.targetAmount}
                                onChange={e => {
                                    const value = e.target.value;
                                    if (/^\d*\.?\d*$/.test(value)) {
                                        setFormData({ ...formData, targetAmount: value });
                                    }
                                }}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Fecha Objetivo</label>
                            <input
                                type="date"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500 uppercase tracking-wider">Icono (Emoji)</label>
                            <input
                                type="text"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 text-center text-lg"
                                placeholder="🎯"
                                value={formData.icon}
                                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                maxLength={2}
                            />
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg text-center border border-zinc-200 dark:border-zinc-800 border-dashed mt-4">
                            <p className="text-xs text-zinc-500 uppercase mb-1">Ahorro Mensual Sugerido</p>
                            <p className="text-2xl font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {currency}{isFinite(monthlySavings) ? monthlySavings.toFixed(2) : '0.00'}
                            </p>
                            {monthsRemaining > 0 && <p className="text-[10px] text-zinc-400 mt-1">Durante ~{monthsRemaining} meses</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                            Crear Meta
                        </button>
                    </form>
                </div>

                {/* Lista de Metas */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-300 flex items-center gap-2">
                            <Target size={18} />
                            Metas
                        </h3>
                        {/* Tabs (optional implementation, for now standard list) */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {goals.length === 0 ? (
                            <div className="col-span-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
                                <p className="text-zinc-500">No hay metas definidas.</p>
                            </div>
                        ) : (
                            goals.map((goal) => {
                                const isPaid = isGoalPaidThisMonth(goal);
                                const monthlyAmount = getMonthlyQuota(goal);
                                const progress = (goal.currentAmount / goal.targetAmount) * 100;

                                return (
                                    <div key={goal.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl group relative shadow-sm dark:shadow-none flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-2xl mb-1 block">{goal.icon || '🎯'}</span>
                                                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{goal.name}</h4>
                                                    <p className="text-[10px] text-zinc-400">Vence: {goal.deadline || 'Sin fecha'}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openEditModal(goal)}
                                                        className="text-zinc-400 hover:text-blue-500 transition-colors p-1"
                                                        title="Editar meta"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteGoal(goal.id)}
                                                        className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                                                        title="Eliminar meta"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-1">
                                                <div className="flex justify-between text-xs text-zinc-500">
                                                    <span>Progreso Total</span>
                                                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{progress.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                                                    <div
                                                        className="h-full bg-emerald-500 transition-all duration-500 relative"
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    >
                                                        {progress >= 20 && (
                                                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Motivation Message */}
                                                <div className="text-center py-2">
                                                    <p className="text-xs italic text-zinc-400">
                                                        {progress >= 100 ? "¡Meta alcanzada! 🎉"
                                                            : progress >= 75 ? "¡Ya casi estás ahí! 🚀"
                                                                : progress >= 50 ? "¡Más de la mitad! 💪"
                                                                    : progress >= 25 ? "¡Buen progreso, sigue así! 👍"
                                                                        : "¡Todo viaje empieza con un paso! 🌱"}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between text-xs mt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-2">
                                                    <span className="text-zinc-400 font-mono">{currency}{goal.currentAmount.toFixed(2)}</span>
                                                    <span className="text-zinc-400 font-mono">/ {currency}{goal.targetAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs text-zinc-500">Cuota Mensual</p>
                                                    <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{currency}{monthlyAmount.toFixed(2)}</p>
                                                </div>

                                                {isPaid ? (
                                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                                                        ¡Pagado este mes!
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleContribute(goal.id, monthlyAmount, goal.name)}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-emerald-900/20"
                                                    >
                                                        Pagar Cuota
                                                    </button>
                                                )}
                                            </div>
                                            {isPaid && (
                                                <p className="text-[10px] text-zinc-400 mt-2 text-right italic">
                                                    Suma al saldo de Ahorro
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div >

            <Modal
                isOpen={errorModal.open}
                onClose={() => setErrorModal({ ...errorModal, open: false })}
                title={errorModal.title}
            >
                {errorModal.message}
            </Modal>

            {/* Transfer Modal */}
            <Modal
                isOpen={transferModal.open}
                onClose={() => setTransferModal({ ...transferModal, open: false })}
                title={transferModal.type === 'deposit' ? 'Ingresar Fondos Extra' : 'Retirar Fondos'}
            >
                <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                        {transferModal.type === 'deposit'
                            ? 'Añade dinero extra a esta meta desde tu saldo disponible.'
                            : 'Mueve dinero de esta meta de vuelta a tu saldo disponible.'}
                    </p>

                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Monto</label>
                        <input
                            type="number"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                            placeholder="0.00"
                            autoFocus
                            value={transferAmount}
                            onChange={e => setTransferAmount(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleTransferSubmit}
                            className={`w-full py-2 rounded-lg font-medium text-white transition-colors ${transferModal.type === 'deposit'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                        >
                            {transferModal.type === 'deposit' ? 'Confirmar Ingreso' : 'Confirmar Retiro'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Goal Modal */}
            <Modal
                isOpen={editModal.open}
                onClose={() => setEditModal({ ...editModal, open: false })}
                title="Editar Meta"
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Nombre</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                            value={editFormData.name}
                            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Monto Necesario</label>
                        <input
                            type="number"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                            value={editFormData.targetAmount}
                            onChange={e => setEditFormData({ ...editFormData, targetAmount: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Fecha Objetivo</label>
                        <input
                            type="date"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                            value={editFormData.deadline}
                            onChange={e => setEditFormData({ ...editFormData, deadline: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Icono</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                            value={editFormData.icon}
                            onChange={e => setEditFormData({ ...editFormData, icon: e.target.value })}
                            maxLength={2}
                        />
                    </div>

                    <button
                        onClick={handleEditSubmit}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors mt-4"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </Modal>
        </div >
    );
};

export default Goals;
