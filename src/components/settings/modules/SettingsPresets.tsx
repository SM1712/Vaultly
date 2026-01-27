import { useState } from 'react';
import { Plus, Zap, Trash2 } from 'lucide-react';
import { usePresets } from '../../../hooks/usePresets';
import { useCategories } from '../../../hooks/useCategories';
import { useSettings } from '../../../context/SettingsContext';

export const SettingsPresets = () => {
    const { presets, addPreset, deletePreset } = usePresets();
    const { categories: incomeCats } = useCategories('income');
    const { categories: expenseCats } = useCategories('expense');
    const { currency } = useSettings();

    const [newPresetLabel, setNewPresetLabel] = useState('');
    const [newPresetAmount, setNewPresetAmount] = useState('');
    const [newPresetCategory, setNewPresetCategory] = useState('');
    const [newPresetType, setNewPresetType] = useState<'income' | 'expense'>('expense');

    return (
        <div className="space-y-6 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary uppercase tracking-wider">
                    <Plus size={16} /> Crear Atajo Rápido
                </h4>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nombre (ej. Café Diario)"
                            className="flex-[2] min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={newPresetLabel}
                            onChange={e => setNewPresetLabel(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Monto"
                            className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={newPresetAmount}
                            onChange={e => setNewPresetAmount(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={newPresetType}
                            onChange={e => {
                                setNewPresetType(e.target.value as any);
                                setNewPresetCategory('');
                            }}
                        >
                            <option value="expense">Gasto</option>
                            <option value="income">Ingreso</option>
                        </select>
                        <select
                            className="flex-[2] min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            value={newPresetCategory}
                            onChange={e => setNewPresetCategory(e.target.value)}
                        >
                            <option value="">Categoría...</option>
                            {(newPresetType === 'expense' ? expenseCats : incomeCats).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        disabled={!newPresetLabel || !newPresetCategory}
                        onClick={() => {
                            addPreset({
                                label: newPresetLabel,
                                amount: newPresetAmount ? Number(newPresetAmount) : undefined,
                                category: newPresetCategory,
                                type: newPresetType
                            });
                            setNewPresetLabel('');
                            setNewPresetAmount('');
                        }}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity mt-2 shadow-sm"
                    >
                        Guardar Botón
                    </button>
                </div>
            </div>

            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-6 mb-2">Mis Atajos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map(p => (
                    <div key={p.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between group relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                        <div>
                            <p className="font-bold text-sm truncate">{p.label}</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                {p.amount ? `${currency}${p.amount} ` : 'Var'} • <span className="text-zinc-400">{p.category}</span>
                            </p>
                        </div>
                        <button
                            className="p-2 text-zinc-300 hover:text-rose-500 transition-colors"
                            onClick={() => deletePreset(p.id)}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {presets.length === 0 && (
                    <div className="col-span-full text-center py-6 text-zinc-400 text-sm border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                        <Zap className="mx-auto mb-2 opacity-50" />
                        No hay atajos configurados aún.
                    </div>
                )}
            </div>
        </div>
    );
};
