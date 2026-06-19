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

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'alphabetical' | 'amount' | 'category'>('alphabetical');

    const filteredPresets = presets
        .filter(p =>
            p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'alphabetical') {
                return a.label.localeCompare(b.label);
            }
            if (sortBy === 'amount') {
                const amtA = a.amount || 0;
                const amtB = b.amount || 0;
                return amtB - amtA;
            }
            if (sortBy === 'category') {
                return a.category.localeCompare(b.category);
            }
            return 0;
        });

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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 mb-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Mis Atajos ({filteredPresets.length} de {presets.length})
                </h4>
                <div className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Buscar atajo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 sm:w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs outline-none"
                    />
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs outline-none"
                    >
                        <option value="alphabetical">Nombre (A-Z)</option>
                        <option value="amount">Monto (Mayor)</option>
                        <option value="category">Categoría</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPresets.map(p => (
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
                {filteredPresets.length === 0 && (
                    <div className="col-span-full text-center py-6 text-zinc-400 text-sm border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                        <Zap className="mx-auto mb-2 opacity-50" />
                        No se encontraron atajos.
                    </div>
                )}
            </div>
        </div>
    );
};
