import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useSettings } from '../context/SettingsContext';
import { FolderKanban, Plus, Pencil, Trash2, Target, Calendar } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { clsx } from 'clsx';
import ProjectDetails from '../components/finance/ProjectDetails';
import type { Project } from '../types';
import InvitationsList from '../components/collaboration/InvitationsList';

const Projects = () => {
    const { projects, addProject, updateProject, deleteProject, getProjectStats } = useProjects();
    const { currency } = useSettings();
    const [showForm, setShowForm] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        targetBudget: '',
        deadline: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const projectData = {
            name: formData.name,
            targetBudget: Number(formData.targetBudget),
            deadline: formData.deadline,
            description: formData.description,
            tasks: [],
            budgetLines: [],
            milestones: []
        };

        if (editingProjectId) {
            updateProject(editingProjectId, projectData);
        } else {
            addProject(projectData);
        }

        setFormData({ name: '', targetBudget: '', deadline: '', description: '' });
        setShowForm(false);
        setEditingProjectId(null);
    };

    const handleEdit = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setFormData({
            name: project.name,
            targetBudget: project.targetBudget.toString(),
            deadline: project.deadline || '',
            description: project.description || ''
        });
        setEditingProjectId(project.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán también sus transacciones.')) {
            deleteProject(id);
        }
    };

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'planning': return 'text-zinc-500 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700';
            case 'active': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'completed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'paused': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'cancelled': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            default: return 'text-zinc-500';
        }
    };

    const cycleStatus = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
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
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Cartera de Proyectos</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Gestión avanzada de presupuestos y obras</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus size={18} />
                    <span>Nuevo Proyecto</span>
                </button>
            </div>



            <InvitationsList />

            {/* Create Project Wizard (Simplified) */}
            {/* Create Project Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingProjectId ? 'Editar Proyecto' : 'Iniciar Nuevo Proyecto'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <FolderKanban size={14} /> Nombre del Proyecto
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="Ej. Remodelación Cocina, Viaje 2026..."
                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-lg"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Budget Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Target size={14} /> Presupuesto Objetivo
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{currency}</span>
                                    <input
                                        required
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono font-bold"
                                        value={formData.targetBudget}
                                        onChange={e => setFormData({ ...formData, targetBudget: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Deadline Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar size={14} /> Fecha Límite
                                </label>
                                <input
                                    type="date"
                                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Description Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <Pencil size={14} /> Descripción
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Breve descripción de la obra, objetivos o notas importantes..."
                                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none text-sm"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            {editingProjectId ? <Pencil size={18} /> : <Plus size={18} />}
                            {editingProjectId ? 'Guardar Cambios' : 'Crear Proyecto'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => {
                    const stats = getProjectStats(project);

                    return (
                        <div
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm dark:shadow-none transition-all hover:border-emerald-500/50 hover:shadow-md cursor-pointer group relative overflow-hidden"
                        >
                            {/* Card Content */}
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-900/30 dark:group-hover:text-emerald-400 transition-colors">
                                            <FolderKanban size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg leading-tight">{project.name}</h3>
                                            <span
                                                onClick={(e) => cycleStatus(e, project)}
                                                className={clsx("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border mt-1 inline-block cursor-pointer hover:opacity-80 transition-opacity select-none", getStatusColor(project.status))}
                                                title="Clic para cambiar estado"
                                            >
                                                {project.status === 'planning' ? 'Planificación' :
                                                    project.status === 'active' ? 'En Curso' :
                                                        project.status === 'completed' ? 'Completado' :
                                                            project.status === 'paused' ? 'Pausado' : 'Cancelado'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleEdit(e, project)}
                                            className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 py-2">
                                    <div>
                                        <p className="text-[10px] uppercase text-zinc-500 mb-0.5">Balance</p>
                                        <p className={clsx("font-mono font-bold text-lg", stats.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                            {currency}{stats.currentBalance.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-zinc-500 mb-0.5">Ejecutado</p>
                                        <p className="font-mono font-bold text-zinc-500 text-lg">{currency}{stats.totalExpenses.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-zinc-500">
                                            {stats.totalExpenses > 0 ? 'Presupuesto Ejecutado' : 'Fondos vs Objetivo'}
                                        </span>
                                        <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                            {stats.totalExpenses > 0 ? stats.percentConsumed.toFixed(0) : stats.percentFunded.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={clsx("h-full transition-all duration-500",
                                                (stats.totalExpenses > 0 ? stats.percentConsumed : stats.percentFunded) > 100 ? "bg-rose-500" :
                                                    (stats.totalExpenses > 0 ? stats.percentConsumed : stats.percentFunded) > 80 ? "bg-emerald-500" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${Math.min((stats.totalExpenses > 0 ? stats.percentConsumed : stats.percentFunded), 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {projects.length === 0 && !showForm && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                        <div className="inline-flex p-4 bg-white dark:bg-zinc-900 rounded-full text-zinc-400 mb-4 shadow-sm">
                            <FolderKanban size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin Proyectos Activos</h3>
                        <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
                            Comienza creando tu primer proyecto para llevar un control financiero detallado y separado de tu flujo principal.
                        </p>
                    </div>
                )}
            </div>

            {/* Project Details Modal */}
            {
                selectedProject && (
                    <ProjectDetails
                        project={projects.find(p => p.id === selectedProject.id) || selectedProject}
                        onClose={() => setSelectedProject(null)}
                    />
                )
            }
        </div >
    );
};

export default Projects;
