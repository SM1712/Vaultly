import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PiggyBank, Target, Plus, Check, ChevronDown, 
    ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Zap
} from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import { useFunds } from '../../hooks/useFunds';
import { useBalance } from '../../hooks/useBalance';
import { useSettings } from '../../context/SettingsContext';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { ArtNumber } from '../../components/ui/ArtNumber';

const MobileSavings = () => {
    const { 
        goals, addGoal, deleteGoal, addContribution, withdraw, updateGoal, getMonthlyQuota, isGoalPaidThisMonth
    } = useGoals();
    const { 
        funds, addFund, deleteFund, addTransaction: addFundTx 
    } = useFunds();
    
    const { availableBalance } = useBalance();
    const { currency, goalPreferences } = useSettings();

    // Active Section: goals | funds
    const [activeTab, setActiveTab] = useState<'goals' | 'funds'>('goals');

    // Bottom Sheets states
    const [actionSheetConfig, setActionSheetConfig] = useState<{
        isOpen: boolean;
        type: 'goal' | 'fund';
        targetId: string;
        targetName: string;
    } | null>(null);

    const [depositWithdrawType, setDepositWithdrawType] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    // Delete Confirmation State
    const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<{
        isOpen: boolean;
        type: 'goal' | 'fund';
        id: string;
        name: string;
    } | null>(null);

    // Form sheets for creating new goals or funds
    const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
    const [isCreateFundOpen, setIsCreateFundOpen] = useState(false);

    // Goal Form State
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState('General');
    const [newGoalDeadline, setNewGoalDeadline] = useState('');

    // Fund Form State
    const [newFundName, setNewFundName] = useState('');
    const [newFundDesc, setNewFundDesc] = useState('');

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    const handleActionConfirm = () => {
        if (!actionSheetConfig) return;
        const val = Number(amount);
        if (!val || val <= 0) return;

        const { type, targetId, targetName } = actionSheetConfig;

        if (type === 'goal') {
            if (depositWithdrawType === 'deposit') {
                if (val > availableBalance) {
                    toast.error('Fondos Insuficientes en Wallet');
                    return;
                }
                addContribution(targetId, val, note || 'Aporte Móvil');
            } else {
                const goal = goals.find(g => g.id === targetId);
                if (val > (goal?.currentAmount || 0)) {
                    toast.error('No puedes retirar más de lo ahorrado');
                    return;
                }
                withdraw(targetId, val, note || 'Retiro Móvil');
            }
        } else {
            // Fund Tx
            if (depositWithdrawType === 'deposit') {
                if (val > availableBalance) {
                    toast.error('Fondos Insuficientes en Wallet');
                    return;
                }
                addFundTx(targetId, val, 'deposit', note || 'Aporte Móvil');
            } else {
                const fund = funds.find(f => f.id === targetId);
                if (val > (fund?.currentAmount || 0)) {
                    toast.error('No puedes retirar más de lo guardado');
                    return;
                }
                addFundTx(targetId, val, 'withdraw', note || 'Retiro Móvil');
            }
        }

        triggerHaptic();
        setActionSheetConfig(null);
        setAmount('');
        setNote('');
    };

    const handleCreateGoal = () => {
        const targetVal = Number(newGoalTarget);
        if (!newGoalName.trim() || !targetVal || targetVal <= 0) return;

        // Map category names to icons/emojis
        let emoji = '🎯';
        if (newGoalCategory === 'Viajes') emoji = '✈️';
        else if (newGoalCategory === 'Hogar') emoji = '🏠';
        else if (newGoalCategory === 'Educación') emoji = '🎓';
        else if (newGoalCategory === 'Tecnología') emoji = '💻';
        else if (newGoalCategory === 'Emergencias') emoji = '🚨';

        addGoal({
            name: newGoalName,
            targetAmount: targetVal,
            deadline: newGoalDeadline || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
            startDate: new Date().toISOString().split('T')[0],
            icon: emoji,
            calculationMethod: goalPreferences?.defaultCalculationMethod || 'dynamic',
            recoveryStrategy: goalPreferences?.defaultRecoveryStrategy || 'spread',
            milestones: []
        });

        triggerHaptic();
        toast.success(`Meta "${newGoalName}" creada`);
        setIsCreateGoalOpen(false);
        setNewGoalName('');
        setNewGoalTarget('');
        setNewGoalDeadline('');
    };

    const handleCreateFund = () => {
        if (!newFundName.trim()) return;

        addFund({
            name: newFundName,
            description: newFundDesc || 'Fondo de ahorro para emergencias o proyectos.',
            icon: 'Landmark',
            color: 'bg-zinc-800'
        });

        triggerHaptic();
        toast.success(`Fondo "${newFundName}" creado`);
        setIsCreateFundOpen(false);
        setNewFundName('');
        setNewFundDesc('');
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Mis Ahorros</span>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Reserva de Capital 💰</h1>
                </div>
                {/* Floating Create Button */}
                <button
                    onClick={() => {
                        triggerHaptic();
                        if (activeTab === 'goals') setIsCreateGoalOpen(true);
                        else setIsCreateFundOpen(true);
                    }}
                    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                >
                    <Plus size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Wallet Info Summary Bar */}
            <div className="flex justify-between items-center p-3 bg-zinc-150 dark:bg-zinc-900/60 border border-zinc-200/30 dark:border-zinc-800/40 rounded-2xl">
                <span className="text-xs text-zinc-500 font-bold">Disponible en Wallet:</span>
                <span className="text-sm font-black text-emerald-500">
                    <ArtNumber value={availableBalance} symbol={currency} />
                </span>
            </div>

            {/* Segmented control */}
            <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 rounded-2xl">
                <button
                    onClick={() => { setActiveTab('goals'); triggerHaptic(); }}
                    className={clsx(
                        "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all",
                        activeTab === 'goals'
                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                            : "text-zinc-500 dark:text-zinc-400"
                    )}
                >
                    <Target size={14} /> Metas de Ahorro
                </button>
                <button
                    onClick={() => { setActiveTab('funds'); triggerHaptic(); }}
                    className={clsx(
                        "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all",
                        activeTab === 'funds'
                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                            : "text-zinc-500 dark:text-zinc-400"
                    )}
                >
                    <PiggyBank size={14} /> Fondos de Reserva
                </button>
            </div>

            {/* Goals list */}
            {activeTab === 'goals' ? (
                <div className="space-y-4">
                    {goals.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-150 rounded-3xl shadow-sm">
                            No tienes metas creadas. Crea una pulsando el botón "+" de arriba.
                        </div>
                    ) : (
                        goals.map(goal => {
                            const percent = goal.targetAmount > 0 
                                ? Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100)
                                : 0;
                            const monthlyQuota = getMonthlyQuota(goal);
                            const isPaid = isGoalPaidThisMonth(goal);
                            const isDynamic = goal.calculationMethod === 'dynamic';

                            return (
                                <div
                                    key={goal.id}
                                    className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-4 relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[12px] font-black bg-indigo-500/10 text-primary px-2 py-0.5 rounded-full uppercase">
                                                    {goal.icon || '🎯'}
                                                </span>
                                                <span className={clsx(
                                                    "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                                                    isPaid 
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-450" 
                                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-450"
                                                )}>
                                                    {isPaid ? 'Completado este mes' : 'Pago pendiente'}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-2">{goal.name}</h3>
                                            {goal.deadline && (
                                                <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1 mt-0.5">
                                                    <Calendar size={10} /> Meta: {goal.deadline}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {/* Dynamic calculation toggle */}
                                            <button
                                                onClick={() => {
                                                    triggerHaptic();
                                                    const newMethod = isDynamic ? 'static' : 'dynamic';
                                                    updateGoal(goal.id, { calculationMethod: newMethod });
                                                    toast.info(`Meta configurada como ${newMethod === 'dynamic' ? 'Dinámica' : 'Estática'}`);
                                                }}
                                                className={clsx(
                                                    "p-1.5 rounded-xl transition-colors shadow-sm active:scale-90",
                                                    isDynamic 
                                                        ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" 
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-650"
                                                )}
                                                title="Alternar Cálculo Dinámico (Rayo)"
                                            >
                                                <Zap size={14} className={isDynamic ? "fill-current" : ""} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setDeleteConfirmConfig({
                                                        isOpen: true,
                                                        type: 'goal',
                                                        id: goal.id,
                                                        name: goal.name
                                                    });
                                                }}
                                                className="p-1.5 text-zinc-400 hover:text-rose-500 active:scale-90"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats (Three Columns) */}
                                    <div className="grid grid-cols-3 gap-2 text-center border-y border-zinc-100/50 dark:border-zinc-800/40 py-2.5">
                                        <div className="text-left">
                                            <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold block leading-none mb-1">Ahorrado</span>
                                            <span className="text-xs font-black text-indigo-500">
                                                <ArtNumber value={goal.currentAmount || 0} symbol={currency} maximumFractionDigits={0} />
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold block leading-none mb-1">Cuota Mes</span>
                                            <span className={clsx(
                                                "text-xs font-black",
                                                isPaid ? "text-emerald-500" : "text-zinc-600 dark:text-zinc-400"
                                            )}>
                                                <ArtNumber value={monthlyQuota} symbol={currency} maximumFractionDigits={0} />
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold block leading-none mb-1">Objetivo</span>
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                <ArtNumber value={goal.targetAmount} symbol={currency} maximumFractionDigits={0} />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress meter bar */}
                                    <div className="space-y-1">
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 rounded-full"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400">
                                            <span>Progreso</span>
                                            <span>{percent.toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => {
                                                triggerHaptic();
                                                setDepositWithdrawType('deposit');
                                                setActionSheetConfig({
                                                    isOpen: true,
                                                    type: 'goal',
                                                    targetId: goal.id,
                                                    targetName: goal.name
                                                });
                                            }}
                                            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1 active:scale-98"
                                        >
                                            <ArrowUpRight size={14} /> Abonar
                                        </button>
                                        <button
                                            onClick={() => {
                                                triggerHaptic();
                                                setDepositWithdrawType('withdraw');
                                                setActionSheetConfig({
                                                    isOpen: true,
                                                    type: 'goal',
                                                    targetId: goal.id,
                                                    targetName: goal.name
                                                });
                                            }}
                                            className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black flex items-center justify-center gap-1 active:scale-98"
                                        >
                                            <ArrowDownLeft size={14} /> Retirar
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* Funds list */
                <div className="space-y-4">
                    {funds.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-150 rounded-3xl shadow-sm">
                            No tienes fondos de reserva. Crea uno con el botón "+" de arriba.
                        </div>
                    ) : (
                        funds.map(fund => (
                            <div
                                key={fund.id}
                                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-4 relative"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200">{fund.name}</h3>
                                        {fund.description && (
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5 leading-snug">
                                                {fund.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            setDeleteConfirmConfig({
                                                isOpen: true,
                                                type: 'fund',
                                                id: fund.id,
                                                name: fund.name
                                            });
                                        }}
                                        className="p-1.5 text-zinc-400 hover:text-rose-500 active:scale-90"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div>
                                    <span className="text-[9px] text-zinc-400 font-bold block leading-none">Monto Acumulado</span>
                                    <span className="text-2xl font-black text-indigo-500">
                                        <ArtNumber value={fund.currentAmount || 0} symbol={currency} />
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            setDepositWithdrawType('deposit');
                                            setActionSheetConfig({
                                                isOpen: true,
                                                type: 'fund',
                                                targetId: fund.id,
                                                targetName: fund.name
                                            });
                                        }}
                                        className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1 active:scale-98"
                                    >
                                        <ArrowUpRight size={14} /> Depositar
                                    </button>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            setDepositWithdrawType('withdraw');
                                            setActionSheetConfig({
                                                isOpen: true,
                                                type: 'fund',
                                                targetId: fund.id,
                                                targetName: fund.name
                                            });
                                        }}
                                        className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black flex items-center justify-center gap-1 active:scale-98"
                                    >
                                        <ArrowDownLeft size={14} /> Retirar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Action Bottom Sheet (Deposit/Withdraw) */}
            <AnimatePresence>
                {actionSheetConfig?.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActionSheetConfig(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[80vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setActionSheetConfig(null)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setActionSheetConfig(null)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                                    {depositWithdrawType === 'deposit' ? 'Abonar' : 'Retirar'} - {actionSheetConfig.targetName}
                                </span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-6 flex-1">
                                {/* Segmented control inside modal */}
                                <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl">
                                    <button
                                        onClick={() => { setDepositWithdrawType('deposit'); triggerHaptic(); }}
                                        className={clsx(
                                            "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all",
                                            depositWithdrawType === 'deposit' 
                                                ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm" 
                                                : "text-zinc-500"
                                        )}
                                    >
                                        <ArrowUpRight size={14} /> Abonar
                                    </button>
                                    <button
                                        onClick={() => { setDepositWithdrawType('withdraw'); triggerHaptic(); }}
                                        className={clsx(
                                            "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all",
                                            depositWithdrawType === 'withdraw' 
                                                ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-sm" 
                                                : "text-zinc-500"
                                        )}
                                    >
                                        <ArrowDownLeft size={14} /> Retirar
                                    </button>
                                </div>

                                {/* Amount display input */}
                                <div className="flex items-center justify-center">
                                    <span className="text-4xl font-bold text-zinc-400 mr-2">{currency}</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="bg-transparent text-center text-5xl font-black text-zinc-900 dark:text-zinc-100 focus:outline-none w-56 placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                                        autoFocus
                                    />
                                </div>

                                {/* Description Note */}
                                <input
                                    type="text"
                                    placeholder="Nota opcional..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-transparent dark:border-zinc-800 focus:ring-1 focus:ring-primary focus:outline-none text-sm dark:text-zinc-200"
                                />

                                {/* Confirm Button */}
                                <button
                                    onClick={handleActionConfirm}
                                    disabled={!amount}
                                    className={clsx(
                                        "w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2",
                                        amount 
                                            ? "bg-primary text-white shadow-lg active:scale-[0.98]" 
                                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                    )}
                                >
                                    <Check size={20} strokeWidth={2.5} />
                                    {amount ? 'Confirmar' : 'Ingresa un monto'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Goal Sheet Form */}
            <AnimatePresence>
                {isCreateGoalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateGoalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsCreateGoalOpen(false)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setIsCreateGoalOpen(false)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Nueva Meta de Ahorro</span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-4 overflow-y-auto no-scrollbar pb-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Nombre de la Meta</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Viaje a Japón, Auto Nuevo..."
                                        value={newGoalName}
                                        onChange={e => setNewGoalName(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Monto Objetivo ({currency})</label>
                                    <input
                                        type="number"
                                        placeholder="1000"
                                        value={newGoalTarget}
                                        onChange={e => setNewGoalTarget(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Fecha Límite</label>
                                    <input
                                        type="date"
                                        value={newGoalDeadline}
                                        onChange={e => setNewGoalDeadline(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Categoría</label>
                                    <select
                                        value={newGoalCategory}
                                        onChange={e => setNewGoalCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    >
                                        <option value="General">General 🎯</option>
                                        <option value="Viajes">Viajes ✈️</option>
                                        <option value="Hogar">Hogar 🏠</option>
                                        <option value="Educación">Educación 🎓</option>
                                        <option value="Tecnología">Tecnología 💻</option>
                                        <option value="Emergencias">Emergencias 🚨</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleCreateGoal}
                                    disabled={!newGoalName.trim() || !newGoalTarget}
                                    className={clsx(
                                        "w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4",
                                        newGoalName.trim() && newGoalTarget
                                            ? "bg-primary text-white shadow-md active:scale-98"
                                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                                    )}
                                >
                                    <Check size={18} strokeWidth={2.5} /> Crear Meta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Fund Sheet Form */}
            <AnimatePresence>
                {isCreateFundOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateFundOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[70vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsCreateFundOpen(false)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setIsCreateFundOpen(false)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Nuevo Fondo de Reserva</span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Nombre del Fondo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Fondo de Emergencias, Salud..."
                                        value={newFundName}
                                        onChange={e => setNewFundName(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Descripción</label>
                                    <textarea
                                        placeholder="Describe el propósito de este fondo..."
                                        value={newFundDesc}
                                        onChange={e => setNewFundDesc(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200 h-24 resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateFund}
                                    disabled={!newFundName.trim()}
                                    className={clsx(
                                        "w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4",
                                        newFundName.trim()
                                            ? "bg-primary text-white shadow-md active:scale-98"
                                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                                    )}
                                >
                                    <Check size={18} strokeWidth={2.5} /> Crear Fondo
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Sheet */}
            <AnimatePresence>
                {deleteConfirmConfig?.isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmConfig(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-955 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-10 pt-4 px-6 z-10 max-h-[50vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-6" onClick={() => setDeleteConfirmConfig(null)} />
                            
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center mx-auto">
                                    <Trash2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">¿Confirmar Eliminación?</h3>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-1.5 px-4 leading-relaxed">
                                        ¿Estás seguro de que deseas eliminar "{deleteConfirmConfig.name}"?
                                        <br />Esta acción eliminará de forma permanente todos sus datos y transacciones asociadas.
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setDeleteConfirmConfig(null)}
                                        className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 rounded-2xl text-xs font-black active:scale-95 transition-transform"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            triggerHaptic();
                                            if (deleteConfirmConfig.type === 'goal') {
                                                deleteGoal(deleteConfirmConfig.id);
                                            } else {
                                                deleteFund(deleteConfirmConfig.id);
                                            }
                                            setDeleteConfirmConfig(null);
                                        }}
                                        className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileSavings;
