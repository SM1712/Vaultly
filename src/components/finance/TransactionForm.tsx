import { useState } from 'react';
import type { TransactionType } from '../../types';
import { PlusCircle, Save } from 'lucide-react';
import { clsx } from 'clsx';

interface TransactionFormProps {
    type: TransactionType;
    onSubmit: (data: any) => void;
    categories: string[];
    onAddCategory: (category: string) => void;
}

const TransactionForm = ({ type, onSubmit, categories, onAddCategory }: TransactionFormProps) => {
    const [formData, setFormData] = useState({
        amount: '',
        category: categories[0] || '',
        description: '',
        date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
        isRecurring: false
    });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            amount: Number(formData.amount),
            type,
            category: formData.category,
            description: formData.description,
            date: formData.date,
            isRecurring: formData.isRecurring
        });
        setFormData({ ...formData, amount: '', description: '' });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <PlusCircle size={18} />
                Registrar {type === 'income' ? 'Ingreso' : 'Gasto'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Monto</label>
                    <input
                        type="number"
                        required
                        step="0.01"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Categoría</label>
                    <div className="flex gap-2">
                        {isAddingCategory ? (
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Nueva categoría..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newCategory.trim()) {
                                            onAddCategory(newCategory.trim());
                                            setFormData({ ...formData, category: newCategory.trim() });
                                            setIsAddingCategory(false);
                                            setNewCategory('');
                                        }
                                    }}
                                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    <Save size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="p-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <>
                                <select
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="px-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xl font-bold"
                                    title="Nueva Categoría"
                                >
                                    +
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Descripción</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalle..."
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Fecha</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isRecurring"
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 bg-zinc-50 dark:bg-zinc-950"
                    checked={formData.isRecurring}
                    onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                <label htmlFor="isRecurring" className="text-sm text-zinc-600 dark:text-zinc-400 select-none cursor-pointer">
                    Marcar como {type === 'income' ? 'Ingreso Fijo' : 'Gasto Fijo'} (Mensual)
                </label>
            </div>

            <button
                type="submit"
                className={clsx(
                    "w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                    type === 'income'
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                )}
            >
                <Save size={18} />
                Guardar Transacción
            </button>
        </form>
    );
};

export default TransactionForm;
