import { useState } from 'react';
import { CalendarClock, History, Trash2, PlayCircle, PauseCircle, Pencil } from 'lucide-react';
import { useScheduledTransactions } from '../../../hooks/useScheduledTransactions';
import { useSettings } from '../../../context/SettingsContext'; // For currency
import Modal from '../../../components/ui/Modal';
import type { ScheduledTransaction } from '../../../types';

export const SettingsScheduled = () => {
    const { scheduled, toggleActive, deleteScheduled, updateScheduled } = useScheduledTransactions();
    const { currency } = useSettings();

    const [editingItem, setEditingItem] = useState<ScheduledTransaction | null>(null);
    const [editForm, setEditForm] = useState({ description: '', amount: '', category: '', dayOfMonth: 1, type: 'expense' });

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

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-6">
                <p className="text-sm text-zinc-500">
                    Las transacciones programadas se generan automáticamente el día seleccionado de cada mes.
                </p>
            </div>

            {scheduled.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-full mb-3">
                        <CalendarClock className="text-zinc-300 dark:text-zinc-600" size={32} />
                    </div>
                    <p className="text-zinc-500 font-medium">No hay reglas programadas</p>
                    <p className="text-zinc-400 text-sm mt-1">Crea una al añadir una nueva transacción.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {scheduled.map(item => (
                        <div key={item.id} className={`p-4 rounded-xl border transition-all hover:shadow-md ${!item.active ? 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800 opacity-60 grayscale'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                            } `}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            } `}>
                                            {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <History size={10} /> Día {item.dayOfMonth}
                                        </span>
                                    </div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.description || 'Sin descripción'}</p>
                                    <p className="text-sm text-zinc-500">{item.category} • {currency}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        title="Editar Regla"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteScheduled(item.id)}
                                        className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                        title="Eliminar Regla"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <span className="text-xs text-zinc-400">
                                    Última: {item.lastProcessedDate || 'Nunca'}
                                </span>
                                <button
                                    onClick={() => toggleActive(item.id, item.active)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.active
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                                        } `}
                                >
                                    {item.active ? (
                                        <> <PauseCircle size={14} /> Pausar </>
                                    ) : (
                                        <> <PlayCircle size={14} /> Activar </>
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
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4">
                            {(['expense', 'income'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setEditForm(prev => ({ ...prev, type }))}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${editForm.type === type
                                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                        }`}
                                >
                                    {type === 'expense' ? 'Gasto' : 'Ingreso'}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Descripción</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100"
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Monto ({currency})</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100"
                                    value={editForm.amount}
                                    onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Día del Mes</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="31"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100"
                                    value={editForm.dayOfMonth}
                                    onChange={e => setEditForm({ ...editForm, dayOfMonth: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Categoría</label>
                            <select
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-zinc-100"
                                value={editForm.category}
                                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                            >
                                <option value="Varios">Varios</option>
                                <option value="Hogar">Hogar</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Suscripciones">Suscripciones</option>
                                <option value="Salud">Salud</option>
                                <option value="Transporte">Transporte</option>
                                <option value="Comida">Comida</option>
                                <option value="Educación">Educación</option>
                                <option value="Ocio">Ocio</option>
                                <option value="Salario">Salario</option>
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
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
