import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FolderKanban, Plus, Pencil, Trash2, Loader2, AlertTriangle, 
    Sparkles, ChevronLeft, ChevronDown, Check, X, ArrowUpRight, 
    ArrowDownLeft, Target, Calendar, Users, Mail, PlusCircle, 
    CheckCircle, ListTodo, Landmark, Search, BarChart3, Settings
} from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useCollaboration } from '../../context/CollaborationContext';
import { useBalance } from '../../hooks/useBalance';
import { useSettings } from '../../context/SettingsContext';
import { useTransactions } from '../../hooks/useTransactions';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { ArtNumber } from '../../components/ui/ArtNumber';
import type { Project, ProjectTransaction, ProjectTask, BudgetLine, Milestone, ProjectDebt, PublicProfile } from '../../types';

const MobileProjects = () => {
    const navigate = useNavigate();
    const { 
        projects, addProject, updateProject, deleteProject, getProjectStats,
        addProjectTransaction, deleteProjectTransaction,
        addProjectTask, toggleProjectTask, deleteProjectTask,
        addBudgetLine, deleteBudgetLine,
        addMilestone, toggleMilestone, deleteMilestone,
        addProjectDebt, payProjectDebt, deleteProjectDebt
    } = useProjects();

    const { 
        profile: collabProfile, invitations, respondToInvitation, 
        searchUsersByNickname, sendProjectInvitation 
    } = useCollaboration();

    const { availableBalance } = useBalance();
    const { currency } = useSettings();
    const { addTransaction: addMainTransaction } = useTransactions();

    // Haptics
    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    // Main view states
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selected project sub-view state
    const [detailTab, setDetailTab] = useState<'overview' | 'budget' | 'ledger' | 'tasks' | 'milestones' | 'debts' | 'members'>('overview');
    const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

    // Forms inside details
    const [isAddTxOpen, setIsAddTxOpen] = useState(false);
    const [txAmount, setTxAmount] = useState('');
    const [txDesc, setTxDesc] = useState('');
    const [txType, setTxType] = useState<'income' | 'expense'>('expense');
    const [fundingSource, setFundingSource] = useState<'internal' | 'external'>('internal');
    const [budgetLineId, setBudgetLineId] = useState('');

    const [isAddBudgetLineOpen, setIsAddBudgetLineOpen] = useState(false);
    const [budgetName, setBudgetName] = useState('');
    const [budgetLimit, setBudgetLimit] = useState('');

    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [taskDesc, setTaskDesc] = useState('');

    const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
    const [milestoneTitle, setMilestoneTitle] = useState('');
    const [milestoneDate, setMilestoneDate] = useState('');

    const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
    const [debtName, setDebtName] = useState('');
    const [debtCreditor, setDebtCreditor] = useState('');
    const [debtDebtor, setDebtDebtor] = useState('@todos');
    const [debtPrincipal, setDebtPrincipal] = useState('');
    const [debtTerm, setDebtTerm] = useState('12');
    const [debtRate, setDebtRate] = useState('0');

    const [isPayDebtOpen, setIsPayDebtOpen] = useState<ProjectDebt | null>(null);
    const [payDebtAmount, setPayDebtAmount] = useState('');
    const [payDebtNote, setPayDebtNote] = useState('');

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteNick, setInviteNick] = useState('');
    const [foundUsers, setFoundUsers] = useState<PublicProfile[]>([]);
    const [searchingUser, setSearchingUser] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [recentCollabs, setRecentCollabs] = useState<PublicProfile[]>([]);

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Initialize recent collaborators
    useEffect(() => {
        const stored = localStorage.getItem('vaultly_recent_collaborators');
        if (stored) {
            try { setRecentCollabs(JSON.parse(stored)); } catch (e) {}
        }
    }, []);

    // Live search users
    const searchTimeout = useRef<any>(null);
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        const queryVal = inviteNick.trim();
        if (queryVal.length < 2) {
            setFoundUsers([]);
            return;
        }

        setSearchingUser(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const results = await searchUsersByNickname(queryVal);
                // Filter out current user
                setFoundUsers(results.filter(u => u.uid !== collabProfile?.uid));
            } catch (err) {
                console.error("Live search error:", err);
            } finally {
                setSearchingUser(false);
            }
        }, 400);

        return () => clearTimeout(searchTimeout.current);
    }, [inviteNick, collabProfile]);

    // Handle Project details updates
    const activeProject = useMemo(() => {
        if (!selectedProject) return null;
        return projects.find(p => p.id === selectedProject.id) || selectedProject;
    }, [projects, selectedProject]);

    // Project Stats
    const activeStats = useMemo(() => {
        if (!activeProject) return null;
        return getProjectStats(activeProject);
    }, [activeProject, getProjectStats]);

    // Handlers
    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        triggerHaptic();

        const success = await addProject({
            name: projectName.trim(),
            description: projectDesc.trim(),
            targetBudget: 0
        });

        setIsSubmitting(false);
        if (success) {
            toast.success('Proyecto creado con éxito');
            setProjectName('');
            setProjectDesc('');
            setIsCreateOpen(false);
        }
    };

    const handleInviteUser = async (userToInvite: PublicProfile) => {
        if (!activeProject || isInviting) return;
        setIsInviting(true);
        triggerHaptic();

        try {
            await sendProjectInvitation(activeProject.id, activeProject.name, userToInvite.nickname, userToInvite.uid);
            toast.success(`Invitación enviada a @${userToInvite.nickname}`);

            // Save to local storage
            setRecentCollabs(prev => {
                const filtered = prev.filter(u => u.uid !== userToInvite.uid);
                const updated = [userToInvite, ...filtered].slice(0, 5);
                localStorage.setItem('vaultly_recent_collaborators', JSON.stringify(updated));
                return updated;
            });

            setInviteNick('');
            setFoundUsers([]);
            setIsInviteOpen(false);
        } catch (err: any) {
            toast.error("Error al enviar invitación", { description: err.message });
        } finally {
            setIsInviting(false);
        }
    };

    const handleRespondInvite = async (id: string, accept: boolean) => {
        setProcessingInviteId(id);
        triggerHaptic();
        try {
            await respondToInvitation(id, accept);
        } catch (err: any) {
            toast.error("Error al responder invitación");
        } finally {
            setProcessingInviteId(null);
        }
    };

    const handleAddTx = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject) return;

        const amountVal = Number(txAmount);
        if (amountVal <= 0) return;

        triggerHaptic();

        if (txType === 'income' && fundingSource === 'internal') {
            if (amountVal > availableBalance) {
                toast.error(`Fondos insuficientes en Wallet (${currency}${availableBalance.toLocaleString()})`);
                return;
            }

            // Deduct from main ledger
            addMainTransaction({
                amount: amountVal,
                type: 'expense',
                category: 'Inversión',
                description: `Inversión en Proyecto: ${activeProject.name}`,
                date: new Date().toISOString().split('T')[0]
            });
        }

        addProjectTransaction(activeProject.id, {
            amount: amountVal,
            description: txDesc.trim() || (txType === 'income' ? 'Inyección de capital' : 'Gasto registrado'),
            type: txType,
            fundingSource: txType === 'income' ? fundingSource : undefined,
            budgetLineId: txType === 'expense' && budgetLineId ? budgetLineId : undefined,
            date: new Date().toISOString().split('T')[0]
        });

        toast.success(txType === 'income' ? 'Capital inyectado' : 'Gasto registrado');
        setTxAmount('');
        setTxDesc('');
        setBudgetLineId('');
        setIsAddTxOpen(false);
    };

    const handleAddBudgetLine = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject) return;

        const limitVal = Number(budgetLimit);
        if (!budgetName.trim() || limitVal <= 0) return;

        triggerHaptic();
        addBudgetLine(activeProject.id, {
            name: budgetName.trim(),
            allocatedAmount: limitVal,
            spentAmount: 0
        });

        toast.success(`Partida "${budgetName}" agregada`);
        setBudgetName('');
        setBudgetLimit('');
        setIsAddBudgetLineOpen(false);
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject || !taskDesc.trim()) return;

        triggerHaptic();
        addProjectTask(activeProject.id, taskDesc.trim());
        setTaskDesc('');
        setIsAddTaskOpen(false);
    };

    const handleAddMilestone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject || !milestoneTitle.trim()) return;

        triggerHaptic();
        addMilestone(activeProject.id, {
            title: milestoneTitle.trim(),
            targetDate: milestoneDate || new Date().toISOString().split('T')[0]
        });

        toast.success('Hito agregado');
        setMilestoneTitle('');
        setMilestoneDate('');
        setIsAddMilestoneOpen(false);
    };

    const handleAddDebt = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject) return;

        const principalVal = Number(debtPrincipal);
        if (!debtName.trim() || principalVal <= 0) return;

        triggerHaptic();
        addProjectDebt(activeProject.id, {
            name: debtName.trim(),
            creditor: debtCreditor.trim() || `@${collabProfile?.nickname}` || 'Proyecto',
            debtor: debtDebtor.trim() || '@todos',
            principal: principalVal,
            term: Number(debtTerm) || 12,
            interestRate: Number(debtRate) || 0
        });

        toast.success('Préstamo registrado');
        setDebtName('');
        setDebtPrincipal('');
        setDebtCreditor('');
        setDebtDebtor('@todos');
        setIsAddDebtOpen(false);
    };

    const handlePayDebt = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProject || !isPayDebtOpen) return;

        const amountVal = Number(payDebtAmount);
        if (amountVal <= 0) return;

        triggerHaptic();
        payProjectDebt(
            activeProject.id, 
            isPayDebtOpen.id, 
            amountVal, 
            collabProfile?.nickname ? `@${collabProfile.nickname}` : 'Colaborador', 
            payDebtNote.trim() || 'Abono Colaborativo'
        );

        toast.success('Pago registrado con éxito');
        setPayDebtAmount('');
        setPayDebtNote('');
        setIsPayDebtOpen(null);
    };

    const handleDeleteProject = async () => {
        if (!activeProject || isDeleting) return;
        setIsDeleting(true);
        triggerHaptic();

        try {
            await deleteProject(activeProject.id);
            setIsDeleteConfirmOpen(false);
            setSelectedProject(null);
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    const cycleStatus = () => {
        if (!activeProject) return;
        triggerHaptic();

        const nextStatus: Record<Project['status'], Project['status']> = {
            'planning': 'active',
            'active': 'completed',
            'completed': 'planning',
            'paused': 'active',
            'cancelled': 'planning'
        };

        updateProject(activeProject.id, { status: nextStatus[activeProject.status] });
        toast.success('Estado actualizado');
    };

    const getStatusText = (status: Project['status']) => {
        switch (status) {
            case 'planning': return 'Planificación';
            case 'active': return 'En Curso';
            case 'completed': return 'Completado';
            case 'paused': return 'Pausado';
            case 'cancelled': return 'Cancelado';
        }
    };

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'planning': return 'text-zinc-500 bg-zinc-150 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-900/60 dark:border-zinc-850';
            case 'active': return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
            case 'completed': return 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20';
            case 'paused': return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
            case 'cancelled': return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <AnimatePresence mode="wait">
                {!activeProject ? (
                    // ---------------- MAIN DASHBOARD LIST ----------------
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => { triggerHaptic(); navigate('/m/settings'); }}
                                    className="p-2 -ml-2 text-zinc-650 dark:text-zinc-400 active:scale-90 transition-transform"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div>
                                    <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest block">Ledgers Compartidos</span>
                                    <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Proyectos 🤝</h1>
                                </div>
                            </div>

                            {collabProfile && (
                                <button
                                    onClick={() => { triggerHaptic(); setIsCreateOpen(true); }}
                                    className="w-10 h-10 rounded-2xl bg-indigo-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 transition-transform"
                                >
                                    <Plus size={20} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>

                        {/* Nickname Missing Alert */}
                        {!collabProfile && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 space-y-3">
                                <div className="flex gap-3 text-amber-600 dark:text-amber-500">
                                    <AlertTriangle className="shrink-0" size={20} />
                                    <div className="space-y-1">
                                        <h4 className="font-black text-sm">Identidad requerida</h4>
                                        <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-bold">
                                            Para participar en proyectos colaborativos, primero debes registrar tu apodo desde la sección de ajustes.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { triggerHaptic(); navigate('/m/settings'); }}
                                    className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors"
                                >
                                    Ir a Ajustes para Crear Apodo
                                </button>
                            </div>
                        )}

                        {/* Invitations Widget */}
                        {collabProfile && invitations.length > 0 && (
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block px-1">
                                    Invitaciones Pendientes ({invitations.length})
                                </span>
                                <div className="space-y-3">
                                    {invitations.map(invite => (
                                        <div 
                                            key={invite.id} 
                                            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3.5"
                                        >
                                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-sm uppercase shrink-0">
                                                    {invite.fromNickname ? invite.fromNickname.substring(0, 2).toUpperCase() : '??'}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full mb-1">
                                                        <Sparkles size={8} /> Invitación Recibida
                                                    </span>
                                                    <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100 truncate leading-snug">
                                                        {invite.projectName}
                                                    </h4>
                                                    <p className="text-[10px] text-zinc-550 dark:text-zinc-500 font-bold">
                                                        De @{invite.fromNickname}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleRespondInvite(invite.id, true)}
                                                    disabled={processingInviteId === invite.id}
                                                    className="flex-1 bg-emerald-600 active:scale-[0.98] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                                                >
                                                    {processingInviteId === invite.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                                                    <span>Aceptar</span>
                                                </button>
                                                <button
                                                    onClick={() => handleRespondInvite(invite.id, false)}
                                                    disabled={processingInviteId === invite.id}
                                                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-zinc-200 dark:border-zinc-700/50 transition-all disabled:opacity-50"
                                                >
                                                    {processingInviteId === invite.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={2.5} />}
                                                    <span>Rechazar</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects List */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block px-1">
                                Tus Proyectos ({projects.length})
                            </span>

                            {projects.length === 0 ? (
                                <div className="py-16 text-center border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl bg-white/50 dark:bg-zinc-900/10 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-400 dark:text-zinc-500 rounded-2xl mb-4">
                                        <FolderKanban size={36} strokeWidth={1.5} />
                                    </div>
                                    <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-200 mb-1">Sin proyectos activos</h4>
                                    <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 text-center max-w-[200px]">
                                        {collabProfile 
                                            ? "Comienza creando un nuevo proyecto colaborativo pulsando el botón '+' arriba."
                                            : "Registra tu apodo para poder unirte o crear carteras compartidas."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {projects.map(proj => {
                                        const stats = getProjectStats(proj);
                                        const progress = stats.totalExpenses > 0 ? stats.percentConsumed : stats.percentFunded;
                                        
                                        return (
                                            <div
                                                key={proj.id}
                                                onClick={() => { triggerHaptic(); setSelectedProject(proj); setDetailTab('overview'); }}
                                                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm active:scale-[0.99] transition-transform flex flex-col gap-4 relative overflow-hidden"
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                                                            {proj.name}
                                                        </h3>
                                                        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold mt-1 line-clamp-1">
                                                            {proj.description || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <span className={clsx("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border", getStatusColor(proj.status))}>
                                                        {getStatusText(proj.status)}
                                                    </span>
                                                </div>

                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-3.5">
                                                    <div>
                                                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wide block">Disponible en Caja</span>
                                                        <span className={clsx("text-base font-black font-mono block mt-0.5", stats.currentBalance >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                                                            <ArtNumber value={stats.currentBalance} />
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wide block">Gastos Registrados</span>
                                                        <span className="text-base font-bold font-mono text-zinc-650 dark:text-zinc-400 block mt-0.5">
                                                            <ArtNumber value={stats.totalExpenses} />
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress & Members */}
                                                <div className="flex items-center justify-between gap-6">
                                                    {/* Budget Line */}
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between text-[8px] font-black uppercase text-zinc-400 tracking-wider">
                                                            <span>{stats.totalExpenses > 0 ? 'Ejecutado' : 'Financiado'}</span>
                                                            <span className="font-mono">{progress.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/20 dark:border-zinc-850">
                                                            <div 
                                                                className={clsx("h-full rounded-full transition-all duration-300", progress > 100 ? "bg-rose-500" : "bg-indigo-600")}
                                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Members Avatars Grid */}
                                                    <div className="flex items-center -space-x-2 shrink-0">
                                                        {(proj.members || []).slice(0, 3).map((m, idx) => (
                                                            <div 
                                                                key={m.uid} 
                                                                className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-[8px] uppercase tracking-tighter"
                                                                style={{ zIndex: 3 - idx }}
                                                                title={`@${m.nickname}`}
                                                            >
                                                                {m.nickname.substring(0, 2)}
                                                            </div>
                                                        ))}
                                                        {(proj.members || []).length > 3 && (
                                                            <div 
                                                                className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 flex items-center justify-center font-black text-[8px] z-0"
                                                            >
                                                                +{(proj.members || []).length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    // ---------------- FULL-SCREEN PROJECT DETAILS VIEW ----------------
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Header Details */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                                <button 
                                    onClick={() => { triggerHaptic(); setSelectedProject(null); }}
                                    className="p-2 -ml-2 text-zinc-650 dark:text-zinc-400 active:scale-90 transition-transform shrink-0"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="min-w-0">
                                    <span 
                                        onClick={cycleStatus}
                                        className={clsx("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border mb-1 inline-block cursor-pointer select-none", getStatusColor(activeProject.status))}
                                    >
                                        {getStatusText(activeProject.status)} ⚙️
                                    </span>
                                    <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-50 truncate leading-snug">
                                        {activeProject.name}
                                    </h1>
                                </div>
                            </div>

                            <button
                                onClick={() => { triggerHaptic(); setIsDeleteConfirmOpen(true); }}
                                className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 active:scale-95 flex items-center justify-center border border-rose-500/20 shrink-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Top Summary Info Card */}
                        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg border border-indigo-800/40 relative overflow-hidden">
                            <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[80%] rounded-full bg-indigo-500/20 blur-[50px] pointer-events-none" />
                            <span className="text-[8px] font-black uppercase tracking-wider text-indigo-300 block">Caja del Proyecto</span>
                            
                            <h2 className="text-3xl font-black font-mono mt-1 tracking-tight">
                                <ArtNumber value={activeStats?.currentBalance || 0} />
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mt-5 pt-3.5 border-t border-indigo-850">
                                <div>
                                    <span className="text-[8px] font-black text-indigo-300 uppercase block">Total Ingresos</span>
                                    <span className="text-sm font-bold font-mono block mt-0.5">
                                        <ArtNumber value={activeStats?.totalIncome || 0} />
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[8px] font-black text-indigo-300 uppercase block">Total Gastos</span>
                                    <span className="text-sm font-bold font-mono block mt-0.5">
                                        <ArtNumber value={activeStats?.totalExpenses || 0} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Sub-tabs Bar */}
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
                            {[
                                { id: 'overview', label: 'Resumen', icon: BarChart3 },
                                { id: 'budget', label: 'Partidas', icon: Target },
                                { id: 'ledger', label: 'Libro Contable', icon: Landmark },
                                { id: 'tasks', label: 'Tareas', icon: ListTodo },
                                { id: 'milestones', label: 'Hitos', icon: Calendar },
                                { id: 'debts', label: 'Préstamos', icon: Mail },
                                { id: 'members', label: 'Miembros', icon: Users }
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isSelected = detailTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => { triggerHaptic(); setDetailTab(tab.id as any); }}
                                        className={clsx(
                                            "flex-shrink-0 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all active:scale-[0.97]",
                                            isSelected 
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400"
                                        )}
                                    >
                                        <Icon size={12} strokeWidth={2.5} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* TAB CONTENTS */}
                        <div className="space-y-4">
                            
                            {/* OVERVIEW TAB */}
                            {detailTab === 'overview' && (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-5 space-y-3 shadow-sm">
                                        <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Descripción del Proyecto</h4>
                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-bold">
                                            {activeProject.description || 'Sin notas descriptivas redactadas.'}
                                        </p>
                                    </div>

                                    {/* Action Shortcuts */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { triggerHaptic(); setIsAddTxOpen(true); }}
                                            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-850 rounded-3xl text-left active:scale-[0.98] transition-transform space-y-1.5 shadow-sm"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                                                <PlusCircle size={18} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Movimiento</span>
                                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block">Registrar Transacción</span>
                                        </button>
                                        <button
                                            onClick={() => { triggerHaptic(); setIsInviteOpen(true); }}
                                            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-850 rounded-3xl text-left active:scale-[0.98] transition-transform space-y-1.5 shadow-sm"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                                                <Users size={18} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Colaborador</span>
                                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block">Invitar Miembro</span>
                                        </button>
                                    </div>

                                    {/* Progress Card */}
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-5 space-y-4 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Ejecución del Presupuesto</h4>
                                            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                                                {activeStats ? (activeStats.totalExpenses > 0 ? activeStats.percentConsumed : activeStats.percentFunded).toFixed(0) : 0}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/30 dark:border-zinc-850">
                                            <div 
                                                className="h-full bg-indigo-600 rounded-full"
                                                style={{ width: `${Math.min(activeStats ? (activeStats.totalExpenses > 0 ? activeStats.percentConsumed : activeStats.percentFunded) : 0, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-zinc-550 dark:text-zinc-500 font-bold leading-relaxed">
                                            {activeStats && activeStats.totalExpenses > 0 
                                                ? `Se han gastado ${currency}${activeStats.totalExpenses.toLocaleString()} de un total financiado de ${currency}${activeStats.totalIncome.toLocaleString()}.`
                                                : `Este proyecto cuenta actualmente con un financiamiento inicial de ${currency}${activeStats?.totalIncome.toLocaleString()} registrado en caja.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* BUDGET LINES TAB */}
                            {detailTab === 'budget' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                                            Partidas Presupuestarias ({activeProject.budgetLines?.length || 0})
                                        </span>
                                        <button
                                            onClick={() => { triggerHaptic(); setIsAddBudgetLineOpen(true); }}
                                            className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 active:scale-95"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                            <span>Añadir Partida</span>
                                        </button>
                                    </div>

                                    {(activeProject.budgetLines || []).length === 0 ? (
                                        <div className="py-12 text-center border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl bg-white/50 dark:bg-zinc-900/10 flex flex-col items-center">
                                            <Target className="text-zinc-400 mb-2" size={24} />
                                            <h5 className="text-xs font-black text-zinc-850 dark:text-zinc-250">Sin límites definidos</h5>
                                            <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 mt-1 max-w-[180px]">
                                                Crea partidas presupuestarias independientes para controlar los límites por categoría (ej. Materiales, Mano de Obra).
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {(activeProject.budgetLines || []).map(line => {
                                                // Calculate consumed amount
                                                const consumed = (activeProject.transactions || [])
                                                    .filter(t => t.type === 'expense' && t.budgetLineId === line.id)
                                                    .reduce((acc, curr) => acc + curr.amount, 0);
                                                const percent = line.allocatedAmount > 0 ? (consumed / line.allocatedAmount) * 100 : 0;
                                                
                                                return (
                                                    <div 
                                                        key={line.id}
                                                        className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-4.5 shadow-sm space-y-3"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-555">
                                                                    {line.name}
                                                                </h4>
                                                                <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500">
                                                                    Límite: <strong className="font-mono text-zinc-700 dark:text-zinc-350">{currency}{line.allocatedAmount.toLocaleString()}</strong>
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-3">
                                                                <span className={clsx("text-[9px] font-black font-mono px-2 py-0.5 rounded-lg border", percent > 100 ? "text-rose-600 bg-rose-500/10 border-rose-500/20" : "text-zinc-500 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850")}>
                                                                    {percent.toFixed(0)}%
                                                                </span>
                                                                <button
                                                                    onClick={() => { triggerHaptic(); deleteBudgetLine(activeProject.id, line.id); }}
                                                                    className="p-1.5 text-zinc-450 hover:text-rose-500 active:scale-90"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/20 dark:border-zinc-850">
                                                            <div 
                                                                className={clsx("h-full rounded-full", percent > 100 ? "bg-rose-500" : "bg-emerald-500")}
                                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex justify-between text-[8px] font-black uppercase text-zinc-400 tracking-wider">
                                                            <span>Gastado: <strong className="font-mono">{currency}{consumed.toLocaleString()}</strong></span>
                                                            <span>Restante: <strong className="font-mono">{currency}{Math.max(0, line.allocatedAmount - consumed).toLocaleString()}</strong></span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* LEDGER TAB */}
                            {detailTab === 'ledger' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                                            Historial Contable ({activeProject.transactions?.length || 0})
                                        </span>
                                        <button
                                            onClick={() => { triggerHaptic(); setIsAddTxOpen(true); }}
                                            className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 active:scale-95"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                            <span>Registrar Movimiento</span>
                                        </button>
                                    </div>

                                    {(activeProject.transactions || []).length === 0 ? (
                                        <div className="py-12 text-center border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl bg-white/50 dark:bg-zinc-900/10 flex flex-col items-center">
                                            <Landmark className="text-zinc-400 mb-2" size={24} />
                                            <h5 className="text-xs font-black text-zinc-850 dark:text-zinc-250">Sin movimientos</h5>
                                            <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 mt-1 max-w-[180px]">
                                                Inyecta fondos o registra egresos para llevar el libro diario colaborativo en orden.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {(activeProject.transactions || []).map(tx => (
                                                <div 
                                                    key={tx.id}
                                                    className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-3.5 shadow-sm flex items-center justify-between gap-3"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={clsx(
                                                            "w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border",
                                                            tx.type === 'income' 
                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                                                                : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                                        )}>
                                                            {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-50 truncate leading-snug">
                                                                {tx.description}
                                                            </h5>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[8px] font-black font-mono text-zinc-400">
                                                                    {tx.date}
                                                                </span>
                                                                {tx.fundingSource && (
                                                                    <span className="text-[7px] font-black uppercase tracking-wider text-indigo-650 bg-indigo-500/10 px-1 py-0.2 rounded">
                                                                        {tx.fundingSource === 'internal' ? 'Interno' : 'Externo'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        <span className={clsx("font-mono font-black text-xs", tx.type === 'income' ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                                                            {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                                                        </span>
                                                        <button
                                                            onClick={() => { triggerHaptic(); deleteProjectTransaction(activeProject.id, tx.id); }}
                                                            className="p-1.5 text-zinc-450 hover:text-rose-500 active:scale-90"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TASKS TAB */}
                            {detailTab === 'tasks' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                                            Lista de Tareas ({activeProject.tasks?.length || 0})
                                        </span>
                                        <button
                                            onClick={() => { triggerHaptic(); setIsAddTaskOpen(true); }}
                                            className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 active:scale-95"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                            <span>Nueva Tarea</span>
                                        </button>
                                    </div>

                                    {(activeProject.tasks || []).length === 0 ? (
                                        <div className="py-12 text-center border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl bg-white/50 dark:bg-zinc-900/10 flex flex-col items-center">
                                            <ListTodo className="text-zinc-400 mb-2" size={24} />
                                            <h5 className="text-xs font-black text-zinc-850 dark:text-zinc-250">Lista limpia</h5>
                                            <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 mt-1 max-w-[180px]">
                                                Crea recordatorios o subtareas colaborativas y márcalas al resolverlas.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {(activeProject.tasks || []).map(task => (
                                                <div 
                                                    key={task.id}
                                                    className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-3.5 shadow-sm flex items-center justify-between gap-3"
                                                >
                                                    <div 
                                                        onClick={() => { triggerHaptic(); toggleProjectTask(activeProject.id, task.id); }}
                                                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                                                    >
                                                        <div className={clsx(
                                                            "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
                                                            task.completed 
                                                                ? "bg-indigo-650 border-indigo-650 text-white" 
                                                                : "border-zinc-350 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950"
                                                        )}>
                                                            {task.completed && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                        <span className={clsx("text-xs font-bold truncate leading-snug", task.completed ? "line-through text-zinc-400 dark:text-zinc-550" : "text-zinc-800 dark:text-zinc-200")}>
                                                            {task.description}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => { triggerHaptic(); deleteProjectTask(activeProject.id, task.id); }}
                                                        className="p-1.5 text-zinc-450 hover:text-rose-500 active:scale-90"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MILESTONES TAB */}
                            {detailTab === 'milestones' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                                            Hitos del Ledger ({activeProject.milestones?.length || 0})
                                        </span>
                                        <button
                                            onClick={() => { triggerHaptic(); setIsAddMilestoneOpen(true); }}
                                            className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 active:scale-95"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                            <span>Agregar Hito</span>
                                        </button>
                                    </div>

                                    {(activeProject.milestones || []).length === 0 ? (
                                        <div className="py-12 text-center border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl bg-white/50 dark:bg-zinc-900/10 flex flex-col items-center">
                                            <Calendar className="text-zinc-400 mb-2" size={24} />
                                            <h5 className="text-xs font-black text-zinc-850 dark:text-zinc-250">Sin hitos creados</h5>
                                            <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 mt-1 max-w-[180px]">
                                                Define fechas límite o metas operativas importantes para mantener al equipo enfocado.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {(activeProject.milestones || []).map(ms => (
                                                <div 
                                                    key={ms.id}
                                                    className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-3.5 shadow-sm flex items-center justify-between gap-3"
                                                >
                                                    <div 
                                                        onClick={() => { triggerHaptic(); toggleMilestone(activeProject.id, ms.id); }}
                                                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                                                    >
                                                        <div className={clsx(
                                                            "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
                                                            ms.status === 'completed' 
                                                                ? "bg-emerald-650 border-emerald-650 text-white" 
                                                                : "border-zinc-350 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950"
                                                        )}>
                                                            {ms.status === 'completed' && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className={clsx("text-xs font-black truncate leading-snug", ms.status === 'completed' ? "line-through text-zinc-400 dark:text-zinc-550" : "text-zinc-850 dark:text-zinc-100")}>
                                                                {ms.title}
                                                            </h5>
                                                            <span className="text-[8px] font-bold font-mono text-zinc-400 block mt-0.5">
                                                                Fecha: {ms.targetDate}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => { triggerHaptic(); deleteMilestone(activeProject.id, ms.id); }}
                                                        className="p-1.5 text-zinc-450 hover:text-rose-500 active:scale-90"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DEBTS TAB */}
                            {detailTab === 'debts' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                                            Deudas Colaborativas ({activeProject.debts?.length || 0})
                                        </span>
                                        <button
                                            onClick={() => { triggerHaptic(); setIsAddDebtOpen(true); }}
                                            className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 active:scale-95"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                            <span>Registrar Préstamo</span>
                                        </button>
                                    </div>

                                    {(activeProject.debts || []).length === 0 ? (
                                        <div className="py-12 text-center border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl bg-white/50 dark:bg-zinc-900/10 flex flex-col items-center">
                                            <Mail className="text-zinc-400 mb-2" size={24} />
                                            <h5 className="text-xs font-black text-zinc-850 dark:text-zinc-250">Sin deudas compartidas</h5>
                                            <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 mt-1 max-w-[180px]">
                                                Registra saldos que los colaboradores o socios le presten al proyecto, o pagos mutuos.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {(activeProject.debts || []).map(debt => {
                                                const paid = (debt.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
                                                const balance = Math.max(0, debt.principal - paid);
                                                const progress = debt.principal > 0 ? (paid / debt.principal) * 100 : 0;
                                                
                                                return (
                                                    <div 
                                                        key={debt.id}
                                                        className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-4.5 shadow-sm space-y-3"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-50">
                                                                    {debt.name}
                                                                </h4>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="text-[8px] font-black uppercase tracking-wider text-rose-650 bg-rose-500/10 px-1 py-0.2 rounded">
                                                                        Deudor: {debt.debtor}
                                                                    </span>
                                                                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-650 bg-emerald-500/10 px-1 py-0.2 rounded">
                                                                        Acreedor: {debt.creditor}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                {balance > 0 && (
                                                                    <button
                                                                        onClick={() => { triggerHaptic(); setIsPayDebtOpen(debt); }}
                                                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95"
                                                                    >
                                                                        Pagar
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => { triggerHaptic(); deleteProjectDebt(activeProject.id, debt.id); }}
                                                                    className="p-1 text-zinc-400 hover:text-rose-500 active:scale-90"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Balance */}
                                                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                                                            <div>
                                                                <span className="text-[8px] font-black uppercase text-zinc-400 block">Original</span>
                                                                <span className="text-xs font-bold font-mono text-zinc-500 block">
                                                                    {currency}{debt.principal.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[8px] font-black uppercase text-zinc-400 block">Saldo Restante</span>
                                                                <span className="text-xs font-black font-mono text-zinc-800 dark:text-zinc-200 block">
                                                                    {currency}{balance.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/20 dark:border-zinc-850 mt-1">
                                                            <div 
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                                            />
                                                        </div>

                                                        {/* Payments log */}
                                                        {debt.payments && debt.payments.length > 0 && (
                                                            <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl p-2.5 space-y-1 mt-2 text-[9px] font-bold text-zinc-500 dark:text-zinc-450 border border-zinc-100 dark:border-zinc-850">
                                                                <span className="font-black text-[8px] uppercase tracking-wider block mb-1">Historial de Abonos</span>
                                                                {debt.payments.map((p, pIdx) => (
                                                                    <div key={pIdx} className="flex justify-between font-mono">
                                                                        <span>{p.paidBy}: {p.note || 'Abono'}</span>
                                                                        <span className="text-emerald-500 font-bold">-{currency}{p.amount.toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MEMBERS TAB */}
                            {detailTab === 'members' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                                            Colaboradores ({activeProject.members?.length || 0})
                                        </span>
                                        <button
                                            onClick={() => { triggerHaptic(); setIsInviteOpen(true); }}
                                            className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 active:scale-95"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                            <span>Invitar Colaborador</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2.5">
                                        {(activeProject.members || []).map(m => (
                                            <div 
                                                key={m.uid}
                                                className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl p-3.5 shadow-sm flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-xs uppercase">
                                                        {m.nickname.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-50 leading-snug">
                                                            @{m.nickname}
                                                        </h5>
                                                        <span className="text-[8px] font-black uppercase tracking-wider text-zinc-450">
                                                            Miembro Activo
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/60 dark:border-zinc-850 px-2 py-0.5 rounded-lg">
                                                    {m.role === 'owner' ? 'Creador' : 'Socio'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ------------------- BOTTOM SHEETS MODALS ------------------- */}

            {/* CREATE PROJECT BOTTOM SHEET */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsCreateOpen(false)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-6">Nuevo Proyecto</h3>
                            
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Nombre del Proyecto</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="ej. Campaña de Marketing, Remodelación..."
                                        value={projectName}
                                        onChange={e => setProjectName(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Notas o Descripción</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Escribe el alcance o presupuestos del proyecto..."
                                        value={projectDesc}
                                        onChange={e => setProjectDesc(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 resize-none focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!projectName.trim() || isSubmitting}
                                    className="w-full py-4 bg-indigo-650 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mt-6"
                                >
                                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} strokeWidth={2.5} />}
                                    <span>Crear Proyecto</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* REGISTER TRANSACTION SHEET */}
            <AnimatePresence>
                {isAddTxOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddTxOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-955 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsAddTxOpen(false)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-6">Registrar Movimiento</h3>
                            
                            <form onSubmit={handleAddTx} className="space-y-4">
                                {/* Type selector */}
                                <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => { triggerHaptic(); setTxType('expense'); }}
                                        className={clsx("py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all", txType === 'expense' ? "bg-white dark:bg-zinc-950 shadow text-rose-500" : "text-zinc-450")}
                                    >
                                        Gasto (Egreso)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { triggerHaptic(); setTxType('income'); }}
                                        className={clsx("py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all", txType === 'income' ? "bg-white dark:bg-zinc-950 shadow text-emerald-500" : "text-zinc-450")}
                                    >
                                        Inyección (Ingreso)
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Monto</label>
                                    <input 
                                        type="number" 
                                        required
                                        placeholder="0.00"
                                        value={txAmount}
                                        onChange={e => setTxAmount(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Concepto / Descripción</label>
                                    <input 
                                        type="text" 
                                        placeholder="ej. Compra de pintura, abono de socio..."
                                        value={txDesc}
                                        onChange={e => setTxDesc(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                {/* Conditionally Render Budget Lines for Expense */}
                                {txType === 'expense' && (activeProject?.budgetLines || []).length > 0 && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Asignar a Partida</label>
                                        <select 
                                            value={budgetLineId}
                                            onChange={e => setBudgetLineId(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold"
                                        >
                                            <option value="">Ninguna partida (Gasto General)</option>
                                            {(activeProject?.budgetLines || []).map(line => (
                                                <option key={line.id} value={line.id}>{line.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Conditionally Render Funding Source for Income */}
                                {txType === 'income' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Origen del Financiamiento</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { triggerHaptic(); setFundingSource('internal'); }}
                                                className={clsx("py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all", fundingSource === 'internal' ? "border-indigo-600 bg-indigo-600/5 text-indigo-650 dark:text-indigo-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-450")}
                                            >
                                                Interno (Deducir de Wallet)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { triggerHaptic(); setFundingSource('external'); }}
                                                className={clsx("py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all", fundingSource === 'external' ? "border-indigo-600 bg-indigo-600/5 text-indigo-650 dark:text-indigo-400" : "border-zinc-200 dark:border-zinc-800 text-zinc-450")}
                                            >
                                                Externo (Inyección Directa)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!txAmount}
                                    className="w-full py-4 bg-indigo-650 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-450 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mt-6"
                                >
                                    <Check size={12} strokeWidth={2.5} />
                                    <span>Confirmar Movimiento</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD BUDGET LINE SHEET */}
            <AnimatePresence>
                {isAddBudgetLineOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddBudgetLineOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsAddBudgetLineOpen(false)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-6">Añadir Partida Presupuestaria</h3>
                            
                            <form onSubmit={handleAddBudgetLine} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Nombre de la Partida</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="ej. Materiales, Honorarios..."
                                        value={budgetName}
                                        onChange={e => setBudgetName(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Límite de Gasto ({currency})</label>
                                    <input 
                                        type="number" 
                                        required
                                        placeholder="0.00"
                                        value={budgetLimit}
                                        onChange={e => setBudgetLimit(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!budgetName.trim() || !budgetLimit}
                                    className="w-full py-4 bg-indigo-655 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-450 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mt-6"
                                >
                                    <Check size={12} strokeWidth={2.5} />
                                    <span>Agregar Partida</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD TASK SHEET */}
            <AnimatePresence>
                {isAddTaskOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddTaskOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsAddTaskOpen(false)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-6">Nueva Tarea</h3>
                            
                            <form onSubmit={handleAddTask} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Descripción</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="ej. Comprar cemento, llamar al carpintero..."
                                        value={taskDesc}
                                        onChange={e => setTaskDesc(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!taskDesc.trim()}
                                    className="w-full py-4 bg-indigo-650 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-450 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mt-6"
                                >
                                    <Check size={12} strokeWidth={2.5} />
                                    <span>Agregar Tarea</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD MILESTONE SHEET */}
            <AnimatePresence>
                {isAddMilestoneOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddMilestoneOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsAddMilestoneOpen(false)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-6">Agregar Hito</h3>
                            
                            <form onSubmit={handleAddMilestone} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Nombre del Hito</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="ej. Fundición de vigas, entrega final..."
                                        value={milestoneTitle}
                                        onChange={e => setMilestoneTitle(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Fecha Límite</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={milestoneDate}
                                        onChange={e => setMilestoneDate(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!milestoneTitle.trim() || !milestoneDate}
                                    className="w-full py-4 bg-indigo-650 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-450 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mt-6"
                                >
                                    <Check size={12} strokeWidth={2.5} />
                                    <span>Guardar Hito</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD DEBT SHEET */}
            <AnimatePresence>
                {isAddDebtOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddDebtOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsAddDebtOpen(false)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-6">Registrar Préstamo / Deuda</h3>
                            
                            <form onSubmit={handleAddDebt} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Nombre del Préstamo</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="ej. Aporte de Capital Temporal, Préstamo Caja..."
                                        value={debtName}
                                        onChange={e => setDebtName(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Acreedor (Cobra)</label>
                                        <input 
                                            type="text" 
                                            placeholder="ej. @socio, Banco..."
                                            value={debtCreditor}
                                            onChange={e => setDebtCreditor(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Deudor (Paga)</label>
                                        <input 
                                            type="text" 
                                            placeholder="ej. @todos, @socio..."
                                            value={debtDebtor}
                                            onChange={e => setDebtDebtor(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Monto Principal</label>
                                    <input 
                                        type="number" 
                                        required
                                        placeholder="0.00"
                                        value={debtPrincipal}
                                        onChange={e => setDebtPrincipal(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Plazo (Meses)</label>
                                        <input 
                                            type="number" 
                                            value={debtTerm}
                                            onChange={e => setDebtTerm(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Tasa de Interés (%)</label>
                                        <input 
                                            type="number" 
                                            value={debtRate}
                                            onChange={e => setDebtRate(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!debtName.trim() || !debtPrincipal}
                                    className="w-full py-4 bg-indigo-650 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-450 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mt-6"
                                >
                                    <Check size={12} strokeWidth={2.5} />
                                    <span>Registrar Préstamo</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PAY DEBT BOTTOM SHEET */}
            <AnimatePresence>
                {isPayDebtOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPayDebtOpen(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setIsPayDebtOpen(null)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-2">Registrar Pago</h3>
                            <p className="text-[10px] text-zinc-450 text-center font-bold mb-6">Abonar a: "{isPayDebtOpen.name}"</p>
                            
                            <form onSubmit={handlePayDebt} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Monto a pagar</label>
                                    <input 
                                        type="number" 
                                        required
                                        placeholder="0.00"
                                        value={payDebtAmount}
                                        onChange={e => setPayDebtAmount(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Nota / Concepto del Pago</label>
                                    <input 
                                        type="text" 
                                        placeholder="ej. Abono mensual, pago de cuota..."
                                        value={payDebtNote}
                                        onChange={e => setPayDebtNote(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none font-bold"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!payDebtAmount}
                                    className="w-full py-4 bg-indigo-650 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 text-white disabled:text-zinc-450 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mt-6"
                                >
                                    <Check size={12} strokeWidth={2.5} />
                                    <span>Registrar Pago</span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* INVITE COLLABORATOR SHEET */}
            <AnimatePresence>
                {isInviteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsInviteOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[85vh] overflow-y-auto flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 shrink-0" onClick={() => setIsInviteOpen(false)} />
                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-50 text-center mb-6 shrink-0">Invitar Colaborador</h3>
                            
                            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                                <div className="space-y-1.5 shrink-0">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Buscar por apodo (nickname)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="ej. mi_apodo..."
                                            value={inviteNick}
                                            onChange={e => setInviteNick(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                        {searchingUser && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" size={14} />}
                                    </div>
                                </div>

                                {/* Live Results list */}
                                <div className="space-y-2">
                                    {inviteNick.trim().length >= 2 && foundUsers.length === 0 && !searchingUser && (
                                        <p className="text-[10px] text-zinc-450 font-bold text-center py-4">Usuario no encontrado</p>
                                    )}

                                    {foundUsers.map(usr => (
                                        <div 
                                            key={usr.uid}
                                            className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-xs uppercase">
                                                    {usr.nickname.substring(0, 2)}
                                                </div>
                                                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">@{usr.nickname}</span>
                                            </div>
                                            <button
                                                onClick={() => handleInviteUser(usr)}
                                                disabled={isInviting}
                                                className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center active:scale-90"
                                            >
                                                <Plus size={14} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent Collaborators list */}
                                {inviteNick.trim() === '' && recentCollabs.length > 0 && (
                                    <div className="space-y-2.5 pt-2">
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Sugeridos Recientes</span>
                                        {recentCollabs.map(usr => (
                                            <div 
                                                key={usr.uid}
                                                className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-xs uppercase">
                                                        {usr.nickname.substring(0, 2)}
                                                    </div>
                                                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">@{usr.nickname}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleInviteUser(usr)}
                                                    disabled={isInviting}
                                                    className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center active:scale-90"
                                                >
                                                    <Plus size={14} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {isDeleteConfirmOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDeleteConfirmOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-5 shadow-2xl z-10 space-y-4 text-center"
                        >
                            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={22} />
                            </div>
                            
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-50">¿Eliminar Proyecto?</h4>
                                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450 leading-relaxed">
                                    Al eliminar este proyecto colaborativo, se limpiarán en cascada todas las transacciones, metas, tareas y deudas del ledger compartido. Esta acción no se puede deshacer.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-450 rounded-2xl font-black text-xs uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteProject}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/20"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default MobileProjects;
