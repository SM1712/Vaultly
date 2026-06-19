import { useState } from 'react';
import { CalendarClock, History, Trash2, PlayCircle, PauseCircle, Pencil, Plus, Search, Sparkles, X } from 'lucide-react';
import { useScheduledTransactions } from '../../../hooks/useScheduledTransactions';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import Modal from '../../../components/ui/Modal';
import type { ScheduledTransaction } from '../../../types';
import { clsx } from 'clsx';

export const SettingsScheduled = () => {
    const { scheduled, addScheduled, toggleActive, deleteScheduled, updateScheduled } = useScheduledTransactions();
    const { currency } = useSettings();
    const { data } = useData();

    const [editingItem, setEditingItem] = useState<ScheduledTransaction | null>(null);
    const [editForm, setEditForm] = useState({ description: '', amount: '', category: '', dayOfMonth: 1, type: 'expense' });

    // Creation Form States
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        description: '',
        amount: '',
        category: '',
        dayOfMonth: new Date().getDate(),
        type: 'expense'
    });

    const [searchTerm, setSearchTerm] = useState('');

    const filteredScheduled = scheduled.filter(s =>
        (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = scheduled.filter(s => s.active).length;
    const inactiveCount = scheduled.length - activeCount;

    // Helper for next run date calculation
    const getNextRunDate = (dayOfMonth: number, active: boolean) => {
        if (!active) return 'Desactivado';
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth(); // 0-11
        
        if (today.getDate() >= dayOfMonth) {
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
        }
        const lastDay = new Date(year, month + 1, 0).getDate();
        const targetDay = Math.min(dayOfMonth, lastDay);
        
        const nextDate = new Date(year, month, targetDay);
        return nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Retrieve categories dynamically from user profile
    const getCategoriesForType = (type: string) => {
        if (type === 'income') {
            return data.categories?.income || ['Salario', 'Freelance', 'Inversiones', 'Otros'];
        }
        return data.categories?.expense || ['Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Vivienda', 'Otros'];
    };

    const openEdit = (item: ScheduledTransaction) => {
        setEditingItem(item);
        setEditForm({
            description: item.description,
            amount: item.amount.toString(),
            category: item.category,
            dayOfMonth: item.dayOfMonth,
            type: item.type
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        updateScheduled(editingItem.id, {
            description: editForm.description,
            amount: Number(editForm.amount),
            category: editForm.category,
            dayOfMonth: Number(editForm.dayOfMonth),
            type: editForm.type as 'income' | 'expense'
        });

        setEditingItem(null);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.description || !createForm.amount) return;

        // Auto-select first category if empty
        const defaultCat = getCategoriesForType(createForm.type)[0] || 'Otros';

        addScheduled({
            description: createForm.description,
            amount: Number(createForm.amount),
            category: createForm.category || defaultCat,
            dayOfMonth: Number(createForm.dayOfMonth),
            type: createForm.type as 'income' | 'expense'
        });

        // Reset Form
        setCreateForm({
            description: '',
            amount: '',
            category: '',
            dayOfMonth: new Date().getDate(),
            type: 'expense'
        });
        setShowCreateForm(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Control Card */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Reglas de Automatización</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-lg">
                        Los cobros recurrentes y los depósitos programados se generan automáticamente en el libro diario en el día configurado de cada mes.
                    </p>
                    <div className="flex gap-3 mt-3 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                        <span>Activas: <strong className="text-emerald-500 font-bold">{activeCount}</strong></span>
                        <span>•</span>
                        <span>Pausadas: <strong className="text-amber-500 font-bold">{inactiveCount}</strong></span>
                        <span>•</span>
                        <span>Total: <strong className="text-zinc-700 dark:text-zinc-300 font-bold">{scheduled.length}</strong></span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full xl:w-auto shrink-0">
                    {scheduled.length > 0 && (
                        <div className="relative w-full sm:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar regla..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-9 pr-4 py-2 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-colors font-medium shadow-inner"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setShowCreateForm(!showCreateForm);
                            // Initialize first category dynamically
                            const cats = getCategoriesForType(createForm.type);
                            setCreateForm(prev => ({ ...prev, category: cats[0] || 'Otros' }));
                        }}
                        className={clsx(
                            "flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md",
                            showCreateForm 
                                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-750 dark:text-zinc-250 shadow-none" 
                                : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-indigo-500/10 active:scale-95"
                        )}
                    >
                        {showCreateForm ? (
                            <>
                                <X size={14} strokeWidth={2.5} />
                                <span>Cancelar</span>
                            </>
                        ) : (
                            <>
                                <Plus size={14} strokeWidth={2.5} />
                                <span>Nueva Programación</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Creation Form Expandable Section */}
            {showCreateForm && (
                <div className="bg-indigo-500/[0.03] dark:bg-indigo-500/[0.01] rounded-[2rem] border border-dashed border-indigo-500/20 p-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-indigo-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500">Programar Nuevo Movimiento</h4>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-full sm:w-64">
                            {(['expense', 'income'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        const cats = getCategoriesForType(type);
                                        setCreateForm(prev => ({ ...prev, type, category: cats[0] || 'Otros' }));
                                    }}
                                    className={clsx(
                                        "flex-1 py-1.5 rounded-lg text-xs font-black uppercase transition-all tracking-wider",
                                        createForm.type === type
                                            ? "bg-white dark:bg-zinc-800 text-indigo-500 dark:text-indigo-400 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                    )}
                                >
                                    {type === 'expense' ? 'Gasto' : 'Ingreso'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 ml-1 block">Título / Concepto</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Mensualidad Gimnasio, Pago Hosting..."
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                    value={createForm.description}
                                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 ml-1 block">Monto ({currency})</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0.00"
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                        value={createForm.amount}
                                        onChange={e => setCreateForm({ ...createForm, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 ml-1 block">Día de Cobro</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        placeholder="1-31"
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-sm font-semibold text-zinc-900 dark:text-zinc-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                        value={createForm.dayOfMonth}
                                        onChange={e => setCreateForm({ ...createForm, dayOfMonth: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 ml-1 block">Categoría de Destino</label>
                                <select
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                    value={createForm.category}
                                    onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                                >
                                    {getCategoriesForType(createForm.type).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-500/10"
                                >
                                    Guardar Programación
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* List Section */}
            {filteredScheduled.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center bg-white/40 dark:bg-zinc-900/10 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl backdrop-blur-sm">
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-full mb-3">
                        <CalendarClock className="text-zinc-400 dark:text-zinc-650" size={32} />
                    </div>
                    <p className="text-zinc-500 font-bold">No se encontraron reglas programadas</p>
                    <p className="text-zinc-400 text-xs mt-1">
                        {scheduled.length === 0 
                            ? 'Crea tu primera programación para automatizar tus movimientos mensuales.' 
                            : 'Prueba a cambiar tu término de búsqueda.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredScheduled.map(item => (
                        <div 
                            key={item.id} 
                            className={clsx(
                                "p-4 rounded-3xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between backdrop-blur-sm relative overflow-hidden",
                                !item.active 
                                    ? "bg-zinc-100/40 dark:bg-zinc-900/10 border-zinc-200/40 dark:border-zinc-800/30 opacity-60 grayscale"
                                    : "bg-white/80 dark:bg-zinc-900/60 border-zinc-200/50 dark:border-zinc-800/85 hover:border-zinc-300 dark:hover:border-zinc-700"
                            )}
                        >
                            {/* Glass Reflections */}
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 dark:from-white/5 to-transparent pointer-events-none" />
                            <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full filter blur-xl opacity-10 pointer-events-none" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    {/* 3D Calendar Sheet Icon */}
                                    <div className={clsx(
                                        "flex flex-col items-center justify-center w-12 h-12 border rounded-2xl font-mono shrink-0 shadow-inner relative overflow-hidden",
                                        item.active 
                                            ? item.type === 'income' 
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-250 dark:border-zinc-700 text-zinc-500"
                                    )}>
                                        <span className="text-[7px] font-black uppercase tracking-widest opacity-60 leading-none pt-1">DÍA</span>
                                        <span className="text-xl font-black leading-none pb-0.5 mt-0.5">{item.dayOfMonth}</span>
                                    </div>

                                    <div className="text-left">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className={clsx(
                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                item.type === 'income' 
                                                    ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-450' 
                                                    : 'bg-rose-500/15 border-rose-500/20 text-rose-600 dark:text-rose-455'
                                            )}>
                                                {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                                            </span>
                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 text-zinc-400 dark:text-zinc-500">
                                                {item.category}
                                            </span>
                                        </div>
                                        <p className="font-bold text-sm text-zinc-850 dark:text-zinc-100">{item.description || 'Sin descripción'}</p>
                                        <p className={clsx(
                                            "text-base font-black font-mono tracking-tight mt-0.5",
                                            item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                        )}>
                                            {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                {/* Control Action Buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="p-1.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-xl transition-all"
                                        title="Editar Regla"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => deleteScheduled(item.id)}
                                        className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                                        title="Eliminar Regla"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Footer stats / execution */}
                            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] font-bold">
                                <div className="text-left text-zinc-400 flex flex-col gap-0.5">
                                    <span>Última: {item.lastProcessedDate || 'Nunca'}</span>
                                    <span className="text-indigo-500/80 dark:text-indigo-400/80 font-black">
                                        Próxima: {getNextRunDate(item.dayOfMonth, item.active)}
                                    </span>
                                </div>

                                <button
                                    onClick={() => toggleActive(item.id, item.active)}
                                    className={clsx(
                                        "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300",
                                        item.active
                                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                            : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20'
                                    )}
                                >
                                    {item.active ? (
                                        <>
                                            <PauseCircle size={12} />
                                            <span>Pausar</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle size={12} />
                                            <span>Activar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title="Editar Programación"
            >
                {editingItem && (
                    <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
                        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4">
                            {(['expense', 'income'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        const cats = getCategoriesForType(type);
                                        setEditForm(prev => ({ ...prev, type, category: cats[0] || 'Otros' }));
                                    }}
                                    className={clsx(
                                        "flex-1 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all",
                                        editForm.type === type
                                            ? "bg-white dark:bg-zinc-700 text-indigo-500 dark:text-indigo-400 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                    )}
                                >
                                    {type === 'expense' ? 'Gasto' : 'Ingreso'}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 block">Descripción</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 block">Monto ({currency})</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                    value={editForm.amount}
                                    onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 block">Día del Mes</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="31"
                                    className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                    value={editForm.dayOfMonth}
                                    onChange={e => setEditForm({ ...editForm, dayOfMonth: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase mb-1.5 block">Categoría</label>
                            <select
                                className="w-full bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                value={editForm.category}
                                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                            >
                                {getCategoriesForType(editForm.type).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-500/10"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};
