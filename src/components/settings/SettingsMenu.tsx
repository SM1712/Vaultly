import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import Modal from '../ui/Modal';
import { Trash2, Plus } from 'lucide-react';

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsMenu = ({ isOpen, onClose }: SettingsMenuProps) => {
    const { currency, setCurrency } = useSettings();
    const { categories: incomeCats, addCategory: addIncomeCat, removeCategory: removeIncomeCat } = useCategories('income');
    const { categories: expenseCats, addCategory: addExpenseCat, removeCategory: removeExpenseCat } = useCategories('expense');
    const { updateCategory } = useTransactions();

    const [activeTab, setActiveTab] = useState<'general' | 'categories'>('general');
    const [catType, setCatType] = useState<'income' | 'expense'>('expense');
    const [newCatName, setNewCatName] = useState('');

    const currencies = ['$', '€', '£', '¥', 'COP', 'MXN', 'ARS', 'S/'];

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

            // Migrate transactions
            updateCategory(category, 'Desconocido');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuración">
            <div className="flex flex-col h-[60vh]">
                <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'general'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'categories'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        Categorías
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                    {activeTab === 'general' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">Moneda Principal</label>
                                <div className="flex gap-2 flex-wrap">
                                    {currencies.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setCurrency(c)}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold transition-all ${currency === c
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg mb-4">
                                <button
                                    onClick={() => setCatType('expense')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${catType === 'expense'
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    Gastos
                                </button>
                                <button
                                    onClick={() => setCatType('income')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${catType === 'income'
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    Ingresos
                                </button>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Nueva categoría..."
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                />
                                <button
                                    onClick={handleAddCategory}
                                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {(catType === 'income' ? incomeCats : expenseCats).map(cat => (
                                    <div key={cat} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 group transition-colors">
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{cat}</span>
                                        <button
                                            onClick={() => handleDeleteCategory(cat)}
                                            className="text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                            title="Eliminar y mover gastos a 'Desconocido'"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SettingsMenu;
