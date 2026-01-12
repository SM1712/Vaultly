import { useState, useRef } from 'react';
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
import {
    Trash2, Plus, LogOut, User, CalendarClock,
    PlayCircle, PauseCircle, Database,
    Download, Upload, Bomb, Radiation, RefreshCw, Siren,
    LayoutGrid, Palette, List, Zap, History, Sparkles, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Logo from '../ui/Logo';


interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsMenu = ({ isOpen, onClose }: SettingsMenuProps) => {
    const { currency, setCurrency, goalPreferences, setGoalPreferences } = useSettings();
    const { themeStyle, setThemeStyle } = useTheme();
    const { logout, user } = useAuth();
    const { data: appData } = useData();
    const { categories: incomeCats, addCategory: addIncomeCat, removeCategory: removeIncomeCat } = useCategories('income');
    const { categories: expenseCats, addCategory: addExpenseCat, removeCategory: removeExpenseCat } = useCategories('expense');
    const { updateCategory } = useTransactions();
    const { scheduled, toggleActive, deleteScheduled } = useScheduledTransactions();
    const { presets, addPreset, deletePreset } = usePresets();

    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'categories' | 'scheduled' | 'presets' | 'preferences' | 'data' | 'changelog'>('general');
    const [catType, setCatType] = useState<'income' | 'expense'>('expense');
    const [newCatName, setNewCatName] = useState('');

    // New Preset State
    const [newPresetLabel, setNewPresetLabel] = useState('');
    const [newPresetAmount, setNewPresetAmount] = useState('');
    const [newPresetCategory, setNewPresetCategory] = useState('');
    const [newPresetType, setNewPresetType] = useState<'income' | 'expense'>('expense');

    // Theme Definitions (Colortly System)
    const themes = [
        { id: 'classic', name: 'Soft Stone', color: 'bg-[#a8a29e]' }, // stone-400
        { id: 'clay', name: 'Soft Clay', color: 'bg-[#fb923c]' }, // orange-400
        { id: 'sand', name: 'Soft Sand', color: 'bg-[#d6b885]' }, // custom sand
        { id: 'coffee', name: 'Soft Coffee', color: 'bg-[#b97f6a]' }, // custom coffee
        { id: 'sage', name: 'Soft Sage', color: 'bg-[#64ad84]' }, // custom sage
        { id: 'nordic', name: 'Soft Nordic', color: 'bg-[#0ea5e9]' }, // sky-500
        { id: 'mist', name: 'Soft Mist', color: 'bg-[#94a3b8]' }, // slate-400
        { id: 'royal', name: 'Soft Royal', color: 'bg-[#a78bfa]' }, // violet-400
        { id: 'bloom', name: 'Soft Bloom', color: 'bg-[#fb7185]' }, // rose-400
    ];

    const currencies = ['$', '€', '£', '¥', 'COP', 'MXN', 'ARS', 'S/'];

    // Nuclear & Update State
    const [showNuclearModal, setShowNuclearModal] = useState(false);
    const [nuclearCode, setNuclearCode] = useState(['', '', '', '']);
    const [isDetonating, setIsDetonating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');
    const { resetData, updateData } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // PWA Update Logic
    useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    });

    const handleSystemUpdate = () => {
        setIsUpdating(true);
        setUpdateStatus('RECARGANDO...');
        window.location.reload();
    };

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

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const parsedData = JSON.parse(json);
                if (!parsedData || typeof parsedData !== 'object') {
                    throw new Error("Formato inválido");
                }
                updateData(parsedData);
                toast.success("Datos restaurados correctamente");
                onClose();
            } catch (error) {
                console.error("Import error:", error);
                toast.error("Error al importar el archivo. Formato inválido.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
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
            updateCategory(category, 'Desconocido');
        }
    };

    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

    const menuItems = [
        { id: 'general', label: 'General', icon: LayoutGrid, desc: 'Moneda, cuenta y sesión' },
        { id: 'preferences', label: 'Preferencias', icon: SlidersHorizontal, desc: 'Comportamiento de Metas' },
        { id: 'appearance', label: 'Apariencia', icon: Palette, desc: 'Temas, colores y modo oscuro' },
        { id: 'categories', label: 'Categorías', icon: List, desc: 'Gestionar tipos de ingresos y gastos' },
        { id: 'scheduled', label: 'Programados', icon: CalendarClock, desc: 'Pagos y cobros recurrentes' },
        { id: 'presets', label: 'Atajos', icon: Zap, desc: 'Configurar botones de acción rápida' },
        { id: 'data', label: 'Datos', icon: Database, desc: 'Importar, exportar y backups' },
        { id: 'changelog', label: 'Novedades', icon: Sparkles, desc: 'Historial de versiones' },
    ] as const;

    // Reset mobile view when closing
    const handleClose = () => {
        setIsMobileDetailOpen(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={isMobileDetailOpen ? (menuItems.find(m => m.id === activeTab)?.label || 'Configuración') : 'Configuración'} maxWidth="max-w-5xl" className="h-[100dvh] md:h-[650px] w-full" noPadding={true}>
            <div className="flex h-full w-full overflow-hidden relative">

                {/* 1. LAYER: NAVIGATION MENU (Mobile: Full Width / Desktop: Sidebar) */}
                <div className={`
                    bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-2 md:p-3 space-y-1 overflow-y-auto no-scrollbar
                    ${isMobileDetailOpen ? 'hidden md:flex md:w-64 flex-shrink-0' : 'w-full md:w-64 flex-shrink-0'}
                `}>
                    <div className="md:hidden pb-4 pt-2 px-2">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Selecciona una opción para configurar:</p>
                    </div>

                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsMobileDetailOpen(true);
                            }}
                            className={`flex items-center gap-4 px-4 py-4 md:py-2.5 rounded-xl text-left transition-all group border md:border-transparent
                                ${activeTab === item.id
                                    ? 'md:bg-primary/10 md:text-primary font-bold md:shadow-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/50'
                                }`}
                        >
                            {/* Icon Box */}
                            <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                <item.icon size={20} />
                            </div>

                            {/* Text Content */}
                            <div className="flex-1">
                                <span className="block text-base md:text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                                <span className="block md:hidden text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 font-normal">{item.desc}</span>
                            </div>

                            {/* Chevron for Mobile */}
                            <div className="md:hidden text-zinc-300 dark:text-zinc-600">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    ))}

                    <div className="flex-1" />

                    <div className="hidden md:block px-4 py-2 text-xs text-zinc-400 font-mono text-center">
                        v1.5 - Offline Unleashed
                    </div>
                </div>

                {/* 2. LAYER: CONTENT AREA (Mobile: Full Modal / Desktop: Main Area) */}
                <div className={`
                    flex-1 overflow-y-auto bg-white dark:bg-zinc-950
                    ${isMobileDetailOpen ? 'block w-full' : 'hidden md:block'}
                `}>
                    {/* Mobile Header with Back Button */}
                    <div className="md:hidden sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileDetailOpen(false)}
                            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {menuItems.find(m => m.id === activeTab)?.label}
                        </h2>
                    </div>

                    <div className="p-4 md:p-6 pb-20 md:pb-6">

                        {activeTab === 'preferences' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Cálculo de Cuota Mensual</h3>
                                    <div className="space-y-4">
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultCalculationMethod === 'dynamic' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'}`}>
                                            <input
                                                type="radio"
                                                name="calculationMethod"
                                                checked={goalPreferences.defaultCalculationMethod === 'dynamic'}
                                                onChange={() => setGoalPreferences({ ...goalPreferences, defaultCalculationMethod: 'dynamic' })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-bold text-zinc-900 dark:text-zinc-100">Dinámico (Recomendado)</span>
                                                <p className="text-sm text-zinc-500 mt-1">La cuota se ajusta automáticamente cada mes. Si ahorras de más, la cuota baja. Si te atrasas, sube. Ideal para mantener el objetivo final fijo.</p>
                                            </div>
                                        </label>
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultCalculationMethod === 'static' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'}`}>
                                            <input
                                                type="radio"
                                                name="calculationMethod"
                                                checked={goalPreferences.defaultCalculationMethod === 'static'}
                                                onChange={() => setGoalPreferences({ ...goalPreferences, defaultCalculationMethod: 'static' })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-bold text-zinc-900 dark:text-zinc-100">Estático</span>
                                                <p className="text-sm text-zinc-500 mt-1">La cuota es fija (Monto / Total Meses). No cambia aunque adelantes pagos. Ideal si prefieres previsibilidad total y terminar antes si pagas extra.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Estrategia de Recuperación (Default)</h3>
                                    <div className="space-y-4">
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultRecoveryStrategy === 'spread' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'}`}>
                                            <input
                                                type="radio"
                                                name="recoveryStrategy"
                                                checked={goalPreferences.defaultRecoveryStrategy === 'spread'}
                                                onChange={() => setGoalPreferences({ ...goalPreferences, defaultRecoveryStrategy: 'spread' })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-bold text-zinc-900 dark:text-zinc-100">Redistribuir (Spread)</span>
                                                <p className="text-sm text-zinc-500 mt-1">Si retiras dinero, el faltante se divide entre todos los meses restantes.</p>
                                            </div>
                                        </label>
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultRecoveryStrategy === 'catch_up' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'}`}>
                                            <input
                                                type="radio"
                                                name="recoveryStrategy"
                                                checked={goalPreferences.defaultRecoveryStrategy === 'catch_up'}
                                                onChange={() => setGoalPreferences({ ...goalPreferences, defaultRecoveryStrategy: 'catch_up' })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-bold text-zinc-900 dark:text-zinc-100">Pagar Próximo Mes (Catch Up)</span>
                                                <p className="text-sm text-zinc-500 mt-1">Si retiras dinero, se suma todo a la cuota del mes siguiente para recuperar el ritmo inmediatamente.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Account Section */}
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <User size={14} /> Cuenta y Sesión
                                    </h3>
                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                                        {user && (
                                            <div className="flex items-center gap-4 mb-6">
                                                <img
                                                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                                                    alt="User"
                                                    className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover ring-4 ring-white dark:ring-zinc-950"
                                                />
                                                <div className="overflow-hidden">
                                                    <p className="text-lg font-bold text-zinc-900 dark:text-white truncate">{user.displayName}</p>
                                                    <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => { logout(); onClose(); }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 transition-all font-bold text-sm shadow-sm"
                                        >
                                            <LogOut size={16} />
                                            Cerrar Sesión Actual
                                        </button>
                                    </div>
                                </div>

                                {/* Currency Section - Moved here */}
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Configuración Regional</h3>
                                    <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Moneda Principal</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {currencies.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setCurrency(c)}
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold transition-all ${currency === c
                                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                                                        : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-xl border border-indigo-500/20 mb-6">
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300 flex gap-2">
                                        <Sparkles size={18} className="shrink-0" />
                                        <span>La interfaz <strong>Colortly</strong> adapta todos los acentos visuales al tema seleccionado.</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Selecciona tu Tema</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {themes.map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => setThemeStyle(style.id as any)}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative overflow-hidden group ${themeStyle === style.id
                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                    : 'border-transparent bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-full ${style.color} shadow-sm group-hover:scale-110 transition-transform duration-300`} />
                                                <span className={`text-sm font-bold ${themeStyle === style.id ? 'text-primary' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                    {style.name}
                                                </span>
                                                {themeStyle === style.id && (
                                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl mb-4">
                                    <button
                                        onClick={() => setCatType('expense')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${catType === 'expense'
                                            ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100'
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                            }`}
                                    >
                                        Gastos
                                    </button>
                                    <button
                                        onClick={() => setCatType('income')}
                                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${catType === 'income'
                                            ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100'
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                            }`}
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
                        )}

                        {activeTab === 'scheduled' && (
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
                                                }`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                                }`}>
                                                                {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                <History size={10} /> Día {item.dayOfMonth}
                                                            </span>
                                                        </div>
                                                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.description || 'Sin descripción'}</p>
                                                        <p className="text-sm text-zinc-500">{item.category} • {currency}{item.amount.toFixed(2)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteScheduled(item.id)}
                                                        className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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
                                                            }`}
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
                            </div>
                        )}

                        {activeTab === 'presets' && (
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
                                                    {p.amount ? `${currency}${p.amount}` : 'Var'} • <span className="text-zinc-400">{p.category}</span>
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
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-900/30">
                                    <h4 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
                                        <Database size={18} /> Zona de Peligro Nuclear
                                    </h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-500/80 mb-4 leading-relaxed">
                                        Aquí puedes gestionar tus datos brutos. Descarga una copia de seguridad periódicamente para evitar pérdidas de información.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleExport}
                                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                <Download size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100">Exportar Copia de Seguridad</p>
                                                <p className="text-xs text-zinc-500">Descargar archivo .json</p>
                                            </div>
                                        </div>
                                    </button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileImport}
                                        accept=".json"
                                        className="hidden"
                                    />

                                    <button
                                        onClick={handleImportClick}
                                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                <Upload size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100">Restaurar Copia</p>
                                                <p className="text-xs text-zinc-500">Sobrescribir datos actuales</p>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="h-4"></div>

                                    <button
                                        onClick={handleSystemUpdate}
                                        disabled={isUpdating}
                                        className="w-full flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`${isUpdating ? 'animate-spin' : ''}`}>
                                                <RefreshCw size={18} />
                                            </div>
                                            <span className="font-bold text-sm">{isUpdating ? updateStatus : 'Buscar Actualizaciones'}</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setShowNuclearModal(true)}
                                        className="w-full flex items-center justify-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all font-bold text-sm tracking-wide border border-rose-200 dark:border-rose-900/50"
                                    >
                                        <Bomb size={18} />
                                        ELIMINAR TODOS LOS DATOS
                                    </button>
                                </div>
                            </div>
                        )}


                        {activeTab === 'changelog' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="mb-6 flex justify-center">
                                        <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10 shadow-[0_0_30px_-10px] shadow-primary/20 rotate-3 transition-transform hover:rotate-6">
                                            <Logo size={56} />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Novedades de Vaultly</h2>
                                    <p className="text-zinc-500 text-sm">Historial de actualizaciones y mejoras.</p>
                                </div>

                                <div className="relative pl-8 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-10">
                                    {/* v1.8.1 Item (Patch) */}
                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-950 shadow-sm" />
                                        <div className="flex flex-col mb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Parche Actual</span>
                                                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.8.1 - UX Improvements</p>
                                                </div>
                                                <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full font-bold">Patch</span>
                                            </div>
                                            <span className="text-xs text-zinc-400">Enero 2026</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                                            <li><strong>Seguridad en Créditos:</strong> Confirmación requerida antes de eliminar una deuda.</li>
                                            <li><strong>Visibilidad Mejorada:</strong> Los controles de edición y borrado de créditos ahora son siempre visibles.</li>
                                        </ul>
                                    </div>
                                    {/* v1.8 Item (Current) */}
                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-indigo-500 border-4 border-white dark:border-zinc-950 shadow-sm" />
                                        <div className="flex flex-col mb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Versión Actual</span>
                                                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.8 - Dates & Forecasts</p>
                                                </div>
                                                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full font-bold">Major</span>
                                            </div>
                                            <span className="text-xs text-zinc-400">Enero 2026</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                                            <li><strong>Calendario Inmersivo:</strong> Nueva vista de detalle a pantalla completa en móviles con navegación fluida.</li>
                                            <li><strong>Quick Add System:</strong> Botón "+" inteligente y menú contextual (click derecho) en escritorio.</li>
                                            <li><strong>Control Total:</strong> Nuevos botones de recarga rápida (F5) en estado de sincronización y configuración.</li>
                                            <li><strong>Visualización Pro:</strong> Barras de eventos de ancho completo y layout optimizado "Zero-Scroll" en escritorio.</li>
                                        </ul>
                                    </div>

                                    {/* v1.7 Item */}
                                    <div className="relative opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 border-4 border-white dark:border-zinc-950" />
                                        <div className="flex flex-col mb-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.7 - Dynamic Goals Rework</span>
                                                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full font-bold">Rework</span>
                                            </div>
                                            <span className="text-xs text-zinc-400">Enero 2026</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                                            <li><strong>Cuotas Dinámicas Reales:</strong> Curva de pagos variable y ajuste proporcional por adelantos.</li>
                                            <li><strong>Botón Adelantar:</strong> Inyecta capital extra directamente para reducir cuotas futuras.</li>
                                            <li><strong>Ahorro Dinámico Individual:</strong> Switch (⚡) por meta para activar/desactivar la variabilidad.</li>
                                            <li><strong>Créditos y Deudas:</strong> Modo Simple vs Avanzado (Amortización Francesa) y búsqueda inversa de tasas.</li>
                                        </ul>
                                    </div>

                                    {/* v1.6 Item */}
                                    <div className="relative opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 border-4 border-white dark:border-zinc-950" />
                                        <div className="flex flex-col mb-2">
                                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.6 - Smart Goals</span>
                                            <span className="text-xs text-zinc-400">Enero 2026</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                                            <li><strong>Metas Inteligentes:</strong> Estrategias de recuperación (Spread vs Catch-up).</li>
                                            <li><strong>Indicadores de Salud:</strong> Visualiza si vas adelantado o atrasado en tus ahorros.</li>
                                            <li>Nueva interfaz de tarjetas premium.</li>
                                        </ul>
                                    </div>

                                    {/* v1.5.1 Item */}
                                    <div className="relative opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-primary border-4 border-white dark:border-zinc-950 shadow-sm" />
                                        <div className="flex flex-col mb-2">
                                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.5.1 - Mobile Polish</span>
                                            <span className="text-xs text-zinc-400">Enero 2026</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                                            <li><strong>Navegación Stack en Móvil:</strong> Nueva experiencia nativa fluida.</li>
                                            <li><strong>Estilo de Pantalla Completa:</strong> Menús más amplios y legibles.</li>
                                            <li>Correcciones de interfaz y estabilidad.</li>
                                        </ul>
                                    </div>

                                    {/* v1.5 Item */}
                                    <div className="relative opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 border-4 border-white dark:border-zinc-950" />
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.5 - Offline Unleashed</span>
                                            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full font-bold">Major</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4 mb-6">
                                            <li><strong>Modo Offline Real:</strong> Usa la app sin internet.</li>
                                            <li><strong>Carga Instantánea:</strong> Optimizada con carga local prioritaria.</li>
                                            <li><strong>Nuevo Icono PWA:</strong> Identidad visual unificada.</li>
                                        </ul>

                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.2 - Experience Update</span>
                                            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full font-bold">Minor</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4 mb-6">
                                            <li>Mejoras de rendimiento y estabilidad.</li>
                                            <li>Optimización de la interfaz de usuario en dispositivos móviles.</li>
                                            <li>Corrección de errores menores.</li>
                                        </ul>

                                        <div className="flex flex-col mb-2">
                                            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v1.0 - Rebirth</span>
                                            <span className="text-xs text-zinc-400">Diciembre 2025</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                                            <li>Lanzamiento de módulos: Metas, Fondos, Créditos.</li>
                                            <li>Simulador de Proyecciones financieras.</li>
                                            <li>Persistencia de datos en la nube (Firestore).</li>
                                            <li>Autenticación con Google.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nuclear Launch Modal */}
                {showNuclearModal && (
                    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 backdrop-blur-sm rounded-3xl">
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
            </div>
        </Modal>
    );
};

export default SettingsMenu;
