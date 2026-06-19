import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Project } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useProjects } from '../../hooks/useProjects';
import { useBalance } from '../../hooks/useBalance';
import { useTransactions } from '../../hooks/useTransactions';
import {
    X, PieChart, List, Settings,
    ArrowUpRight, ArrowDownRight, Trash2, CheckSquare, PlusCircle, LayoutDashboard, Flag, Users,
    Search, Loader2, User, Coins, Check
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { clsx } from 'clsx';
import { DatePicker } from '../ui/DatePicker';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, YAxis } from 'recharts';

interface ProjectDetailsProps {
    project: Project;
    onClose: () => void;
}

const ProjectDetails = ({ project, onClose }: ProjectDetailsProps) => {
    const { currency } = useSettings();
    const {
        projects,
        updateProject, deleteProject,
        addProjectTransaction, deleteProjectTransaction, getProjectStats,
        addProjectTask, toggleProjectTask, deleteProjectTask,
        addBudgetLine, deleteBudgetLine,
        addMilestone, toggleMilestone, deleteMilestone,
        addProjectDebt, payProjectDebt, deleteProjectDebt
    } = useProjects();
    const { profile: collabProfile, searchUsersByNickname, sendProjectInvitation } = useCollaboration();
    const [inviteNick, setInviteNick] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);
    const [recentCollabs, setRecentCollabs] = useState<any[]>([]);
    const [searchingUser, setSearchingUser] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    // Compute unique historical collaborators from all projects and recent local invites
    const historicalCollabs = useMemo(() => {
        const unique = new Map<string, { uid: string; nickname: string }>();

        // 1. Add locally saved recent collaborators
        recentCollabs.forEach(c => {
            if (c.uid !== collabProfile?.uid) {
                unique.set(c.uid, { uid: c.uid, nickname: c.nickname });
            }
        });

        // 2. Add members of all active projects
        projects.forEach(p => {
            p.members?.forEach(m => {
                if (m.uid !== collabProfile?.uid) {
                    unique.set(m.uid, { uid: m.uid, nickname: m.nickname });
                }
            });
        });

        return Array.from(unique.values());
    }, [projects, recentCollabs, collabProfile]);
    const { currentBalance } = useBalance();
    const { addTransaction } = useTransactions();
    const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'ledger' | 'tasks' | 'milestones' | 'settings' | 'members' | 'debts'>('overview');

    // Stats
    const stats = getProjectStats(project);

    // Form States
    const [txForm, setTxForm] = useState({
        amount: '',
        description: '',
        type: 'expense' as 'income' | 'expense',
        fundingSource: 'internal' as 'internal' | 'external',
        budgetLineId: ''
    });
    const [showTxForm, setShowTxForm] = useState(false);

    const [newBudgetLine, setNewBudgetLine] = useState({ name: '', amount: '' });
    const [newMilestone, setNewMilestone] = useState({ title: '', targetDate: '' });
    const [newTaskDescription, setNewTaskDescription] = useState('');

    // Debt Form States & Effects
    const [showDebtForm, setShowDebtForm] = useState(false);
    const [debtForm, setDebtForm] = useState({
        name: '',
        creditor: collabProfile?.nickname ? `@${collabProfile.nickname}` : '',
        debtor: '@todos',
        principal: '',
        interestRate: '0',
        term: '12'
    });
    const [selectedDebtForPay, setSelectedDebtForPay] = useState<any | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payNote, setPayNote] = useState('');

    useEffect(() => {
        if (collabProfile?.nickname && !debtForm.creditor) {
            setDebtForm(prev => ({ ...prev, creditor: `@${collabProfile.nickname}` }));
        }
    }, [collabProfile]);

    const handleAddDebtSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const principal = Number(debtForm.principal);
        if (!debtForm.name.trim() || principal <= 0) {
            toast.error("Ingresa un nombre y monto inicial válidos");
            return;
        }

        addProjectDebt(project.id, {
            name: debtForm.name.trim(),
            creditor: debtForm.creditor.trim() || 'Banco',
            debtor: debtForm.debtor.trim() || '@todos',
            principal,
            interestRate: Number(debtForm.interestRate) || 0,
            term: Number(debtForm.term) || 1
        });

        setDebtForm({
            name: '',
            creditor: collabProfile?.nickname ? `@${collabProfile.nickname}` : '',
            debtor: '@todos',
            principal: '',
            interestRate: '0',
            term: '12'
        });
        setShowDebtForm(false);
    };

    const handlePayDebtSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(payAmount);
        if (!selectedDebtForPay || amount <= 0) {
            toast.error("Ingresa un monto de abono válido");
            return;
        }

        payProjectDebt(
            project.id,
            selectedDebtForPay.id,
            amount,
            collabProfile?.nickname || 'Usuario',
            payNote.trim() || undefined
        );

        setSelectedDebtForPay(null);
        setPayAmount('');
        setPayNote('');
    };

    const handleAddBudgetLine = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBudgetLine.name.trim() || !newBudgetLine.amount) return;
        addBudgetLine(project.id, {
            name: newBudgetLine.name,
            allocatedAmount: Number(newBudgetLine.amount),
            spentAmount: 0
        });
        setNewBudgetLine({ name: '', amount: '' });
    };

    const handleAddMilestone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMilestone.title.trim()) return;
        addMilestone(project.id, {
            title: newMilestone.title,
            targetDate: newMilestone.targetDate || undefined
        });
        setNewMilestone({ title: '', targetDate: '' });
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskDescription.trim()) return;
        addProjectTask(project.id, newTaskDescription);
        setNewTaskDescription('');
    };



    // Load recent collaborators
    useEffect(() => {
        try {
            const stored = localStorage.getItem('vaultly_recent_collaborators');
            if (stored) {
                setRecentCollabs(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Error loading recent collaborators:", e);
        }
    }, []);

    // Debounced Live Search
    useEffect(() => {
        const queryVal = inviteNick.trim();
        if (queryVal.length < 2) {
            setFoundUsers([]);
            return;
        }

        setSearchingUser(true);
        const delayDebounce = setTimeout(async () => {
            try {
                const results = await searchUsersByNickname(queryVal);
                setFoundUsers(results);
            } catch (err) {
                console.error("Live search error:", err);
            } finally {
                setSearchingUser(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [inviteNick]);

    const handleSearchUser = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const queryVal = inviteNick.trim();
        if (!queryVal) return;
        setSearchingUser(true);
        try {
            const results = await searchUsersByNickname(queryVal);
            setFoundUsers(results);
            if (results.length === 0) {
                toast.error("Usuario no encontrado");
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Error al buscar usuario: " + (error.message || "Intentelo más tarde"));
        } finally {
            setSearchingUser(false);
        }
    };

    const handleInvite = async (userToInvite: any) => {
        setIsInviting(true);
        try {
            await sendProjectInvitation(project.id, project.name, userToInvite.nickname, userToInvite.uid);
            
            // Save to recent collaborators
            setRecentCollabs(prev => {
                const filtered = prev.filter(u => u.uid !== userToInvite.uid);
                const updated = [userToInvite, ...filtered].slice(0, 5); // Keep last 5
                localStorage.setItem('vaultly_recent_collaborators', JSON.stringify(updated));
                return updated;
            });

            setInviteNick('');
            setFoundUsers([]);
        } finally {
            setIsInviting(false);
        }
    };

    const handleTxSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(txForm.amount);
        if (amount <= 0) return;

        if (txForm.type === 'income') {
            // Only deduct from main balance if it's an INTERNAL funding source
            if (txForm.fundingSource === 'internal') {
                // "Inyectar Capital" -> Deduct from Main Balance
                if (amount > currentBalance) {
                    toast.error(`Fondos insuficientes. Solo tienes ${currency}${currentBalance.toLocaleString()} disponibles.`);
                    return;
                }
                // 1. Deduct from Main Ledger
                addTransaction({
                    amount,
                    type: 'expense',
                    category: 'Inversión', // Using 'Inversión' or 'Proyectos'
                    description: `Inversión Proyecto: ${project.name}`,
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }

        // 2. Add to Project Ledger
        addProjectTransaction(project.id, {
            amount,
            description: txForm.description,
            type: txForm.type,
            fundingSource: txForm.type === 'income' ? txForm.fundingSource : undefined,
            budgetLineId: txForm.type === 'expense' && txForm.budgetLineId ? txForm.budgetLineId : undefined,
            date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()
        });
        setTxForm({ amount: '', description: '', type: 'expense', fundingSource: 'internal', budgetLineId: '' });
        setShowTxForm(false);
    };




    const handleDelete = () => {
        if (confirm('¿Estás seguro de eliminar este proyecto? Se perderá todo el historial.')) {
            deleteProject(project.id);
            onClose();
        }
    };

    // Chart Data (Last 6 transactions or simple category breakdown would be better, using simple daily flow for now)
    const chartData = useMemo(() => {
        return project.transactions.slice(0, 7).reverse().map(t => ({
            name: new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            amount: t.type === 'income' ? t.amount : -t.amount
        }));
    }, [project.transactions]);

    const cycleStatus = () => {
        const nextStatus: Record<Project['status'], Project['status']> = {
            'planning': 'active',
            'active': 'completed',
            'completed': 'planning',
            'paused': 'active',
            'cancelled': 'planning'
        };
        updateProject(project.id, { status: nextStatus[project.status] });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
        >
            {/* Height changed from max-h to h to prevent jumping */}
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white/95 dark:bg-zinc-950/95 w-full max-w-5xl h-[85vh] md:h-[90vh] rounded-[2rem] shadow-2xl flex flex-col border border-white/20 dark:border-zinc-800 overflow-hidden backdrop-blur-xl"
            >

                {/* Header Premium */}
                <div className="p-4 md:p-6 border-b border-zinc-100 dark:border-zinc-800/50 flex justify-between items-start bg-zinc-50/50 dark:bg-zinc-900/20 backdrop-blur-sm">
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                            <h2 className="text-xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{project.name}</h2>
                            {/* Removed self-start so it centers with items-center */}
                            <span
                                onClick={cycleStatus}
                                className={clsx("px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border cursor-pointer hover:scale-105 transition-transform select-none shadow-sm", {
                                    'bg-zinc-100 text-zinc-600 border-zinc-200': project.status === 'planning',
                                    'bg-emerald-100 text-emerald-600 border-emerald-200': project.status === 'active',
                                    'bg-amber-100 text-amber-600 border-amber-200': project.status === 'paused',
                                    'bg-blue-100 text-blue-600 border-blue-200': project.status === 'completed',
                                    'bg-rose-100 text-rose-600 border-rose-200': project.status === 'cancelled',
                                })}>
                                {project.status === 'planning' ? 'Planificación' :
                                    project.status === 'active' ? 'Activo' :
                                        project.status === 'paused' ? 'Pausado' :
                                            project.status === 'completed' ? 'Completado' : 'Cancelado'}
                            </span>
                        </div>
                        <p className="text-zinc-500 text-xs md:text-sm font-medium max-w-xl leading-relaxed">{project.description || 'Sin descripción'}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-95">
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>
                </div>

                {/* Tabs - Desktop Segmented Control (Hidden on Mobile) */}
                <div className="hidden md:flex border-b border-zinc-100 dark:border-zinc-800/50 px-6 py-3 bg-white dark:bg-zinc-950/50 justify-center">
                    {/* Increased space-x-1 to gap-2 for better spacing */}
                    <div className="flex gap-2">
                        {[
                            { id: 'overview', icon: PieChart, label: 'Resumen' },
                            { id: 'budget', icon: LayoutDashboard, label: 'Fondos' },
                            { id: 'milestones', icon: Flag, label: 'Hitos' },
                            { id: 'ledger', icon: List, label: 'Movimientos' },
                            { id: 'tasks', icon: CheckSquare, label: 'Tareas' },
                            { id: 'debts', icon: Coins, label: 'Deudas' },
                            { id: 'members', icon: Users, label: 'Equipo' },
                            { id: 'settings', icon: Settings, label: 'Ajustes' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-white/10 scale-105"
                                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                                )}
                            >
                                <tab.icon size={14} className={clsx(activeTab === tab.id && "animate-pulse")} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/50 pb-20 md:pb-8 relative">
                    <AnimatePresence mode="wait">

                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 md:space-y-8"
                            >
                                {/* KPI Grid - Mobile 2x2 */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                    <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">Presupuesto</p>
                                        <p className="text-lg md:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{currency}{project.targetBudget.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">Gastado</p>
                                        <p className="text-lg md:text-2xl font-black text-rose-500 tracking-tight">{currency}{stats.totalExpenses.toLocaleString()}</p>
                                        <div className="hidden md:block mt-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1">
                                            <div className="bg-rose-500 h-1 rounded-full" style={{ width: `${Math.min(stats.percentConsumed, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">Disponible</p>
                                        <p className={clsx("text-lg md:text-2xl font-black tracking-tight", stats.budgetRemaining >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {currency}{stats.budgetRemaining.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900/80 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">Liquidez (Caja)</p>
                                        <p className={clsx("text-lg md:text-2xl font-black tracking-tight", stats.currentBalance >= 0 ? "text-blue-500" : "text-amber-500")}>
                                            {currency}{stats.currentBalance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Main Chart Area */}
                                <div className="bg-white dark:bg-zinc-900/80 p-5 md:p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wide flex items-center gap-2">
                                            <ArrowUpRight size={16} className="text-emerald-500" />
                                            Flujo de Caja
                                        </h3>
                                        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">Últimos 7 movimientos</span>
                                    </div>
                                    <div className="h-48 md:h-64">
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                                    <YAxis
                                                        fontSize={10}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(val) => `${currency}${val}`}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        formatter={(value: any) => [`${currency}${Number(value).toLocaleString()}`, 'Monto']}
                                                    />
                                                    <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? '#10b981' : '#f43f5e'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Sin datos suficientes</div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Movements List (Mobile & Desktop) */}
                                <div className="bg-white dark:bg-zinc-900/80 p-5 md:p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wide flex items-center gap-2">
                                            <List size={16} className="text-indigo-500" />
                                            Movimientos Recientes
                                        </h3>
                                        <button onClick={() => setActiveTab('ledger')} className="text-xs font-bold text-indigo-500 hover:underline">Ver todos</button>
                                    </div>
                                    <div className="space-y-3">
                                        {project.transactions.slice().reverse().slice(0, 5).map((t) => (
                                            <div key={t.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx("p-2 rounded-full", t.type === 'income' ? "bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-100/50 text-rose-600 dark:bg-rose-900/20")}>
                                                        {t.type === 'income' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{t.description}</p>
                                                        <p className="text-[10px] text-zinc-500">{t.date}</p>
                                                    </div>
                                                </div>
                                                <span className={clsx("font-mono font-bold text-sm", t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                                    {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                        {project.transactions.length === 0 && (
                                            <p className="text-center text-zinc-400 text-xs py-4">No hay movimientos registrados</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Mobile Bottom Navigation */}
                        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-safe pt-1 px-4 z-50 flex justify-between items-center h-[70px] shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)]">
                            {[
                                { id: 'overview', icon: LayoutDashboard, label: 'Inicio' },
                                { id: 'budget', icon: PieChart, label: 'Fondos' },
                                { id: 'ledger', icon: List, label: 'Lista' },
                                { id: 'tasks', icon: CheckSquare, label: 'Tareas' },
                                { id: 'debts', icon: Coins, label: 'Deudas' },
                                { id: 'members', icon: Users, label: 'Equipo' },
                                { id: 'settings', icon: Settings, label: 'Ajustes' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className="flex flex-col items-center justify-center p-1 w-14 gap-1 active:scale-95 transition-transform"
                                >
                                    <div className={clsx(
                                        "p-1.5 rounded-xl transition-all duration-300",
                                        activeTab === tab.id ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md shadow-zinc-900/20" : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                    )}>
                                        <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {activeTab === 'budget' && (
                            <motion.div
                                key="budget"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >

                                {/* Distribution Summary Visual */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl mb-4 shadow-sm">
                                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex justify-between items-center">
                                        <span>Distribución de Fondos</span>
                                        <span className="text-zinc-500 text-sm font-normal">
                                            Total Ingresado: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{currency}{stats.totalIncome.toLocaleString()}</span>
                                        </span>
                                    </h4>

                                    {/* Progress Bar of Distribution */}
                                    <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex mb-2">
                                        {project.budgetLines?.map((line, idx) => (
                                            <div
                                                key={line.id}
                                                style={{ width: `${(line.allocatedAmount / stats.totalIncome) * 100}%` }}
                                                className={clsx("h-full",
                                                    idx % 3 === 0 ? "bg-emerald-500" : idx % 3 === 1 ? "bg-blue-500" : "bg-indigo-500"
                                                )}
                                                title={`${line.name}: ${currency}${line.allocatedAmount.toLocaleString()}`}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex justify-between text-xs text-zinc-500 mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span>Asignado: {currency}{(project.targetBudget || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
                                            <span>Sin Asignar: {currency}{(stats.totalIncome - (project.targetBudget || 0)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl mb-6">
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        Divide tu caja real en partidas. <br />
                                        <strong>Disponible para asignar: {currency}{(stats.totalIncome - (project.targetBudget || 0)).toLocaleString()}</strong>
                                    </p>
                                </div>

                                <form onSubmit={(e) => {
                                    const unallocated = stats.totalIncome - (project.targetBudget || 0);
                                    const amount = Number(newBudgetLine.amount);
                                    if (amount > unallocated) {
                                        e.preventDefault();
                                        toast.error(`No puedes asignar más de lo disponible (${currency}${unallocated.toLocaleString()})`);
                                        return;
                                    }
                                    handleAddBudgetLine(e);
                                }} className="flex flex-col md:flex-row gap-2 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Nombre de Partida (ej. Operaciones)"
                                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-emerald-500/50"
                                        value={newBudgetLine.name}
                                        onChange={e => setNewBudgetLine({ ...newBudgetLine, name: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <div className="relative w-full md:w-32">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4">{currency}</span>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                className="w-full pl-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-emerald-500/50"
                                                value={newBudgetLine.amount}
                                                onChange={e => setNewBudgetLine({ ...newBudgetLine, amount: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newBudgetLine.name.trim() || !newBudgetLine.amount}
                                            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex-shrink-0"
                                        >
                                            <PlusCircle size={24} />
                                        </button>
                                    </div>
                                </form>

                                <div className="grid grid-cols-1 gap-3">
                                    {(!project.budgetLines || project.budgetLines.length === 0) ? (
                                        <div className="text-center py-8 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                            <LayoutDashboard size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No has definido partidas presupuestarias</p>
                                        </div>
                                    ) : (
                                        project.budgetLines.map(line => (
                                            <div key={line.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{line.name}</p>
                                                        <p className="text-xs text-zinc-500">
                                                            {((line.allocatedAmount / stats.totalIncome) * 100).toFixed(1)}% del total
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteBudgetLine(project.id, line.id)}
                                                        className="text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-zinc-500">Gastado: {currency}{(line.spentAmount || 0).toLocaleString()}</span>
                                                        <span className={clsx("font-bold", (line.allocatedAmount - (line.spentAmount || 0)) < 0 ? "text-rose-500" : "text-zinc-700 dark:text-zinc-300")}>
                                                            Disp: {currency}{(line.allocatedAmount - (line.spentAmount || 0)).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div
                                                            style={{ width: `${Math.min(100, ((line.spentAmount || 0) / line.allocatedAmount) * 100)}%` }}
                                                            className={clsx("h-full transition-all",
                                                                ((line.spentAmount || 0) > line.allocatedAmount) ? "bg-rose-500" : "bg-emerald-500"
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-zinc-400">
                                                        <span>0%</span>
                                                        <span>{Math.round(((line.spentAmount || 0) / line.allocatedAmount) * 100)}% utilizado</span>
                                                        <span>100%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'milestones' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <form onSubmit={handleAddMilestone} className="flex flex-col md:flex-row gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nuevo Hito / Meta..."
                                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-emerald-500/50"
                                        value={newMilestone.title}
                                        onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex-1 md:w-auto">
                                            <DatePicker
                                                value={newMilestone.targetDate}
                                                onChange={(date) => setNewMilestone({ ...newMilestone, targetDate: date })}
                                                className="w-full"
                                                label="Fecha Objetivo"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newMilestone.title.trim()}
                                            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex-shrink-0"
                                        >
                                            <PlusCircle size={24} />
                                        </button>
                                    </div>
                                </form>

                                <div className="param-timeline relative pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-8 my-6">
                                    {(!project.milestones || project.milestones.length === 0) && (
                                        <div className="text-center py-8 text-zinc-400 -ml-4">
                                            <Flag size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No hay hitos definidos</p>
                                        </div>
                                    )}
                                    {project.milestones?.map(milestone => (
                                        <div key={milestone.id} className="relative group">
                                            <div className={clsx(
                                                "absolute -left-[23px] top-6 w-3 h-3 rounded-full border-2 transition-colors z-10",
                                                milestone.status === 'completed' ? "bg-emerald-500 border-emerald-500" : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                                            )} />
                                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-4 transition-all hover:border-emerald-500/30">
                                                <button
                                                    onClick={() => toggleMilestone(project.id, milestone.id)}
                                                    className={clsx(
                                                        "mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                                                        milestone.status === 'completed'
                                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                                            : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-500"
                                                    )}
                                                >
                                                    {milestone.status === 'completed' && <CheckSquare size={12} />}
                                                </button>
                                                <div className="flex-1">
                                                    <h4 className={clsx("font-bold text-lg leading-tight transition-all", milestone.status === 'completed' ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100")}>
                                                        {milestone.title}
                                                    </h4>
                                                    {milestone.targetDate && (
                                                        <p className="text-xs text-zinc-500 mt-1">
                                                            Objetivo: {new Date(milestone.targetDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => deleteMilestone(project.id, milestone.id)}
                                                    className="text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'ledger' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <button
                                        onClick={() => { setTxForm(prev => ({ ...prev, type: 'income' })); setShowTxForm(true); }}
                                        className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white py-3 md:py-4 rounded-2xl font-bold flex flex-col md:flex-row items-center justify-center gap-2 transition-all shadow-sm hover:shadow-emerald-500/20"
                                    >
                                        <ArrowDownRight size={20} className="hidden md:block" />
                                        <div className="flex items-center gap-2">
                                            <ArrowDownRight size={18} className="md:hidden" />
                                            <span>Inyectar</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setTxForm(prev => ({ ...prev, type: 'expense' })); setShowTxForm(true); }}
                                        className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 active:scale-[0.98] text-zinc-900 dark:text-zinc-100 py-3 md:py-4 rounded-2xl font-bold flex flex-col md:flex-row items-center justify-center gap-2 transition-all shadow-sm"
                                    >
                                        <ArrowUpRight size={20} className="hidden md:block text-rose-500" />
                                        <div className="flex items-center gap-2">
                                            <ArrowUpRight size={18} className="md:hidden text-rose-500" />
                                            <span>Gasto</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Transaction Form Inline */}
                                {showTxForm && (
                                    <form onSubmit={handleTxSubmit} className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-zinc-800 dark:text-zinc-200">
                                                {txForm.type === 'income' ? 'Nuevo Ingreso de Capital' : 'Nuevo Gasto del Proyecto'}
                                            </h4>
                                            <button type="button" onClick={() => setShowTxForm(false)} className="text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
                                        </div>

                                        {/* Funding Source Selector (Only for Income) */}
                                        {txForm.type === 'income' && (
                                            <div className="flex gap-2 mb-3 bg-white dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                <button
                                                    type="button"
                                                    onClick={() => setTxForm({ ...txForm, fundingSource: 'internal' })}
                                                    className={clsx("flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors", txForm.fundingSource === 'internal' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-zinc-500 hover:text-zinc-700")}
                                                >
                                                    Financiación Propia
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTxForm({ ...txForm, fundingSource: 'external' })}
                                                    className={clsx("flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors", txForm.fundingSource === 'external' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700")}
                                                >
                                                    Inversor / Externo
                                                </button>
                                            </div>
                                        )}

                                        {/* Budget Line Selector (Only for Expense) */}
                                        {txForm.type === 'expense' && project.budgetLines && project.budgetLines.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Descontar de:</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {/* Option: General (No Fund) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setTxForm({ ...txForm, budgetLineId: '' })}
                                                        className={clsx(
                                                            "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                                                            txForm.budgetLineId === ''
                                                                ? "border-rose-500 bg-rose-50 dark:bg-rose-900/10 ring-1 ring-rose-500"
                                                                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-rose-300"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <LayoutDashboard size={16} className={txForm.budgetLineId === '' ? "text-rose-600" : "text-zinc-400"} />
                                                            <span className={clsx("font-bold text-sm", txForm.budgetLineId === '' ? "text-rose-700 dark:text-rose-400" : "text-zinc-700 dark:text-zinc-300")}>
                                                                General
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500">Caja del Proyecto</p>
                                                    </button>

                                                    {/* Options: Budget Lines */}
                                                    {project.budgetLines.map(line => {
                                                        const available = line.allocatedAmount - (line.spentAmount || 0);
                                                        const isSelected = txForm.budgetLineId === line.id;
                                                        return (
                                                            <button
                                                                key={line.id}
                                                                type="button"
                                                                onClick={() => setTxForm({ ...txForm, budgetLineId: line.id })}
                                                                className={clsx(
                                                                    "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                                                                    isSelected
                                                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500"
                                                                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-emerald-300"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className={clsx("w-2 h-2 rounded-full", isSelected ? "bg-emerald-500" : "bg-zinc-300")} />
                                                                    <span className={clsx("font-bold text-sm truncate", isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300")}>
                                                                        {line.name}
                                                                    </span>
                                                                </div>
                                                                <p className={clsx("text-[10px]", available < 0 ? "text-rose-500" : "text-zinc-500")}>
                                                                    Disp: {currency}{available.toLocaleString()}
                                                                </p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Descripción"
                                                required
                                                className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 ring-emerald-500/50"
                                                value={txForm.description}
                                                onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                                            />
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">{currency}</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    required
                                                    step="0.01"
                                                    className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-4 py-2 w-full focus:outline-none focus:ring-2 ring-emerald-500/50"
                                                    value={txForm.amount}
                                                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-2 rounded-lg">
                                            Guardar Movimiento
                                        </button>
                                    </form>
                                )}

                                {/* Ledger List */}
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                    {project.transactions.length === 0 ? (
                                        <div className="p-12 text-center text-zinc-400">
                                            <List size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>No hay movimientos registrados en este proyecto.</p>
                                        </div>
                                    ) : (
                                        project.transactions.map((tx) => (
                                            <div key={tx.id} className={clsx("p-4 flex items-center justify-between border-b last:border-0 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group")}>
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", tx.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                                        {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{tx.description}</p>
                                                        <p className="text-xs text-zinc-500">{new Date(tx.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={clsx("font-mono font-bold", tx.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                                        {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toFixed(2)}
                                                    </span>
                                                    <button
                                                        onClick={() => deleteProjectTransaction(project.id, tx.id)}
                                                        className="text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-xl mx-auto space-y-8 pt-8"
                            >
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Estado del Proyecto</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['planning', 'active', 'paused', 'completed', 'cancelled'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => updateProject(project.id, { status: status as Project['status'] })}
                                                className={clsx("px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                                                    project.status === status
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                                )}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                                    <h3 className="font-bold text-lg text-rose-600 mb-2">Zona de Peligro</h3>
                                    <p className="text-sm text-zinc-500 mb-4">Eliminar el proyecto borrará permanentemente todos los datos y transacciones asociadas.</p>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} /> Eliminar Proyecto
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'tasks' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-2">
                                <form onSubmit={handleAddTask} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nueva tarea pendiente..."
                                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-emerald-500/50"
                                        value={newTaskDescription}
                                        onChange={e => setNewTaskDescription(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newTaskDescription.trim()}
                                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
                                    >
                                        <PlusCircle size={24} />
                                    </button>
                                </form>

                                <div className="space-y-2">
                                    {(!project.tasks || project.tasks.length === 0) && (
                                        <div className="text-center py-12 text-zinc-400">
                                            <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>No hay tareas registradas.</p>
                                        </div>
                                    )}
                                    {project.tasks?.map(task => (
                                        <div
                                            key={task.id}
                                            className="group flex items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-emerald-500/30"
                                        >
                                            <button
                                                onClick={() => toggleProjectTask(project.id, task.id)}
                                                className={clsx(
                                                    "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                                    task.completed
                                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                                        : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-500"
                                                )}
                                            >
                                                {task.completed && <CheckSquare size={14} />}
                                            </button>
                                            <span className={clsx("flex-1 text-zinc-700 dark:text-zinc-300 transition-all", task.completed && "line-through text-zinc-400")}>
                                                {task.description}
                                            </span>
                                            <button
                                                onClick={() => deleteProjectTask(project.id, task.id)}
                                                className="text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'members' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-2 pb-8">
                                {/* Invite Section */}
                                <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 space-y-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-2xl">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
                                                Invitar Colaboradores
                                            </h3>
                                            <p className="text-xs text-zinc-500">Agrega editores para compartir presupuestos y movimientos</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Buscar usuario por nickname (ej. sebastian)"
                                            className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl px-4 py-3.5 pl-11 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all font-semibold placeholder-zinc-450"
                                            value={inviteNick}
                                            onChange={(e) => setInviteNick(e.target.value)}
                                        />
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    </div>

                                    {/* Collaborator History (Suggestions) */}
                                    {!inviteNick.trim() && historicalCollabs.length > 0 && (
                                        <div className="space-y-2.5 pt-1 animate-in fade-in duration-300">
                                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Sugerencias de Colaboración</p>
                                            <div className="flex flex-wrap gap-2">
                                                {historicalCollabs.map(collab => {
                                                    const isAlreadyMember = project.members?.some(m => m.uid === collab.uid) || project.membersIds?.includes(collab.uid);
                                                    const initials = collab.nickname.substring(0, 2).toUpperCase();
                                                    return (
                                                        <button
                                                            key={collab.uid}
                                                            onClick={() => !isAlreadyMember && handleInvite(collab)}
                                                            disabled={isAlreadyMember || isInviting}
                                                            className={clsx(
                                                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer select-none active:scale-95",
                                                                isAlreadyMember
                                                                    ? "bg-zinc-150/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/50 text-zinc-400 cursor-not-allowed"
                                                                    : "bg-zinc-50 dark:bg-zinc-950 hover:bg-emerald-500/5 hover:border-emerald-500/30 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                                                            )}
                                                        >
                                                            <div className="w-5 h-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-[9px] font-black tracking-tight shrink-0 uppercase">
                                                                {initials}
                                                            </div>
                                                            <span>@{collab.nickname}</span>
                                                            {isAlreadyMember && <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">(Miembro)</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Live Search Results Dropdown/List */}
                                    {inviteNick.trim() && (
                                        <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex justify-between items-center px-1">
                                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
                                                    {searchingUser ? 'Buscando Coincidencias...' : `Resultados (${foundUsers.length})`}
                                                </p>
                                                {searchingUser && <Loader2 size={12} className="animate-spin text-zinc-450" />}
                                            </div>

                                            <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800/60 bg-zinc-50 dark:bg-zinc-955 rounded-2xl border border-zinc-250/50 dark:border-zinc-800/60 overflow-hidden shadow-inner">
                                                {foundUsers.map(u => {
                                                    const isAlreadyMember = project.members?.some(m => m.uid === u.uid) || project.membersIds?.includes(u.uid);
                                                    const initials = u.nickname.substring(0, 2).toUpperCase();
                                                    return (
                                                        <div key={u.uid} className="flex items-center justify-between p-3.5 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/10 rounded-xl flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                                                                        <span>@{u.nickname}</span>
                                                                        {u.uid === collabProfile?.uid && <span className="text-[8px] font-black uppercase bg-zinc-200 dark:bg-zinc-850 text-zinc-500 px-1.5 py-0.5 rounded">Tú</span>}
                                                                    </p>
                                                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Miembro de Vaultly</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleInvite(u)}
                                                                disabled={isAlreadyMember || isInviting || u.uid === collabProfile?.uid}
                                                                className={clsx(
                                                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95",
                                                                    isAlreadyMember
                                                                        ? "bg-zinc-200/50 dark:bg-zinc-900/30 text-zinc-450 border border-zinc-200 dark:border-zinc-800/80 cursor-not-allowed"
                                                                        : u.uid === collabProfile?.uid
                                                                            ? "hidden"
                                                                            : "bg-emerald-650 hover:bg-emerald-600 text-white shadow-sm"
                                                                )}
                                                            >
                                                                {isInviting ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                <span>{isAlreadyMember ? 'Ya es Miembro' : 'Invitar'}</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })}

                                                {!searchingUser && foundUsers.length === 0 && (
                                                    <div className="p-8 text-center text-zinc-405 dark:text-zinc-500 text-xs italic">
                                                        No se encontraron usuarios con "{inviteNick}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Current Members List */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="font-black text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                        <span>Equipo del Proyecto</span>
                                        <span className="text-[10px] font-black bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-650 dark:text-zinc-400">
                                            {project.members?.length || 0}
                                        </span>
                                    </h3>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {project.members?.map(member => {
                                            const isOwner = member.role === 'owner';
                                            const initials = member.nickname.substring(0, 2).toUpperCase();
                                            const isMe = member.uid === collabProfile?.uid;
                                            
                                            return (
                                                <div key={member.uid} className="flex items-center justify-between bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm relative overflow-hidden group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-zinc-250 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase shrink-0 border border-zinc-300/30 dark:border-zinc-700/30">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-zinc-900 dark:text-zinc-150 text-xs truncate flex items-center gap-1.5">
                                                                <span>@{member.nickname}</span>
                                                                {isMe && <span className="text-[8px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-455 px-1.5 py-0.2 rounded-md">Tú</span>}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-400 mt-0.5 font-semibold">
                                                                {isOwner ? 'Acceso Propietario' : 'Editor de Proyecto'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={clsx("text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0",
                                                        isOwner 
                                                            ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
                                                            : "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
                                                    )}>
                                                        {isOwner ? 'Propietario' : 'Editor'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {(!project.members || project.members.length === 0) && (
                                        <div className="text-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50/20 dark:bg-zinc-955/10">
                                            <p className="text-xs text-zinc-450 italic">No hay miembros en este proyecto</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'debts' && (
                            <motion.div
                                key="debts"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-2 pb-8"
                            >
                                {/* Consolidated Statistics Dashboard */}
                                {(() => {
                                    const projectDebts = project.debts || [];
                                    const totalPrincipal = projectDebts.reduce((acc, d) => acc + d.principal, 0);
                                    const totalRemaining = projectDebts.reduce((acc, d) => acc + d.amount, 0);
                                    const totalPaid = Math.max(0, totalPrincipal - totalRemaining);
                                    const overallProgress = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;

                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/85 shadow-sm">
                                                <span className="block text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Caja Pendiente (Deuda Activa)</span>
                                                <span className="text-2xl font-mono font-black text-rose-650 dark:text-rose-455">
                                                    {currency}{totalRemaining.toLocaleString()}
                                                </span>
                                                <span className="block text-[10px] text-zinc-450 mt-1 font-semibold">Consolidado de deudores</span>
                                            </div>

                                            <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/85 shadow-sm">
                                                <span className="block text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total Amortizado</span>
                                                <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-455">
                                                    {currency}{totalPaid.toLocaleString()}
                                                </span>
                                                <span className="block text-[10px] text-zinc-450 mt-1 font-semibold">Abonado a acreedores</span>
                                            </div>

                                            <div className="bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/85 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <span className="block text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Progreso de Pago</span>
                                                    <span className="text-xl font-black text-zinc-800 dark:text-zinc-250">
                                                        {overallProgress.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-zinc-250 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                                                    <div 
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${overallProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Header and toggle button */}
                                <div className="flex justify-between items-center bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl p-4.5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-2xl">
                                            <Coins className="animate-pulse" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
                                                Deudas Colaborativas
                                            </h3>
                                            <p className="text-xs text-zinc-500">Préstamos, gastos de compras compartidas y créditos</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDebtForm(!showDebtForm)}
                                        className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/10 active:scale-95 cursor-pointer flex items-center gap-1.5"
                                    >
                                        <PlusCircle size={14} />
                                        <span>Registrar Deuda</span>
                                    </button>
                                </div>

                                {/* Add Debt Form */}
                                {showDebtForm && (
                                    <form onSubmit={handleAddDebtSubmit} className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl p-6 rounded-3xl border border-indigo-200 dark:border-indigo-950/60 shadow-lg space-y-5 animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex justify-between items-center border-b border-zinc-105 dark:border-zinc-800/60 pb-3">
                                            <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Registrar nueva deuda / crédito compartido</h4>
                                            <button type="button" onClick={() => setShowDebtForm(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer"><X size={16} /></button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">Concepto de Deuda</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="ej. Préstamo de Capital inicial, Materiales"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-850 dark:text-zinc-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder-zinc-400"
                                                    value={debtForm.name}
                                                    onChange={e => setDebtForm(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">Acreedor (Quién prestó)</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="ej. Banco, @sebastian"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-850 dark:text-zinc-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder-zinc-400"
                                                    value={debtForm.creditor}
                                                    onChange={e => setDebtForm(prev => ({ ...prev, creditor: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">Deudor (Quién debe pagar)</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="ej. @todos, @pepito"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-850 dark:text-zinc-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder-zinc-400"
                                                    value={debtForm.debtor}
                                                    onChange={e => setDebtForm(prev => ({ ...prev, debtor: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">Monto Inicial ({currency})</label>
                                                <input
                                                    required
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-850 dark:text-zinc-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder-zinc-400"
                                                    value={debtForm.principal}
                                                    onChange={e => setDebtForm(prev => ({ ...prev, principal: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">Tasa Interés Anual (%)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-850 dark:text-zinc-200 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder-zinc-400"
                                                    value={debtForm.interestRate}
                                                    onChange={e => setDebtForm(prev => ({ ...prev, interestRate: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">Plazo (Meses)</label>
                                                <input
                                                    type="number"
                                                    placeholder="12"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-850 dark:text-zinc-200 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder-zinc-400"
                                                    value={debtForm.term}
                                                    onChange={e => setDebtForm(prev => ({ ...prev, term: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-indigo-900/10 active:scale-[0.99]"
                                        >
                                            Guardar Deuda
                                        </button>
                                    </form>
                                )}

                                {/* Pay/Contribution Modal Dialog */}
                                {selectedDebtForPay && (
                                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                                        <form onSubmit={handlePayDebtSubmit} className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl w-full max-w-md p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800/60 pb-3">
                                                <h4 className="font-black text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                    <Coins size={18} className="text-emerald-500 animate-bounce" />
                                                    Abonar a Deuda
                                                </h4>
                                                <button type="button" onClick={() => setSelectedDebtForPay(null)} className="text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer"><X size={18} /></button>
                                            </div>
                                            <div className="bg-zinc-50 dark:bg-zinc-950 p-4.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 mb-2">
                                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Deuda Seleccionada</p>
                                                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-0.5">{selectedDebtForPay.name}</p>
                                                <p className="text-xs font-mono font-bold text-zinc-500 mt-1">Saldo Pendiente: {currency}{selectedDebtForPay.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">Monto a Abonar ({currency})</label>
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-855 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder-zinc-450"
                                                    placeholder="0"
                                                    value={payAmount}
                                                    onChange={e => setPayAmount(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-505 uppercase tracking-widest block mb-0.5">Nota / Comentario</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3 text-xs text-zinc-850 dark:text-zinc-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all placeholder-zinc-455"
                                                    placeholder="ej. Pago cuota de junio, amortización parcial"
                                                    value={payNote}
                                                    onChange={e => setPayNote(e.target.value)}
                                                />
                                            </div>
                                            <button type="submit" className="w-full bg-emerald-650 hover:bg-emerald-650 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-emerald-900/10 active:scale-[0.99] flex items-center justify-center gap-1.5">
                                                <Check size={14} strokeWidth={2.5} />
                                                <span>Registrar Abono</span>
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Debts List Grid */}
                                <div className="grid gap-5 md:grid-cols-2">
                                    {(project.debts || []).map(debt => {
                                        const paidAmount = debt.principal - debt.amount;
                                        const progressPercent = Math.min(100, Math.max(0, (paidAmount / debt.principal) * 100));
                                        const isPaid = debt.status === 'paid';
                                        
                                        return (
                                            <div key={debt.id} className={clsx(
                                                "p-6 rounded-3xl border transition-all relative overflow-hidden bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl shadow-sm group",
                                                isPaid 
                                                    ? "border-emerald-500/20 bg-emerald-500/5 opacity-80" 
                                                    : "border-zinc-200/60 dark:border-zinc-800/80 hover:border-indigo-500/20"
                                            )}>
                                                {/* Left/Right glow indicators */}
                                                <div className={clsx(
                                                    "absolute left-0 inset-y-0 w-1",
                                                    isPaid ? "bg-emerald-505" : "bg-indigo-500"
                                                )} />

                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-black text-base text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">{debt.name}</h4>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[9px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                                                            <span>Acreedor: <strong className="text-zinc-700 dark:text-zinc-300 font-bold">{debt.creditor}</strong></span>
                                                            <span>•</span>
                                                            <span>Deudor: <strong className="text-indigo-650 dark:text-indigo-400 font-bold">{debt.debtor}</strong></span>
                                                            {debt.interestRate !== undefined && debt.interestRate > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-amber-500 dark:text-amber-450 font-bold">Interés: {debt.interestRate}% Anual</span>
                                                                </>
                                                            )}
                                                            {debt.term !== undefined && debt.term > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-purple-500 dark:text-purple-450 font-bold">Plazo: {debt.term} Meses</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button 
                                                            onClick={() => deleteProjectDebt(project.id, debt.id)}
                                                            className="text-zinc-400 hover:text-rose-500 p-2 hover:bg-rose-500/5 dark:hover:bg-rose-955/20 rounded-xl transition-all cursor-pointer"
                                                            title="Eliminar Deuda"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-955/40 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/50 mb-4 shadow-inner">
                                                    <div>
                                                        <span className="block text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Saldo Restante</span>
                                                        <span className={clsx("text-lg font-mono font-black", isPaid ? "text-emerald-505" : "text-zinc-900 dark:text-zinc-100")}>
                                                            {currency}{debt.amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Monto Original</span>
                                                        <span className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 block mt-1">
                                                            {currency}{debt.principal.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5 mb-5">
                                                    <div className="flex justify-between text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                                        <span>Amortizado: {progressPercent.toFixed(0)}%</span>
                                                        <span>{currency}{paidAmount.toLocaleString()} pagados</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-805 rounded-full overflow-hidden border border-zinc-300/10 dark:border-zinc-700/10">
                                                        <div 
                                                            className={clsx("h-full rounded-full transition-all duration-500", isPaid ? "bg-emerald-500" : "bg-indigo-500")}
                                                            style={{ width: `${progressPercent}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Payments List if present */}
                                                {debt.payments && debt.payments.length > 0 && (
                                                    <div className="border-t border-zinc-200/50 dark:border-zinc-800/60 pt-4.5 space-y-2.5 mb-5">
                                                        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Historial de Abonos</p>
                                                        <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1.5 no-scrollbar">
                                                            {debt.payments.map(pay => (
                                                                <div key={pay.id} className="flex justify-between items-center text-[10px] bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-150/40 dark:border-zinc-800/40">
                                                                    <div>
                                                                        <span className="font-bold text-zinc-700 dark:text-zinc-350">@{pay.paidBy}</span>
                                                                        {pay.note && <span className="text-zinc-400 dark:text-zinc-500 font-medium ml-1.5 italic">({pay.note})</span>}
                                                                    </div>
                                                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-455">
                                                                        +{currency}{pay.amount.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bottom Action Button */}
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => setSelectedDebtForPay(debt)}
                                                        className="w-full py-2.5 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-xs font-black rounded-2xl transition-all border border-indigo-500/10 dark:border-indigo-500/20 active:scale-[0.98] uppercase tracking-widest cursor-pointer"
                                                    >
                                                        Registrar Abono
                                                    </button>
                                                )}
                                                {isPaid && (
                                                    <div className="w-full py-2.5 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-655 dark:text-emerald-455 text-xs font-black rounded-2xl border border-emerald-500/10 text-center uppercase tracking-widest select-none">
                                                        Totalmente Liquidado
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {(project.debts || []).length === 0 && (
                                        <div className="col-span-full text-center py-16 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center">
                                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl text-zinc-400 mb-3">
                                                <Coins size={28} strokeWidth={1.5} />
                                            </div>
                                            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed">
                                                No hay deudas ni créditos compartidos registrados para este proyecto.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ProjectDetails;
