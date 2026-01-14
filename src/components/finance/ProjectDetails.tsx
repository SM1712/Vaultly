import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { Project } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useProjects } from '../../hooks/useProjects';
import { useBalance } from '../../hooks/useBalance';
import { useTransactions } from '../../hooks/useTransactions';
import {
    X, PieChart, List, Settings,
    ArrowUpRight, ArrowDownRight, Trash2, CheckSquare, PlusCircle, LayoutDashboard, Flag, Users,
    Search, Loader2, User
} from 'lucide-react';
import { useCollaboration } from '../../context/CollaborationContext';
import { clsx } from 'clsx';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, YAxis } from 'recharts';

interface ProjectDetailsProps {
    project: Project;
    onClose: () => void;
}

const ProjectDetails = ({ project, onClose }: ProjectDetailsProps) => {
    const { currency } = useSettings();
    const {
        updateProject, deleteProject,
        addProjectTransaction, deleteProjectTransaction, getProjectStats,
        addProjectTask, toggleProjectTask, deleteProjectTask,
        addBudgetLine, deleteBudgetLine,
        addMilestone, toggleMilestone, deleteMilestone
    } = useProjects();
    const { searchUserByNickname, sendProjectInvitation } = useCollaboration();
    const [inviteNick, setInviteNick] = useState('');
    const [foundUser, setFoundUser] = useState<any>(null);
    const [searchingUser, setSearchingUser] = useState(false);
    const { currentBalance } = useBalance();
    const { addTransaction } = useTransactions();
    const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'ledger' | 'tasks' | 'milestones' | 'settings' | 'members'>('overview');

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



    const handleSearchUser = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inviteNick.trim()) return;
        setSearchingUser(true);
        try {
            const user = await searchUserByNickname(inviteNick);
            setFoundUser(user);
            if (!user) toast.error("Usuario no encontrado");
        } catch (error) {
            console.error(error);
        } finally {
            setSearchingUser(false);
        }
    };

    const handleInvite = async () => {
        if (!foundUser) return;
        await sendProjectInvitation(project.id, project.name, foundUser.nickname);
        setInviteNick('');
        setFoundUser(null);
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
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Height changed from max-h to h to prevent jumping */}
            <div className="bg-white/95 dark:bg-zinc-950/95 w-full max-w-5xl h-[85vh] md:h-[90vh] rounded-[2rem] shadow-2xl flex flex-col border border-white/20 dark:border-zinc-800 overflow-hidden backdrop-blur-xl transition-all">

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
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/50 pb-20 md:pb-8">

                    {activeTab === 'overview' && (
                        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        </div>
                    )}

                    {/* Mobile Bottom Navigation */}
                    <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-safe pt-1 px-4 z-50 flex justify-between items-center h-[70px] shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)]">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Inicio' },
                            { id: 'budget', icon: PieChart, label: 'Fondos' },
                            { id: 'ledger', icon: List, label: 'Lista' },
                            { id: 'tasks', icon: CheckSquare, label: 'Tareas' },
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

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
                        </div>
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
                                    <input
                                        type="date"
                                        className="flex-1 md:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-emerald-500/50 text-zinc-500"
                                        value={newMilestone.targetDate}
                                        onChange={e => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                                    />
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
                        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-8">
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
                        </div>
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pt-2">
                            {/* Invite Section */}
                            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-emerald-500" />
                                    Invitar Colaboradores
                                </h3>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Buscar usuario por nickname (ej. sebastian)"
                                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 ring-emerald-500/50"
                                            value={inviteNick}
                                            onChange={(e) => setInviteNick(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    </div>
                                    <button
                                        onClick={handleSearchUser}
                                        disabled={searchingUser || !inviteNick.trim()}
                                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 rounded-xl font-bold disabled:opacity-50 hover:bg-zinc-800 transition-colors"
                                    >
                                        {searchingUser ? <Loader2 className="animate-spin" /> : 'Buscar'}
                                    </button>
                                </div>

                                {/* Search Result */}
                                {foundUser && (
                                    <div className="mt-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                                {foundUser.nickname.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100">{foundUser.nickname}</p>
                                                <p className="text-xs text-zinc-500">Usuario registrado</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleInvite}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-emerald-900/20"
                                        >
                                            Enviar Invitación
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Current Members List (Placeholder for now) */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    Equipo del Proyecto <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">1</span>
                                </h3>

                                {/* Owner Card */}
                                <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-900 dark:text-zinc-100">Tú (Propietario)</p>
                                            <p className="text-xs text-zinc-500">Acceso total</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1 rounded-full">Owner</span>
                                </div>

                                {/* Pending implementation of real members list */}
                                <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                    <p className="text-sm text-zinc-400">Cuando acepten tus invitaciones, aparecerán aquí.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
