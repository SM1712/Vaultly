import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCategories } from '../../../hooks/useCategories';
import { useTransactions } from '../../../hooks/useTransactions';

export const SettingsCategories = () => {
    const { categories: incomeCats, addCategory: addIncomeCat, removeCategory: removeIncomeCat } = useCategories('income');
    const { categories: expenseCats, addCategory: addExpenseCat, removeCategory: removeExpenseCat } = useCategories('expense');
    const { updateCategory } = useTransactions();

    const [catType, setCatType] = useState<'income' | 'expense'>('expense');
    const [newCatName, setNewCatName] = useState('');

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;
        if (catType === 'income') addIncomeCat(newCatName);
        else addExpenseCat(newCatName);
        setNewCatName('');
    };

    const handleDeleteCategory = (category: string) => {
        if (confirm(`¿Eliminar categoría "${category}"? Las transacciones pasarán a "Desconocido".`)) {
            if (catType === 'income') removeIncomeCat(category);
            else removeExpenseCat(category);
            updateCategory(category, 'Desconocido');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl mb-4">
                <button
                    onClick={() => setCatType('expense')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${catType === 'expense'
                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        } `}
                >
                    Gastos
                </button>
                <button
                    onClick={() => setCatType('income')}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${catType === 'income'
                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        } `}
                >
                    Ingresos
                </button>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder={`Nueva categoría de ${catType === 'income' ? 'ingreso' : 'gasto'}...`}
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                    onClick={handleAddCategory}
                    className="p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(catType === 'income' ? incomeCats : expenseCats).map(cat => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 group transition-all">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat}</span>
                        <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm"
                            title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
