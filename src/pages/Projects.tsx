import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../hooks/useProjects';
import { useSettings } from '../context/SettingsContext';
import { FolderKanban, Plus, Pencil, Trash2, Loader2, AlertTriangle, Sparkles, PlusCircle } from 'lucide-react';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const projectData = {
            name: formData.name,
            targetBudget: 0,
            description: formData.description
        };

        let success = false;
        if (editingProjectId) {
            success = await updateProject(editingProjectId, projectData);
        } else {
            success = await addProject(projectData);
        }

        setIsSubmitting(false);

        if (success) {
            setFormData({ name: '', description: '' });
            setShowForm(false);
            setEditingProjectId(null);
        }
    };

    const handleEdit = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setFormData({
            name: project.name,
            description: project.description || ''
        });
        setEditingProjectId(project.id);
        setShowForm(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setProjectToDelete(id);
    };

    const confirmDelete = async () => {
        if (projectToDelete) {
            setIsDeleting(true);
            await deleteProject(projectToDelete);
            setIsDeleting(false);
            setProjectToDelete(null);
        }
    };

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'planning': return 'text-zinc-400 bg-zinc-900 border-zinc-800';
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
        <div className="space-y-8 min-h-screen text-zinc-100">
            {/* Header Premium */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 sm:p-10 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Aurora effect */}
                <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[80%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 z-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                            <Sparkles size={14} /> Gestión Colaborativa
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-50 via-zinc-300 to-zinc-500 tracking-tight">
                            Cartera de Proyectos
                        </h1>
                        <p className="text-zinc-400 text-base max-w-lg">
                            Lleva el control de tus presupuestos compartidos y obras en curso. Asigna fondos internos o registra inyecciones de socios.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="group relative flex items-center justify-center gap-3 bg-zinc-100 hover:bg-white text-zinc-950 px-6 py-4 rounded-3xl font-black transition-all shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:-translate-y-1 active:translate-y-0 duration-300"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Nuevo Proyecto</span>
                    </button>
                </div>
            </div>

            <InvitationsList />

            {/* Create Project Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingProjectId ? 'Configurar Proyecto' : 'Iniciar Nuevo Proyecto'}
            >
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="space-y-4">
                        {/* Name Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                Nombre del Proyecto
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="Ej. Remodelación Cocina, Campaña 2026..."
                                className="w-full bg-zinc-950/40 border border-zinc-900 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-800 transition-all font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Description Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                                Propósito o Descripción
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Notas generales sobre el presupuesto o alcances de la obra..."
                                className="w-full bg-zinc-950/40 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-800 transition-all resize-none leading-relaxed"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 text-xs text-zinc-500 hover:text-zinc-350 font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-zinc-100 hover:bg-white text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : (editingProjectId ? <Pencil size={14} /> : <Plus size={14} />)}
                            <span>{isSubmitting ? 'Guardando...' : (editingProjectId ? 'Guardar' : 'Crear')}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Projects Grid */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                    }
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {projects.map(project => {
                        const stats = getProjectStats(project);

                        return (
                            <motion.div
                                layout
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                key={project.id}
                                onClick={() => setSelectedProject(project)}
                                className="group relative flex flex-col bg-zinc-900/30 backdrop-blur-xl border border-zinc-900 hover:border-zinc-800 rounded-[2rem] p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden"
                            >
                                {/* Glowing Center */}
                                <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full blur-[70px] opacity-10 bg-emerald-500 pointer-events-none transition-opacity duration-700 group-hover:opacity-20" />

                                <div className="relative z-10 flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all duration-300">
                                            <FolderKanban size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-zinc-100 text-lg leading-tight truncate w-[140px]" title={project.name}>{project.name}</h3>
                                            <span
                                                onClick={(e) => cycleStatus(e, project)}
                                                className={clsx("text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg border mt-1.5 inline-block transition-colors select-none", getStatusColor(project.status))}
                                                title="Clic para cambiar estado"
                                            >
                                                {project.status === 'planning' ? 'Planificación' :
                                                    project.status === 'active' ? 'En Curso' :
                                                        project.status === 'completed' ? 'Completado' :
                                                            project.status === 'paused' ? 'Pausado' : 'Cancelado'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleEdit(e, project)}
                                            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="p-2 bg-zinc-900 hover:bg-rose-950/45 text-zinc-400 hover:text-rose-500 border border-zinc-800 hover:border-rose-900/30 rounded-xl transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
                                        <div>
                                            <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Caja Disponible</p>
                                            <p className={clsx("font-mono font-black text-lg", stats.currentBalance >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {currency}{stats.currentBalance.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Gastado</p>
                                            <p className="font-mono font-bold text-zinc-400 text-lg">{currency}{stats.totalExpenses.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-500 font-bold text-[10px] uppercase">
                                                {stats.totalExpenses > 0 ? 'Ejecución del Presupuesto' : 'Financiamiento'}
                                            </span>
                                            <span className="font-mono font-bold text-[10px] text-zinc-300">
                                                {stats.totalExpenses > 0 ? stats.percentConsumed.toFixed(0) : stats.percentFunded.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                                            <div
                                                className={clsx("h-full transition-all duration-500 rounded-full",
                                                    (stats.totalExpenses > 0 ? stats.percentConsumed : stats.percentFunded) > 100 ? "bg-rose-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${Math.min((stats.totalExpenses > 0 ? stats.percentConsumed : stats.percentFunded), 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Empty State */}
                {projects.length === 0 && !showForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="col-span-full py-24 text-center border border-zinc-900 rounded-[2.5rem] bg-zinc-950/20 backdrop-blur-sm flex flex-col items-center"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/15 blur-3xl rounded-full" />
                            <div className="relative p-6 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-3xl">
                                <FolderKanban size={48} strokeWidth={1.2} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-300 mb-2">Sin proyectos activos</h3>
                        <p className="text-zinc-500 text-center max-w-sm px-6">
                            Comienza creando tu primer proyecto para gestionar capitales colaborativos y partidas presupuestarias independientes.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {/* Project Details Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <ProjectDetails
                        project={projects.find(p => p.id === selectedProject.id) || selectedProject}
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!projectToDelete}
                onClose={() => !isDeleting && setProjectToDelete(null)}
                title="Eliminar Proyecto"
                maxWidth="max-w-sm"
            >
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mb-1">
                        <AlertTriangle size={22} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-zinc-200">¿Proceder con la eliminación?</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Al eliminar esta cartera de proyectos, se limpiarán en cascada todas las inyecciones de capital del ledger wallet. Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full pt-3">
                        <button
                            onClick={() => setProjectToDelete(null)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-rose-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
                            <span>{isDeleting ? 'Eliminando' : 'Eliminar'}</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Projects;
