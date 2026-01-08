import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import { useScheduledTransactions } from '../../hooks/useScheduledTransactions';
import { usePresets } from '../../hooks/usePresets';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, LogOut, User, CalendarClock, PlayCircle, PauseCircle, MousePointerClick } from 'lucide-react';


interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsMenu = ({ isOpen, onClose }: SettingsMenuProps) => {
    const { currency, setCurrency } = useSettings();
    const { themeStyle, setThemeStyle } = useTheme();
    const { logout, user } = useAuth();
    const { categories: incomeCats, addCategory: addIncomeCat, removeCategory: removeIncomeCat } = useCategories('income');
    const { categories: expenseCats, addCategory: addExpenseCat, removeCategory: removeExpenseCat } = useCategories('expense');
    const { updateCategory } = useTransactions();
    const { scheduled, toggleActive, deleteScheduled } = useScheduledTransactions();
    const { presets, addPreset, deletePreset } = usePresets();

    const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'scheduled' | 'presets'>('general');
    const [catType, setCatType] = useState<'income' | 'expense'>('expense');
    const [newCatName, setNewCatName] = useState('');

    // New Preset State
    const [newPresetLabel, setNewPresetLabel] = useState('');
    const [newPresetAmount, setNewPresetAmount] = useState('');
    const [newPresetCategory, setNewPresetCategory] = useState('');
    const [newPresetType, setNewPresetType] = useState<'income' | 'expense'>('expense');

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
            <div className="flex flex-col h-[55vh] md:h-[500px] max-h-[70vh]">
                <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-4 overflow-x-auto shrink-0">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'general'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'categories'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        Categorías
                    </button>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'scheduled'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        Programados
                    </button>
                    <button
                        onClick={() => setActiveTab('presets')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'presets'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                    >
                        Atajos
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            {/* Account Section */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                                    <User size={16} />
                                    Cuenta
                                </label>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                                    {user && (
                                        <div className="flex items-center gap-4 mb-4">
                                            <img
                                                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                                                alt="User"
                                                className="w-12 h-12 rounded-full bg-zinc-800"
                                            />
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user.displayName}</p>
                                                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            logout();
                                            onClose();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all font-medium text-sm"
                                    >
                                        <LogOut size={16} />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>

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

                            {/* Theme Style Selector */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">Estilo Visual</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'classic', name: 'Clásico', color: 'bg-stone-500' },
                                        { id: 'sepia', name: 'Sepia (Eye Care)', color: 'bg-orange-500' },
                                        { id: 'ocean', name: 'Océano', color: 'bg-slate-500' },
                                        { id: 'midnight', name: 'Medianoche', color: 'bg-indigo-500' },
                                        { id: 'bloom', name: 'Bloom Flower', color: 'bg-rose-500' },
                                        { id: 'royal', name: 'Royal Purple', color: 'bg-purple-500' },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setThemeStyle(style.id as any)} // setThemeStyle comes from custom hook
                                            className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${themeStyle === style.id
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500'
                                                : 'border-transparent bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${style.color}`} />
                                            <span className={`text-sm font-medium ${themeStyle === style.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                {style.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
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

                    {activeTab === 'scheduled' && (
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Gestiona tus ingresos y gastos recurrentes automáticos.
                            </p>

                            {scheduled.length === 0 ? (
                                <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                    <CalendarClock className="mx-auto text-zinc-400 mb-2" size={32} />
                                    <p className="text-sm text-zinc-500 font-medium">No hay reglas programadas</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {scheduled.map(item => (
                                        <div key={item.id} className={`p-4 rounded-xl border transition-all ${!item.active ? 'bg-zinc-100 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 opacity-70'
                                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                                            }`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                            }`}>
                                                            {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                        </span>
                                                        <span className="text-xs text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                                            Día {item.dayOfMonth}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.description || 'Sin descripción'}</p>
                                                    <p className="text-sm text-zinc-500">{item.category} • {currency}{item.amount.toFixed(2)}</p>
                                                </div>
                                                <button
                                                    onClick={() => deleteScheduled(item.id)}
                                                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    title="Eliminar regla permanentemente"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                                <span className="text-xs text-zinc-400">
                                                    {item.lastProcessedDate ? `Última vez: ${item.lastProcessedDate}` : 'Nunca ejecutado'}
                                                </span>
                                                <button
                                                    onClick={() => toggleActive(item.id, item.active)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.active
                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        }`}
                                                >
                                                    {item.active ? (
                                                        <>
                                                            <PauseCircle size={14} /> Pausar
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlayCircle size={14} /> Reactivar
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'presets' && (
                        <div className="space-y-4 pb-2">
                            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-zinc-500 uppercase tracking-wider">
                                    <Plus size={14} /> Nuevo Atajo
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nombre (ej. Café)"
                                            className="flex-[2] min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            value={newPresetLabel}
                                            onChange={e => setNewPresetLabel(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Monto"
                                            className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            value={newPresetAmount}
                                            onChange={e => setNewPresetAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none bg-no-repeat"
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
                                            className="flex-[2] min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                                            // Keep category/type for speed
                                        }}
                                        className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
                                    >
                                        Agregar Botón
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {presets.map(p => (
                                    <div key={p.id} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between group relative overflow-hidden">
                                        <div>
                                            <p className="font-bold text-sm truncate">{p.label}</p>
                                            <p className="text-xs text-zinc-500">
                                                {p.amount ? `${currency}${p.amount}` : '-'} • {p.category}
                                            </p>
                                        </div>
                                        <div className={`absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 translate-x-full group-hover:translate-x-0 transition-transform cursor-pointer`}
                                            onClick={() => deletePreset(p.id)}
                                        >
                                            <Trash2 size={16} className="text-rose-500" />
                                        </div>
                                    </div>
                                ))}
                                {presets.length === 0 && (
                                    <div className="col-span-2 text-center py-6 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <MousePointerClick className="mx-auto mb-2 opacity-50" />
                                        Crea botones rápidos para tus gastos frecuentes
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SettingsMenu;
