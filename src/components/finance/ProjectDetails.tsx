import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { Project } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useProjects } from '../../hooks/useProjects';
import { useBalance } from '../../hooks/useBalance';
import { useTransactions } from '../../hooks/useTransactions';
import {
    X, PieChart, List, Settings,
    ArrowUpRight, ArrowDownRight, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProjectDetailsProps {
    project: Project;
    onClose: () => void;
}

const ProjectDetails = ({ project, onClose }: ProjectDetailsProps) => {
    const { currency } = useSettings();
    const { updateProject, deleteProject, addProjectTransaction, deleteProjectTransaction, getProjectStats } = useProjects();
    const { currentBalance } = useBalance();
    const { addTransaction } = useTransactions();
    const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'settings'>('overview');

    // Stats
    const stats = getProjectStats(project);

    // Form States
    const [txForm, setTxForm] = useState({
        amount: '',
        description: '',
        type: 'expense' as 'income' | 'expense'
    });
    const [showTxForm, setShowTxForm] = useState(false);

    const handleTxSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(txForm.amount);
        if (amount <= 0) return;

        if (txForm.type === 'income') {

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

        // 2. Add to Project Ledger
        addProjectTransaction(project.id, {
            amount,
            description: txForm.description,
            type: txForm.type,
            date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()
        });
        setTxForm({ amount: '', description: '', type: 'expense' });
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{project.name}</h2>
                            <span
                                onClick={cycleStatus}
                                className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border cursor-pointer hover:opacity-80 transition-opacity select-none", {
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
                        <p className="text-zinc-500 text-sm max-w-xl">{project.description || 'Sin descripción'}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
                    <button onClick={() => setActiveTab('overview')} className={clsx("py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'overview' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-500 hover:text-zinc-800")}>
                        <PieChart size={16} /> Resumen
                    </button>
                    <button onClick={() => setActiveTab('ledger')} className={clsx("py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'ledger' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-500 hover:text-zinc-800")}>
                        <List size={16} /> Movimientos
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={clsx("py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'settings' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-500 hover:text-zinc-800")}>
                        <Settings size={16} /> Configuración
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950/30">

                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Presupuesto Objetivo</p>
                                    <p className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">{currency}{project.targetBudget.toLocaleString()}</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Gastado</p>
                                    <p className="text-2xl font-mono font-bold text-rose-600">{currency}{stats.totalExpenses.toLocaleString()}</p>
                                    <div className="mt-2 text-xs text-zinc-400">
                                        {stats.percentConsumed.toFixed(1)}% del presupuesto
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Liquidez Disponible</p>
                                    <p className={clsx("text-2xl font-mono font-bold", stats.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                        {currency}{stats.currentBalance.toLocaleString()}
                                    </p>
                                    <div className="mt-2 text-xs text-zinc-400">
                                        Ingresos Totales: {currency}{stats.totalIncome.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Main Chart Area */}
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-64">
                                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4">Flujo de Caja Reciente</h3>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]}>
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
                    )}

                    {activeTab === 'ledger' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setTxForm(prev => ({ ...prev, type: 'income' })); setShowTxForm(true); }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ArrowDownRight size={18} /> Inyectar Fondos
                                </button>
                                <button
                                    onClick={() => { setTxForm(prev => ({ ...prev, type: 'expense' })); setShowTxForm(true); }}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ArrowUpRight size={18} /> Registrar Gasto
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
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
