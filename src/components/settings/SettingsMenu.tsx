import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useCategories } from '../../hooks/useCategories';
import { useTransactions } from '../../hooks/useTransactions';
import { useScheduledTransactions } from '../../hooks/useScheduledTransactions';
import { usePresets } from '../../hooks/usePresets';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { toast } from 'sonner';
import { Trash2, Plus, LogOut, User, CalendarClock, PlayCircle, PauseCircle, MousePointerClick, Database, Download, Upload, Bomb, Radiation, RefreshCw, Siren } from 'lucide-react';


interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsMenu = ({ isOpen, onClose }: SettingsMenuProps) => {
    const { currency, setCurrency } = useSettings();
    const { themeStyle, setThemeStyle } = useTheme();
    const { logout, user } = useAuth();
    const { data: appData } = useData();
    const { categories: incomeCats, addCategory: addIncomeCat, removeCategory: removeIncomeCat } = useCategories('income');
    const { categories: expenseCats, addCategory: addExpenseCat, removeCategory: removeExpenseCat } = useCategories('expense');
    const { updateCategory } = useTransactions();
    const { scheduled, toggleActive, deleteScheduled } = useScheduledTransactions();
    const { presets, addPreset, deletePreset } = usePresets();

    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'categories' | 'scheduled' | 'presets' | 'data'>('general');
    const [catType, setCatType] = useState<'income' | 'expense'>('expense');
    const [newCatName, setNewCatName] = useState('');

    // New Preset State
    const [newPresetLabel, setNewPresetLabel] = useState('');
    const [newPresetAmount, setNewPresetAmount] = useState('');
    const [newPresetCategory, setNewPresetCategory] = useState('');
    const [newPresetType, setNewPresetType] = useState<'income' | 'expense'>('expense');

    // Theme Definitions
    const themes = [
        { id: 'classic', name: 'Clásico', color: 'bg-[#a8a29e]' }, // stone-400
        { id: 'clay', name: 'Arcilla', color: 'bg-[#fb923c]' }, // orange-400
        { id: 'sand', name: 'Arena', color: 'bg-[#d6b885]' }, // custom sand
        { id: 'coffee', name: 'Café', color: 'bg-[#b97f6a]' }, // custom coffee
        { id: 'sage', name: 'Salvia', color: 'bg-[#64ad84]' }, // custom sage
        { id: 'nordic', name: 'Nórdico', color: 'bg-[#0ea5e9]' }, // sky-500
        { id: 'mist', name: 'Niebla', color: 'bg-[#94a3b8]' }, // slate-400
        { id: 'royal', name: 'Royal', color: 'bg-[#a78bfa]' }, // violet-400
        { id: 'bloom', name: 'Bloom', color: 'bg-[#fb7185]' }, // rose-400
    ];

    // Nuclear & Update State
    const [showNuclearModal, setShowNuclearModal] = useState(false);
    const [nuclearCode, setNuclearCode] = useState(['', '', '', '']);
    const [isDetonating, setIsDetonating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');
    const { resetData } = useData();

    // Helper for nuclear code input
    const handleNuclearInput = (index: number, value: string) => {
        if (value.length > 1) value = value[value.length - 1]; // Take last char
        if (!/^\d*$/.test(value)) return; // Only numbers

        const newCode = [...nuclearCode];
        newCode[index] = value;
        setNuclearCode(newCode);

        // Auto-focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`nuclear-digit-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleDetonate = async () => {
        if (nuclearCode.join('').length !== 4) {
            toast.error("CÓDIGO DE LANZAMIENTO INCOMPLETO");
            return;
        }

        setIsDetonating(true);
        // Dramatic delay
        await new Promise(r => setTimeout(r, 2000));

        await resetData();
        setIsDetonating(false);
        setShowNuclearModal(false);
        setNuclearCode(['', '', '', '']);
        onClose();
    };

    const handleSystemUpdate = async () => {
        setIsUpdating(true);
        setUpdateStatus('INICIANDO ENLACE SATELITAL...');

        await new Promise(r => setTimeout(r, 1500));
        setUpdateStatus('BUSCANDO PAQUETES DE DATOS...');

        await new Promise(r => setTimeout(r, 1500));
        setUpdateStatus('OPTIMIZANDO NÚCLEO...');

        await new Promise(r => setTimeout(r, 1000));
        setUpdateStatus('SISTEMA ACTUALIZADO. REINICIANDO.');

        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const currencies = ['$', '€', '£', '¥', 'COP', 'MXN', 'ARS', 'S/'];

    const handleExport = () => {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(appData)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `vault_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast.success("Copia de seguridad descargada");
    };



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
                            ? 'text-zinc-900 dark:text-zinc-100 border-zinc-800 dark:border-zinc-100'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'appearance'
                            ? 'text-zinc-900 dark:text-zinc-100 border-zinc-800 dark:border-zinc-100'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                    >
                        Apariencia
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'categories'
                            ? 'text-zinc-900 dark:text-zinc-100 border-zinc-800 dark:border-zinc-100'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                    >
                        Categorías
                    </button>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'scheduled'
                            ? 'text-zinc-900 dark:text-zinc-100 border-zinc-800 dark:border-zinc-100'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                    >
                        Programados
                    </button>
                    <button
                        onClick={() => setActiveTab('presets')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'presets'
                            ? 'text-zinc-900 dark:text-zinc-100 border-zinc-800 dark:border-zinc-100'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                    >
                        Atajos
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'data'
                            ? 'text-zinc-900 dark:text-zinc-100 border-zinc-800 dark:border-zinc-100'
                            : 'text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                    >
                        Datos
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 no-scrollbar">
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

                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-8">
                            {/* Visual Style Selector */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Tema de Color</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {themes.map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => setThemeStyle(style.id as any)}
                                            className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${themeStyle === style.id
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 ring-1 ring-emerald-500'
                                                : 'border-transparent bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${style.color} shadow-sm`} />
                                            <span className={`text-sm font-medium ${themeStyle === style.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                {style.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Moneda Principal</label>
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

                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30">
                                <h4 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
                                    <Database size={18} /> Zona de Peligro Nuclear
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-500/80 mb-4">
                                    Descarga tu "Master Doc" para tener una copia de seguridad física o cárgalo para restaurar tus finanzas.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <button
                                    onClick={handleExport}
                                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Download size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-zinc-900 dark:text-zinc-100">Exportar Datos</p>
                                            <p className="text-xs text-zinc-500">Descargar backup .json</p>
                                        </div>
                                    </div>
                                </button>

                                <label className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <Upload size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-zinc-900 dark:text-zinc-100">Restaurar Datos</p>
                                            <p className="text-xs text-zinc-500">Sobrescribir desde .json</p>
                                        </div>
                                    </div>
                                </label>

                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                                    {/* System Update Button */}
                                    <button
                                        onClick={handleSystemUpdate}
                                        disabled={isUpdating}
                                        className="w-full flex items-center justify-between p-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-xl hover:opacity-90 disabled:opacity-70 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full bg-zinc-800 dark:bg-zinc-200 ${isUpdating ? 'animate-spin' : ''}`}>
                                                <RefreshCw size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-sm">{isUpdating ? updateStatus : 'Buscar Actualizaciones'}</p>
                                                <p className="text-xs opacity-70">Forzar sincronización PWA</p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Nuclear Option */}
                                    <button
                                        onClick={() => setShowNuclearModal(true)}
                                        className="group w-full relative overflow-hidden flex items-center justify-between p-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all shadow-lg hover:shadow-rose-500/40 hover:scale-[1.02]"
                                    >
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#00000010_10px,#00000010_20px)]" />

                                        <div className="relative flex items-center gap-3 z-10">
                                            <div className="p-2 rounded-full bg-rose-700 animate-[pulse_1.5s_ease-in-out_infinite]">
                                                <Bomb size={24} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold font-mono tracking-wider">OPCIÓN NUCLEAR</p>
                                                <p className="text-xs opacity-90 font-mono">BORRADO TOTAL DE DATOS</p>
                                            </div>
                                        </div>
                                        <Radiation className="relative z-10 opacity-50 group-hover:rotate-180 transition-transform duration-700" size={32} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nuclear Launch Modal */}
            {showNuclearModal && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 backdrop-blur-sm rounded-2xl">
                    <div className="w-full max-w-sm space-y-6 text-center">
                        <div className="animate-[bounce_1s_infinite]">
                            <Siren size={64} className="text-rose-500 mx-auto" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-black text-rose-500 font-mono tracking-widest mb-2">¡PELIGRO!</h3>
                            <p className="text-zinc-400 text-sm font-mono leading-relaxed">
                                ESTA ACCIÓN ES IRREVERSIBLE.<br />
                                SE ELIMINARÁN TODAS LAS TRANSACCIONES Y CONFIGURACIONES.<br />
                                INTRODUZCA CÓDIGO DE LANZAMIENTO PARA CONFIRMAR.
                            </p>
                        </div>

                        <div className="flex justify-center gap-3 my-6">
                            {nuclearCode.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`nuclear-digit-${idx}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleNuclearInput(idx, e.target.value)}
                                    className="w-12 h-16 bg-zinc-900 border-2 border-rose-500/50 focus:border-rose-500 text-rose-500 text-3xl font-mono text-center rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.3)] focus:shadow-[0_0_25px_rgba(244,63,94,0.6)] outline-none transition-all"
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    setShowNuclearModal(false);
                                    setNuclearCode(['', '', '', '']);
                                }}
                                className="py-3 px-4 bg-zinc-800 text-zinc-300 font-mono font-bold rounded-lg hover:bg-zinc-700 transition-colors"
                            >
                                ABORTAR
                            </button>
                            <button
                                onClick={handleDetonate}
                                disabled={isDetonating}
                                className="py-3 px-4 bg-rose-600 text-white font-mono font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-rose-600/50"
                            >
                                {isDetonating ? (
                                    <>
                                        <Radiation className="animate-spin" size={18} /> DETONANDO
                                    </>
                                ) : (
                                    <>
                                        <Bomb size={18} /> DETONAR
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default SettingsMenu;
