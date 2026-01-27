import { Sparkles, PanelLeftClose } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { NAV_SECTIONS } from '../../../constants/navigation';

export const SettingsAppearance = () => {
    const {
        themeStyle, setThemeStyle,
        navMode, setNavigationMode,
        customModeItems, toggleCustomModeItem,
        sidebarPosition, setSidebarPosition,
        sidebarVisibility, setSidebarVisibility
    } = useTheme();

    const themes = [
        { id: 'classic', name: 'Soft Stone', color: 'bg-[#a8a29e]' },
        { id: 'clay', name: 'Soft Clay', color: 'bg-[#fb923c]' },
        { id: 'sand', name: 'Soft Sand', color: 'bg-[#d6b885]' },
        { id: 'coffee', name: 'Soft Coffee', color: 'bg-[#b97f6a]' },
        { id: 'sage', name: 'Soft Sage', color: 'bg-[#64ad84]' },
        { id: 'nordic', name: 'Soft Nordic', color: 'bg-[#0ea5e9]' },
        { id: 'mist', name: 'Soft Mist', color: 'bg-[#94a3b8]' },
        { id: 'royal', name: 'Soft Royal', color: 'bg-[#a78bfa]' },
        { id: 'bloom', name: 'Soft Bloom', color: 'bg-[#fb7185]' },
        { id: 'comic', name: 'Comic Pop', color: 'bg-[#fde047] border-2 border-[#451a03]' },
        { id: 'pop', name: 'Electric Pop', color: 'bg-[#3b82f6] border-2 border-white' },
    ];

    return (
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
                                } `}
                        >
                            <div className={`w-12 h-12 rounded-full ${style.color} shadow-sm group-hover:scale-110 transition-transform duration-300`} />
                            <span className={`text-sm font-bold ${themeStyle === style.id ? 'text-primary' : 'text-zinc-600 dark:text-zinc-400'} `}>
                                {style.name}
                            </span>
                            {themeStyle === style.id && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sidebar Position Configuration */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-6">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Posición de Barra</h3>

                <div className="space-y-6">
                    {/* Position Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { id: 'left', label: 'Izquierda', icon: "M3 3h18v18H3V3zm0 0v18M9 3v18" },
                            { id: 'right', label: 'Derecha', icon: "M3 3h18v18H3V3zm18 0v18M15 3v18" },
                            { id: 'top', label: 'Superior', icon: "M3 3h18v18H3V3zm0 0h18M3 9h18" },
                            { id: 'bottom', label: 'Inferior', icon: "M3 3h18v18H3V3zm0 18h18M3 15h18" },
                        ].map((pos) => (
                            <button
                                key={pos.id}
                                onClick={() => setSidebarPosition(pos.id as any)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${sidebarPosition === pos.id
                                    ? 'bg-white dark:bg-zinc-800 border-primary text-primary shadow-sm'
                                    : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'
                                    } `}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={sidebarPosition === pos.id ? "stroke-primary" : "stroke-zinc-400"}>
                                    <path d={pos.icon.includes('M') ? undefined : "M3 3h18v18H3z"} />
                                    <path d="M4 4h16v16H4z" className="opacity-20" />
                                    {pos.id === 'left' && <path d="M9 4v16" />}
                                    {pos.id === 'right' && <path d="M15 4v16" />}
                                    {pos.id === 'top' && <path d="M4 9h16" />}
                                    {pos.id === 'bottom' && <path d="M4 15h16" />}
                                </svg>
                                <span className="text-xs font-bold">{pos.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Visibility Mode (Dock vs Pinned) */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Estilo de Navegación</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setSidebarVisibility('pinned')}
                                className={`p-4 rounded-xl border text-left transition-all ${sidebarVisibility === 'pinned'
                                    ? 'bg-white dark:bg-zinc-800 border-primary shadow-sm'
                                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500'
                                    } `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-bold ${sidebarVisibility === 'pinned' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'} `}>Clásico (Fijo)</span>
                                </div>
                                <p className="text-xs text-zinc-500">La barra ocupa espacio y empuja el contenido.</p>
                            </button>

                            <button
                                onClick={() => setSidebarVisibility('floating')}
                                className={`p-4 rounded-xl border text-left transition-all ${sidebarVisibility === 'floating'
                                    ? 'bg-white dark:bg-zinc-800 border-primary shadow-sm'
                                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500'
                                    } `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className={sidebarVisibility === 'floating' ? 'text-purple-500' : ''} />
                                    <span className={`font-bold ${sidebarVisibility === 'floating' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'} `}>Dock Flotante</span>
                                </div>
                                <p className="text-xs text-zinc-500">Estilo moderno, flota sobre el contenido.</p>
                            </button>

                            <button
                                onClick={() => setSidebarVisibility('auto')}
                                className={`hidden lg:block p-4 rounded-xl border text-left transition-all lg:col-span-2 ${sidebarVisibility === 'auto'
                                    ? 'bg-white dark:bg-zinc-800 border-primary shadow-sm'
                                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500'
                                    } `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <PanelLeftClose size={14} />
                                    <span className={`font-bold ${sidebarVisibility === 'auto' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'} `}>Ocultar Automáticamente</span>
                                </div>
                                <p className="text-xs text-zinc-500">Se oculta para maximizar espacio. Pasa el ratón por el borde para mostrar.</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Mode Section */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-6">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">Modo de Navegación</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => setNavigationMode('normal')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${navMode === 'normal'
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            } `}
                    >
                        <span className={`block font-bold mb-1 ${navMode === 'normal' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'} `}>Normal</span>
                        <span className="text-xs text-zinc-500">Muestra todas las opciones disponibles.</span>
                    </button>

                    <button
                        onClick={() => setNavigationMode('essential')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${navMode === 'essential'
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            } `}
                    >
                        <span className={`block font-bold mb-1 ${navMode === 'essential' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'} `}>Esencial</span>
                        <span className="text-xs text-zinc-500">Solo lo vital: Dashboard, Gastos e Ingresos.</span>
                    </button>

                    <button
                        onClick={() => setNavigationMode('simple')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${navMode === 'simple'
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            } `}
                    >
                        <span className={`block font-bold mb-1 ${navMode === 'simple' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'} `}>Simple</span>
                        <span className="text-xs text-zinc-500">Experiencia balanceada con finanzas básicas.</span>
                    </button>

                    <button
                        onClick={() => setNavigationMode('custom')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${navMode === 'custom'
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            } `}
                    >
                        <span className={`block font-bold mb-1 ${navMode === 'custom' ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'} `}>Personalizado</span>
                        <span className="text-xs text-zinc-500">Tú eliges qué ver y qué ocultar.</span>
                    </button>
                </div>

                {/* Custom Mode Configuration */}
                {navMode === 'custom' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Elementos Visibles</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {NAV_SECTIONS.flatMap(s => s.items).concat(
                                // Also include subitems in the flatten if present
                                NAV_SECTIONS.flatMap(s => s.items).flatMap(i => i.subItems || [])
                            ).filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i) // Unique by ID incase of dupe in flat map
                                .map((item) => (
                                    <label
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${customModeItems.includes(item.id)
                                            ? 'bg-white dark:bg-zinc-800 border-primary/50 shadow-sm'
                                            : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            } `}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${customModeItems.includes(item.id)
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-zinc-300 dark:border-zinc-600'
                                            } `}>
                                            {customModeItems.includes(item.id) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={customModeItems.includes(item.id)}
                                            onChange={() => toggleCustomModeItem(item.id)}
                                        />
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                                    </label>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
