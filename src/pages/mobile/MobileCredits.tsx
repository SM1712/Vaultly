import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Landmark, CreditCard, Plus, Check, ChevronDown, 
    ArrowUpRight, Trash2, Calendar, Users, Briefcase,
    Clock, CheckSquare, Square, Percent, PlusCircle
} from 'lucide-react';
import { useCredits } from '../../hooks/useCredits';
import { useProjects } from '../../hooks/useProjects';
import { useBalance } from '../../hooks/useBalance';
import { useSettings } from '../../context/SettingsContext';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { ArtNumber } from '../../components/ui/ArtNumber';

// Local helper to calculate days until the next credit payment
const getDaysToNextPayment = (startDateStr: string) => {
    try {
        const parts = startDateStr.split('-');
        if (parts.length !== 3) return 30;
        const payDay = parseInt(parts[2], 10);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let nextPayDate = new Date(today.getFullYear(), today.getMonth(), payDay);
        if (nextPayDate < today) {
            nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
        }
        
        const diffTime = nextPayDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch (e) {
        return 30;
    }
};

const MobileCredits = () => {
    const { credits, addCredit, deleteCredit, addPayment, addAdjustment, getCreditStatus } = useCredits();
    const { projects, addProject, deleteProject, getProjectStats, toggleProjectTask, addProjectTask } = useProjects();
    const { availableBalance } = useBalance();
    const { currency } = useSettings();

    // Active Section: credits | projects
    const [activeTab, setActiveTab] = useState<'credits' | 'projects'>('credits');

    // Delete Confirmation State
    const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<{
        isOpen: boolean;
        id: string;
        name: string;
        type: 'credit' | 'project';
    } | null>(null);

    // Bottom Sheets states
    const [paySheetConfig, setPaySheetConfig] = useState<{
        isOpen: boolean;
        creditId: string;
        creditName: string;
        quotaAmount: number;
    } | null>(null);

    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const [adjustmentSheetConfig, setAdjustmentSheetConfig] = useState<{
        isOpen: boolean;
        creditId: string;
        creditName: string;
    } | null>(null);

    const [adjAmount, setAdjAmount] = useState('');
    const [adjNote, setAdjNote] = useState('');
    const [adjType, setAdjType] = useState<'interest' | 'charge'>('interest');

    // Creation Forms states
    const [isCreateCreditOpen, setIsCreateCreditOpen] = useState(false);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

    // Credit Form State
    const [credName, setCredName] = useState('');
    const [credPrincipal, setCredPrincipal] = useState('');
    const [credTerm, setCredTerm] = useState('');
    const [credRate, setCredRate] = useState('');
    const [credBank, setCredBank] = useState('');
    const [credType, setCredType] = useState<'amortized' | 'dynamic'>('amortized');
    const [credInstallmentsPaid, setCredInstallmentsPaid] = useState('');

    // Project Form State
    const [projName, setProjName] = useState('');
    const [projDesc, setProjDesc] = useState('');
    const [projBudget, setProjBudget] = useState('');

    // Expanded states for details
    const [expandedCreditId, setExpandedCreditId] = useState<string | null>(null);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [newTaskText, setNewTaskText] = useState('');

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    const handlePayConfirm = () => {
        if (!paySheetConfig) return;
        const val = Number(amount || paySheetConfig.quotaAmount);
        if (!val || val <= 0) return;

        if (val > availableBalance) {
            toast.error('Fondos Insuficientes en Wallet');
            return;
        }

        addPayment(paySheetConfig.creditId, val, note || 'Pago de cuota móvil');
        triggerHaptic();
        toast.success(`Pago de ${currency}${val} registrado`);
        setPaySheetConfig(null);
        setAmount('');
        setNote('');
    };

    const handleCreateCredit = () => {
        const principal = Number(credPrincipal);
        const term = credType === 'dynamic' ? (Number(credTerm) || 12) : Number(credTerm);
        const rate = Number(credRate);

        if (!credName.trim() || !principal || !term) return;

        const creditFullName = credBank ? `${credBank} - ${credName}` : credName;

        addCredit({
            name: creditFullName,
            principal,
            term,
            interestRate: rate || 0,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
            type: credType
        }, credType === 'amortized' ? Number(credInstallmentsPaid || 0) : 0);

        triggerHaptic();
        toast.success(`Crédito "${credName}" creado`);
        setIsCreateCreditOpen(false);
        setCredName('');
        setCredPrincipal('');
        setCredTerm('');
        setCredRate('');
        setCredBank('');
        setCredType('amortized');
        setCredInstallmentsPaid('');
    };

    const handleAdjustmentConfirm = () => {
        if (!adjustmentSheetConfig) return;
        const val = Number(adjAmount);
        if (!val || val <= 0) return;

        addAdjustment(adjustmentSheetConfig.creditId, val, adjType, adjNote || (adjType === 'interest' ? 'Interés' : 'Cargo manual'));
        triggerHaptic();
        toast.success(`Ajuste registrado para "${adjustmentSheetConfig.creditName}"`);
        setAdjustmentSheetConfig(null);
        setAdjAmount('');
        setAdjNote('');
        setAdjType('interest');
    };

    const handleCreateProject = async () => {
        if (!projName.trim()) return;
        const budget = Number(projBudget) || 0;

        const success = await addProject({
            name: projName,
            description: projDesc || 'Proyecto colaborativo de finanzas.',
            targetBudget: budget
        });

        if (success) {
            triggerHaptic();
            toast.success(`Proyecto "${projName}" creado`);
            setIsCreateProjectOpen(false);
            setProjName('');
            setProjDesc('');
            setProjBudget('');
        }
    };

    const handleAddTask = (projId: string) => {
        if (!newTaskText.trim()) return;
        addProjectTask(projId, newTaskText);
        setNewTaskText('');
        triggerHaptic();
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Finanzas y Estructuras</span>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-55">Pasivos y Proyectos 💳</h1>
                </div>
                <button
                    onClick={() => {
                        triggerHaptic();
                        if (activeTab === 'credits') setIsCreateCreditOpen(true);
                        else setIsCreateProjectOpen(true);
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
                    onClick={() => { setActiveTab('credits'); triggerHaptic(); }}
                    className={clsx(
                        "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all",
                        activeTab === 'credits'
                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                            : "text-zinc-500 dark:text-zinc-400"
                    )}
                >
                    <CreditCard size={14} /> Créditos / Deudas
                </button>
                <button
                    onClick={() => { setActiveTab('projects'); triggerHaptic(); }}
                    className={clsx(
                        "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all",
                        activeTab === 'projects'
                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                            : "text-zinc-500 dark:text-zinc-400"
                    )}
                >
                    <Briefcase size={14} /> Proyectos
                </button>
            </div>

            {/* Tab view logic */}
            {activeTab === 'credits' ? (
                /* Credits view */
                <div className="space-y-4">
                    {credits.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-150 rounded-3xl shadow-sm">
                            No tienes créditos cargados. Agrega uno con el botón "+" de arriba.
                        </div>
                    ) : (
                        credits.map(c => {
                            const status = getCreditStatus(c, new Date());
                            const percent = status.totalToPay > 0 
                                ? Math.min(100, (status.totalPaid / status.totalToPay) * 100) 
                                : 0;
                            const isExpanded = expandedCreditId === c.id;
                            const daysToPayment = getDaysToNextPayment(c.startDate);

                            return (
                                <div
                                    key={c.id}
                                    className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div onClick={() => setExpandedCreditId(isExpanded ? null : c.id)} className="cursor-pointer flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={clsx(
                                                    "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                                                    c.type === 'dynamic' 
                                                        ? "bg-rose-500/10 text-rose-500" 
                                                        : "bg-indigo-500/10 text-primary"
                                                )}>
                                                    {c.type === 'dynamic' ? 'Tarjeta / Rotativa' : 'Amortizable'}
                                                </span>
                                                {c.status === 'active' && daysToPayment <= 3 && (
                                                    <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full uppercase animate-pulse">
                                                        Vence Pronto
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1">
                                                {c.name}
                                                <ChevronDown size={14} className={clsx("transition-transform duration-200", isExpanded && "rotate-180")} />
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => {
                                                triggerHaptic();
                                                setDeleteConfirmConfig({
                                                    isOpen: true,
                                                    id: c.id,
                                                    name: c.name,
                                                    type: 'credit'
                                                });
                                            }}
                                            className="p-1.5 text-zinc-400 hover:text-rose-500 active:scale-90"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Stats progress bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                            <span>Saldado: <ArtNumber value={status.totalPaid} symbol={currency} maximumFractionDigits={0} /></span>
                                            <span>Restante: <ArtNumber value={status.remainingBalance} symbol={currency} maximumFractionDigits={0} /></span>
                                        </div>
                                        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-rose-500 to-indigo-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                                            <span>Deuda Repagada</span>
                                            <span>{percent.toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    {/* Days remaining badge row */}
                                    {c.status === 'active' && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                            <Clock size={12} className="text-primary" />
                                            <span>
                                                Próxima cuota vence en <strong className="text-primary">{daysToPayment}</strong> días
                                            </span>
                                        </div>
                                    )}

                                    {/* Quota Payment actions */}
                                    {c.status === 'active' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    triggerHaptic();
                                                    setPaySheetConfig({
                                                        isOpen: true,
                                                        creditId: c.id,
                                                        creditName: c.name,
                                                        quotaAmount: status.quota
                                                    });
                                                }}
                                                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1 active:scale-98"
                                            >
                                                <Check size={14} /> {c.type === 'dynamic' ? 'Abonar / Pagar' : `Pagar Cuota (${currency}${status.quota.toFixed(0)})`}
                                            </button>
                                            {c.type === 'dynamic' && (
                                                <button
                                                    onClick={() => {
                                                        triggerHaptic();
                                                        setAdjustmentSheetConfig({
                                                            isOpen: true,
                                                            creditId: c.id,
                                                            creditName: c.name
                                                        });
                                                    }}
                                                    className="px-3.5 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-black flex items-center justify-center gap-1 active:scale-98 border border-rose-500/15"
                                                >
                                                    <PlusCircle size={14} /> Ajuste
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-2.5 text-center text-xs font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl">
                                            🎉 ¡Deuda Completamente Pagada!
                                        </div>
                                    )}

                                    {/* Expanded combined movements history */}
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2.5"
                                        >
                                            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Historial de Movimientos</h4>
                                            {(() => {
                                                const movements: {
                                                    id: string;
                                                    date: string;
                                                    description: string;
                                                    amount: number;
                                                    type: string;
                                                    isPreExisting?: boolean;
                                                }[] = [
                                                    {
                                                        id: 'initial',
                                                        date: c.startDate,
                                                        description: 'Deuda / Saldo Inicial',
                                                        amount: c.principal,
                                                        type: 'initial'
                                                    },
                                                    ...(c.payments || []).map(p => ({
                                                        id: p.id,
                                                        date: p.date,
                                                        description: p.note || 'Abono / Pago de cuota',
                                                        amount: p.amount,
                                                        type: 'payment',
                                                        isPreExisting: p.isPreExisting
                                                    })),
                                                    ...(c.adjustments || []).map(a => ({
                                                        id: a.id,
                                                        date: a.date,
                                                        description: a.note || (a.type === 'interest' ? 'Cobro de Interés' : 'Cargo adicional'),
                                                        amount: a.amount,
                                                        type: a.type
                                                    }))
                                                ].sort((x, y) => y.date.localeCompare(x.date));

                                                return (
                                                    <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1.5">
                                                        {movements.map((m, idx) => {
                                                            const isPay = m.type === 'payment';
                                                            const isInit = m.type === 'initial';
                                                            return (
                                                                <div key={m.id || idx} className="flex justify-between items-center text-[10px] bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/10">
                                                                    <div className="min-w-0 pr-2">
                                                                        <span className="block font-bold text-zinc-700 dark:text-zinc-350 truncate">{m.description}</span>
                                                                        <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-medium">{m.date} {m.isPreExisting && '• Histórico'}</span>
                                                                    </div>
                                                                    <span className={clsx(
                                                                        "font-bold shrink-0",
                                                                        isPay ? "text-emerald-500" : isInit ? "text-zinc-500" : "text-rose-500"
                                                                    )}>
                                                                        {isPay ? '-' : isInit ? '' : '+'}<ArtNumber value={m.amount} symbol={currency} />
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* Projects view */
                <div className="space-y-4">
                    {projects.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-150 rounded-3xl shadow-sm">
                            No tienes proyectos creados. Agrégalo con el botón "+" de arriba.
                        </div>
                    ) : (
                        projects.map(p => {
                            const stats = getProjectStats(p);
                            const isExpanded = expandedProjectId === p.id;

                            return (
                                <div
                                    key={p.id}
                                    className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div onClick={() => setExpandedProjectId(isExpanded ? null : p.id)} className="cursor-pointer flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-black bg-indigo-500/10 text-primary px-2 py-0.5 rounded-full uppercase">
                                                    Presupuesto
                                                </span>
                                                <span className="text-[9px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                    <Users size={10} /> {p.members?.length || 1} miembros
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1">
                                                {p.name}
                                                <ChevronDown size={14} className={clsx("transition-transform duration-200", isExpanded && "rotate-180")} />
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => {
                                                triggerHaptic();
                                                setDeleteConfirmConfig({
                                                    isOpen: true,
                                                    id: p.id,
                                                    name: p.name,
                                                    type: 'project'
                                                });
                                            }}
                                            className="p-1.5 text-zinc-400 hover:text-rose-500 active:scale-90"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {p.description && (
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug">{p.description}</p>
                                    )}

                                    {/* Stats progress bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                            <span>Consumido: {currency}{stats.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            <span>Presupuesto: {currency}{p.targetBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={clsx(
                                                    "h-full rounded-full",
                                                    stats.percentConsumed > 90 ? "bg-rose-500" : stats.percentConsumed > 70 ? "bg-amber-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${Math.min(100, stats.percentConsumed)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold text-zinc-400">
                                            <span>Consumo Presupuestario</span>
                                            <span>{stats.percentConsumed.toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    {/* Expanded project tasks check */}
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-3"
                                        >
                                            <div className="space-y-1.5">
                                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                                    Tareas del Proyecto
                                                </h4>
                                                {(!p.tasks || p.tasks.length === 0) ? (
                                                    <p className="text-[10px] text-zinc-400 text-center py-1">No hay tareas creadas.</p>
                                                ) : (
                                                    <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                                                        {p.tasks.map(t => (
                                                            <div 
                                                                key={t.id}
                                                                onClick={() => { triggerHaptic(); toggleProjectTask(p.id, t.id); }}
                                                                className="flex items-center gap-2 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 py-1.5 px-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg cursor-pointer active:bg-zinc-100"
                                                            >
                                                                {t.completed ? (
                                                                    <CheckSquare size={14} className="text-primary shrink-0" />
                                                                ) : (
                                                                    <Square size={14} className="text-zinc-400 shrink-0" />
                                                                )}
                                                                <span className={clsx(t.completed && "line-through text-zinc-400")}>
                                                                    {t.description}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add task form inline */}
                                            <div className="flex gap-2 pt-1">
                                                <input
                                                    type="text"
                                                    placeholder="Agregar nueva tarea..."
                                                    value={newTaskText}
                                                    onChange={e => setNewTaskText(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg focus:outline-none text-[11px] dark:text-zinc-300"
                                                />
                                                <button
                                                    onClick={() => handleAddTask(p.id)}
                                                    className="px-3 py-1.5 bg-primary text-white font-bold rounded-lg text-[10px]"
                                                >
                                                    Agregar
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Payment sheet for Credits */}
            <AnimatePresence>
                {paySheetConfig?.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPaySheetConfig(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[80vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setPaySheetConfig(null)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setPaySheetConfig(null)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                                    Registrar Pago - {paySheetConfig.creditName}
                                </span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="flex items-center justify-center">
                                    <span className="text-4xl font-bold text-zinc-400 mr-2">{currency}</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder={paySheetConfig.quotaAmount.toString()}
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="bg-transparent text-center text-5xl font-black text-zinc-900 dark:text-zinc-100 focus:outline-none w-56 placeholder:text-zinc-300"
                                        autoFocus
                                    />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Nota o descripción (ej: Pago mes junio)..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-transparent dark:border-zinc-800 focus:ring-1 focus:ring-primary focus:outline-none text-sm dark:text-zinc-200"
                                />

                                <button
                                    onClick={handlePayConfirm}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
                                >
                                    Confirmar Pago ({currency}{Number(amount || paySheetConfig.quotaAmount).toLocaleString()})
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Credit Drawer Sheet */}
            <AnimatePresence>
                {isCreateCreditOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateCreditOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsCreateCreditOpen(false)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setIsCreateCreditOpen(false)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Nuevo Crédito o Deuda</span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-4 overflow-y-auto no-scrollbar pb-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Nombre de la Deuda</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Tarjeta de Crédito Visa, Hipoteca..."
                                        value={credName}
                                        onChange={e => setCredName(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Banco o Entidad</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Santander, Banco de Chile..."
                                        value={credBank}
                                        onChange={e => setCredBank(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Tipo de Deuda</label>
                                    <div className="grid grid-cols-2 p-1 bg-zinc-150 dark:bg-zinc-900 rounded-2xl border border-zinc-200/10">
                                        <button
                                            type="button"
                                            onClick={() => { setCredType('amortized'); triggerHaptic(); }}
                                            className={clsx(
                                                "py-2 rounded-xl text-[10px] font-black transition-all",
                                                credType === 'amortized'
                                                    ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                                                    : "text-zinc-500 dark:text-zinc-400"
                                            )}
                                        >
                                            Cuotas Fijas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setCredType('dynamic'); triggerHaptic(); }}
                                            className={clsx(
                                                "py-2 rounded-xl text-[10px] font-black transition-all",
                                                credType === 'dynamic'
                                                    ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                                                    : "text-zinc-500 dark:text-zinc-400"
                                            )}
                                        >
                                            Tarjeta / Rotativa
                                        </button>
                                    </div>
                                </div>

                                {credType === 'amortized' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Cuotas pagadas previamente (Opcional)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={credInstallmentsPaid}
                                            onChange={e => setCredInstallmentsPaid(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Capital Principal ({currency})</label>
                                    <input
                                        type="number"
                                        placeholder="5000"
                                        value={credPrincipal}
                                        onChange={e => setCredPrincipal(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Plazo (Meses)</label>
                                        <input
                                            type="number"
                                            placeholder="12"
                                            value={credTerm}
                                            onChange={e => setCredTerm(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Tasa Interés Anual (%)</label>
                                        <input
                                            type="number"
                                            placeholder="5"
                                            value={credRate}
                                            onChange={e => setCredRate(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateCredit}
                                    disabled={!credName.trim() || !credPrincipal || (credType === 'amortized' && !credTerm)}
                                    className={clsx(
                                        "w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4",
                                        credName.trim() && credPrincipal && (credType === 'dynamic' || credTerm)
                                            ? "bg-primary text-white shadow-md active:scale-98"
                                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                                    )}
                                >
                                    <Check size={18} strokeWidth={2.5} /> Registrar Crédito
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Project Drawer Sheet */}
            <AnimatePresence>
                {isCreateProjectOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateProjectOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[70vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsCreateProjectOpen(false)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setIsCreateProjectOpen(false)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Nuevo Proyecto Financiero</span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Nombre del Proyecto</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Remodelación Cocina, Regalo de Bodas..."
                                        value={projName}
                                        onChange={e => setProjName(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Descripción</label>
                                    <input
                                        type="text"
                                        placeholder="Describe brevemente este proyecto..."
                                        value={projDesc}
                                        onChange={e => setProjDesc(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Presupuesto Límite ({currency})</label>
                                    <input
                                        type="number"
                                        placeholder="1500"
                                        value={projBudget}
                                        onChange={e => setProjBudget(e.target.value)}
                                        className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl focus:outline-none text-xs dark:text-zinc-200"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateProject}
                                    disabled={!projName.trim()}
                                    className={clsx(
                                        "w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4",
                                        projName.trim()
                                            ? "bg-primary text-white shadow-md active:scale-98"
                                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed"
                                    )}
                                >
                                    <Check size={18} strokeWidth={2.5} /> Crear Proyecto
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Adjustment sheet for Credits */}
            <AnimatePresence>
                {adjustmentSheetConfig?.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAdjustmentSheetConfig(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[80vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setAdjustmentSheetConfig(null)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setAdjustmentSheetConfig(null)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                                    Cargar Ajuste - {adjustmentSheetConfig.creditName}
                                </span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-6 flex-1">
                                {/* Type Selector */}
                                <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/5">
                                    <button
                                        onClick={() => { setAdjType('interest'); triggerHaptic(); }}
                                        className={clsx(
                                            "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all",
                                            adjType === 'interest' 
                                                ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-sm" 
                                                : "text-zinc-500"
                                        )}
                                    >
                                        Cobro de Interés
                                    </button>
                                    <button
                                        onClick={() => { setAdjType('charge'); triggerHaptic(); }}
                                        className={clsx(
                                            "py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all",
                                            adjType === 'charge' 
                                                ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-sm" 
                                                : "text-zinc-500"
                                        )}
                                    >
                                        Cargo Adicional
                                    </button>
                                </div>

                                <div className="flex items-center justify-center">
                                    <span className="text-4xl font-bold text-zinc-400 mr-2">{currency}</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={adjAmount}
                                        onChange={e => setAdjAmount(e.target.value)}
                                        className="bg-transparent text-center text-5xl font-black text-zinc-900 dark:text-zinc-100 focus:outline-none w-56 placeholder:text-zinc-300"
                                        autoFocus
                                    />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Descripción del cargo/interés (opcional)..."
                                    value={adjNote}
                                    onChange={e => setAdjNote(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-zinc-100 dark:bg-zinc-905 rounded-2xl border border-transparent dark:border-zinc-800 focus:ring-1 focus:ring-primary focus:outline-none text-sm dark:text-zinc-200"
                                />

                                <button
                                    onClick={handleAdjustmentConfirm}
                                    disabled={!adjAmount}
                                    className={clsx(
                                        "w-full py-4 bg-primary text-white rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform",
                                        !adjAmount && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    Confirmar Cargo ({currency}{Number(adjAmount || 0).toLocaleString()})
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
                                        <br />Esta acción eliminará de forma permanente todos sus datos asociados.
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
                                        onClick={async () => {
                                            triggerHaptic();
                                            if (deleteConfirmConfig.type === 'credit') {
                                                deleteCredit(deleteConfirmConfig.id);
                                            } else {
                                                await deleteProject(deleteConfirmConfig.id);
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

export default MobileCredits;
