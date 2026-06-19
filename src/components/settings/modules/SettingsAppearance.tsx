import { useState } from 'react';
import { Sparkles, Palette, CheckCircle2, LayoutTemplate, PenTool } from 'lucide-react';
import { VaultlyArt } from '../../../systems/VaultlyArt';
import { useTheme } from '../../../context/ThemeContext';
import { VaultlyArtStudio } from './VaultlyArtStudio';
import { NAV_SECTIONS } from '../../../constants/navigation';
import { clsx } from 'clsx';

export const SettingsAppearance = () => {
    const {
        themeStyle, setThemeStyle,
        activeThemeType,
        navMode, setNavigationMode,
        customModeItems, toggleCustomModeItem,
        sidebarPosition, setSidebarPosition,
        sidebarVisibility, setSidebarVisibility,
        readingMode, toggleReadingMode
    } = useTheme();

    const [activeTab, setActiveTab] = useState<'collection' | 'studio'>('collection');

    const themes = VaultlyArt.getAllThemes();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header / Intro */}
            <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Boutique de Arte & Diseño</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Construye la estética visual de tu espacio financiero.</p>
            </div>

            {/* TAB SELECTOR (Top Level Decision) */}
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl w-full md:w-fit border border-zinc-200/40 dark:border-zinc-800">
                <button
                    onClick={() => setActiveTab('collection')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'collection'
                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    <LayoutTemplate size={16} />
                    Colecciones de Autor
                </button>
                <button
                    onClick={() => setActiveTab('studio')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border-2 border-transparent ${activeTab === 'studio'
                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-black'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}
                        ${activeThemeType === 'custom' && activeTab !== 'studio' ? 'ring-2 ring-primary/20 ring-offset-2 ring-offset-zinc-100 dark:ring-offset-zinc-900 border-primary' : ''}
                    `}
                >
                    <PenTool size={16} />
                    Custom Lab (Art)
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[400px]">

                {/* 1. COLLECTIONS VIEW */}
                {activeTab === 'collection' && (
                    <div className="animate-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {themes.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setThemeStyle(style.id as any)}
                                    className={`group relative text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between h-48 ${themeStyle === style.id && activeThemeType === 'preset'
                                        ? 'border-primary shadow-lg scale-[1.02] bg-white dark:bg-zinc-900'
                                        : 'border-zinc-200/50 dark:border-zinc-850 bg-white dark:bg-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-700 hover:shadow-md'
                                        }`}
                                >
                                    {/* Preview Banner illustrating colors, mesh, patterns */}
                                    <div 
                                        className="h-24 w-full relative overflow-hidden transition-all duration-350"
                                        style={{
                                            backgroundColor: style.type === 'dark' ? '#0b0b10' : '#f8fafc',
                                        }}
                                    >
                                        {/* Dynamic Background Preview */}
                                        {style.bgType === 'gradient' && (
                                            <div className="absolute inset-0 opacity-40"
                                                style={{
                                                    backgroundImage: style.type === 'dark'
                                                        ? `linear-gradient(135deg, #09090c 0%, hsl(${style.hue}, ${style.saturation}%, 8%) 100%)`
                                                        : `linear-gradient(135deg, #f8fafc 0%, hsl(${style.hue}, ${style.saturation}%, 92%) 100%)`
                                                }}
                                            />
                                        )}
                                        {style.bgType === 'mesh' && (
                                            <div className="absolute inset-0 opacity-50 blur-[15px]"
                                                style={{
                                                    backgroundImage: `
                                                        radial-gradient(circle at 10% 20%, hsl(${style.hue}, ${style.saturation}%, 50%, 0.2) 0%, transparent 60%),
                                                        radial-gradient(circle at 90% 70%, hsl(${style.hue + 45}, ${style.saturation}%, 50%, 0.15) 0%, transparent 50%)
                                                    `
                                                }}
                                            />
                                        )}

                                        {/* Texture Preview Overlay */}
                                        {style.texture !== 'none' && (
                                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                                style={{
                                                    backgroundImage: style.texture === 'noise'
                                                        ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
                                                        : style.texture === 'dots'
                                                            ? `radial-gradient(hsl(${style.hue}, ${style.saturation}%, 50%) 1px, transparent 1px)`
                                                            : style.texture === 'grid'
                                                                ? `linear-gradient(hsl(${style.hue}, ${style.saturation}%, 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(${style.hue}, ${style.saturation}%, 50%) 1px, transparent 1px)`
                                                                : style.texture === 'stripes'
                                                                    ? `repeating-linear-gradient(45deg, transparent, transparent 8px, hsl(${style.hue}, ${style.saturation}%, 50%) 8px, hsl(${style.hue}, ${style.saturation}%, 50%) 9px)`
                                                                    : `radial-gradient(circle at 100% 150%, transparent 24%, hsl(${style.hue}, ${style.saturation}%, 50%) 24%, hsl(${style.hue}, ${style.saturation}%, 50%) 28%, transparent 28%, transparent)`,
                                                    backgroundSize: style.texture === 'dots' || style.texture === 'grid' || style.texture === 'wave' ? '14px 14px' : style.texture === 'stripes' ? '12px 12px' : 'auto',
                                                    opacity: style.textureIntensity / 100
                                                }}
                                            />
                                        )}

                                        {/* Accent Glow Preview */}
                                        {style.accentGlow !== 'none' && (
                                            <div className="absolute inset-0 opacity-30"
                                                style={{
                                                    background: style.accentGlow === 'aurora'
                                                        ? `radial-gradient(circle at 50% -10%, hsl(${style.hue}, ${style.saturation}%, 50%, 0.3) 0%, transparent 50%)`
                                                        : style.accentGlow === 'cyberpunk'
                                                            ? `repeating-linear-gradient(0deg, rgba(6, 182, 212, 0.05), rgba(6, 182, 212, 0.05) 1px, transparent 1px, transparent 3px)`
                                                            : style.accentGlow === 'warm-sunset'
                                                                ? `radial-gradient(circle at 50% 100%, rgba(249, 115, 22, 0.2) 0%, transparent 70%)`
                                                                : `repeating-linear-gradient(0deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.05) 1px, transparent 1px, transparent 2px)`
                                                }}
                                            />
                                        )}

                                        {/* Checkmark overlay */}
                                        {themeStyle === style.id && activeThemeType === 'preset' && (
                                            <div className="absolute top-3 right-3 bg-white text-primary p-1 rounded-full shadow-lg animate-in fade-in zoom-in">
                                                <CheckCircle2 size={16} strokeWidth={4} />
                                            </div>
                                        )}

                                        {/* Primary color badge */}
                                        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-sm flex items-center gap-1"
                                            style={{ backgroundColor: `hsl(${style.hue}, ${style.saturation}%, 45%)` }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            {style.name}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 flex-1 flex flex-col justify-center">
                                        <h3 className={`font-black text-sm mb-0.5 flex items-center gap-2 ${themeStyle === style.id && activeThemeType === 'preset' ? 'text-primary' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                            {style.name} 
                                            <span className="text-[9px] font-mono opacity-50 font-medium">({style.type === 'dark' ? 'Oscuro' : 'Claro'})</span>
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal line-clamp-2">
                                            {style.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. CUSTOM LAB VIEW */}
                {activeTab === 'studio' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <VaultlyArtStudio />
                    </div>
                )}
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            {/* GLOBAL PREFERENCES (Sidebar, NavMode) - Available in both views but pushed down */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">

                {/* Sidebar Config */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Estructura de Ventana</h3>

                    <div className="space-y-6">
                        <div className="hidden lg:flex flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 gap-1">
                            {(['left', 'right', 'top', 'bottom'] as const).map(pos => (
                                <button
                                    key={pos}
                                    onClick={() => setSidebarPosition(pos as any)}
                                    className={`flex-1 py-3 text-[10px] md:text-xs font-bold uppercase rounded-lg transition-all ${sidebarPosition === pos
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/10'
                                        : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                                >
                                    {pos === 'left' ? 'Izq' : pos === 'right' ? 'Der' : pos === 'top' ? 'Sup' : 'Inf'}
                                </button>
                            ))}
                        </div>

                        <label className="flex items-center gap-4 group cursor-pointer">
                            <div className={clsx(
                                "w-11 h-6 rounded-full flex items-center p-0.5 transition-colors duration-300",
                                sidebarVisibility === 'floating' ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'
                            )}>
                                <div className={clsx(
                                    "w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300",
                                    sidebarVisibility === 'floating' ? 'translate-x-[20px]' : 'translate-x-0'
                                )} />
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={sidebarVisibility === 'floating'}
                                onChange={() => setSidebarVisibility(sidebarVisibility === 'floating' ? 'pinned' : 'floating')}
                            />
                            <div>
                                <span className="block font-bold text-sm text-zinc-700 dark:text-zinc-300">Modo Flotante (Dock)</span>
                                <span className="block text-xs text-zinc-400">Separa la barra de navegación del borde de la pantalla.</span>
                            </div>
                        </label>
                    </div>
                </section>

                {/* Nav Mode Config */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Complejidad & Filtros</h3>
                    <div className="space-y-3">
                        {/* Reader Mode Toggle */}
                        <button
                            onClick={toggleReadingMode}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${readingMode
                                ? 'bg-amber-55/10 dark:bg-amber-900/10 border-amber-300 dark:border-amber-800'
                                : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${readingMode ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                    <Sparkles size={14} />
                                </div>
                                <div>
                                    <span className={`block font-bold text-sm ${readingMode ? 'text-amber-900 dark:text-amber-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        Modo Lectura
                                    </span>
                                    <span className="text-xs text-zinc-500">Aplica un filtro cálido para reducir la fatiga visual.</span>
                                </div>
                            </div>
                            {readingMode && <CheckCircle2 size={18} className="text-amber-500" />}
                        </button>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

                        {/* Simple vs Custom Toggle */}
                        {['normal', 'simple', 'custom'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setNavigationMode(mode as any)}
                                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${navMode === mode
                                    ? 'bg-zinc-55 dark:bg-zinc-800/30 border-zinc-300 dark:border-zinc-700'
                                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                            >
                                <span className={`font-bold text-sm ${navMode === mode ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>
                                    {mode === 'normal' ? 'Completo' : mode === 'simple' ? 'Simplificado' : 'Personalizado'}
                                </span>
                                {navMode === mode && <CheckCircle2 size={16} className="text-primary" />}
                            </button>
                        ))}

                        {/* Custom config expansion */}
                        {navMode === 'custom' && (
                            <div className="mt-4 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-2 animate-in slide-in-from-left-2">
                                {NAV_SECTIONS.flatMap(s => s.items).filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i).map(item => (
                                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${customModeItems.includes(item.id) ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100' : 'border-zinc-300'}`}>
                                            {customModeItems.includes(item.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-white dark:text-zinc-900"><polyline points="20 6 9 17 4 12" /></svg>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={customModeItems.includes(item.id)} onChange={() => toggleCustomModeItem(item.id)} />
                                        <span className="text-sm text-zinc-650 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};
