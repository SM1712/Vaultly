import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Palette, Zap, Layers, Grip, Scan, CreditCard, User, 
    Copy, Download, Upload, RefreshCw, Sliders, Type, Check, 
    Moon, Sun, CheckCircle2, HelpCircle
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { ArtNumber } from '../../ui/ArtNumber';
import { VaultlyArt } from '../../../systems/VaultlyArt';

export const VaultlyArtStudio = () => {
    const { customTheme, updateCustomTheme, theme: currentAppMode, activeThemeType, setActiveThemeType } = useTheme();

    // Use values directly from context (Single Source of Truth)
    const { 
        hue, saturation, accentGlow, bgType, texture, textureTarget, 
        textureIntensity, glassBlur, glassOpacity, radius, borderStyle, 
        borderThickness, shadowStyle, fontFamily, letterSpacing, commaStyle 
    } = customTheme;

    // Local states for studio controls
    const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(currentAppMode);
    const [activeControlTab, setActiveControlTab] = useState<'colors' | 'materials' | 'borders' | 'typography' | 'share'>('colors');
    const [copiedCode, setCopiedCode] = useState(false);
    const [importCodeInput, setImportCodeInput] = useState('');
    const [importError, setImportError] = useState('');
    const [importSuccess, setImportSuccess] = useState(false);

    // Sync preview mode with the global app mode initially
    useEffect(() => {
        setPreviewMode(currentAppMode);
    }, [currentAppMode]);

    // Helper to update specific fields in context
    const update = (field: keyof typeof customTheme, value: any) => {
        updateCustomTheme({ [field]: value });
    };

    // Serialize theme for share code
    const getShareCode = () => {
        try {
            const minified = {
                h: hue, s: saturation, g: accentGlow, b: bgType, t: texture,
                tt: textureTarget, ti: textureIntensity, gb: glassBlur, go: glassOpacity,
                r: radius, bs: borderStyle, bt: borderThickness, ss: shadowStyle,
                f: fontFamily, ls: letterSpacing, cs: commaStyle
            };
            return btoa(JSON.stringify(minified));
        } catch (e) {
            return '';
        }
    };

    // Import serialized theme code
    const handleImportTheme = () => {
        setImportError('');
        setImportSuccess(false);
        try {
            if (!importCodeInput.trim()) {
                setImportError('Por favor ingresa un código de tema.');
                return;
            }
            const decoded = JSON.parse(atob(importCodeInput.trim()));
            const updates: any = {};
            if (typeof decoded.h === 'number') updates.hue = decoded.h;
            if (typeof decoded.s === 'number') updates.saturation = decoded.s;
            if (decoded.g) updates.accentGlow = decoded.g;
            if (decoded.b) updates.bgType = decoded.b;
            if (decoded.t) updates.texture = decoded.t;
            if (decoded.tt) updates.textureTarget = decoded.tt;
            if (typeof decoded.ti === 'number') updates.textureIntensity = decoded.ti;
            if (typeof decoded.gb === 'number') updates.glassBlur = decoded.gb;
            if (typeof decoded.go === 'number') updates.glassOpacity = decoded.go;
            if (decoded.r) updates.radius = decoded.r;
            if (decoded.bs) updates.borderStyle = decoded.bs;
            if (typeof decoded.bt === 'number') updates.borderThickness = decoded.bt;
            if (decoded.ss) updates.shadowStyle = decoded.ss;
            if (decoded.f) updates.fontFamily = decoded.f;
            if (decoded.ls) updates.letterSpacing = decoded.ls;
            if (decoded.cs) updates.commaStyle = decoded.cs;

            updateCustomTheme(updates);
            setImportSuccess(true);
            setImportCodeInput('');
            setTimeout(() => setImportSuccess(false), 3000);
        } catch (e) {
            setImportError('Código de tema inválido o corrupto.');
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(getShareCode());
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    // Helper map for preview border styles
    const getPreviewBorder = (previewBorderClass: string) => {
        const thicknessStyle = `${borderThickness}px`;
        const colorStyle = previewMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        
        if (borderStyle === 'brutalist') {
            return { border: `${thicknessStyle} solid ${previewMode === 'dark' ? '#fff' : '#000'}` };
        } else if (borderStyle === 'contrast') {
            return { border: `${thicknessStyle} solid ${previewMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.8)'}` };
        } else if (borderStyle === 'shadow') {
            return { border: `${thicknessStyle} solid ${previewMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'}` };
        }
        return { border: `${thicknessStyle} solid ${colorStyle}` };
    };

    // Helper map for preview shadow styles
    const getPreviewShadow = () => {
        if (shadowStyle === 'brutalist') {
            return { boxShadow: `4px 4px 0px ${previewMode === 'dark' ? '#fff' : '#000'}` };
        } else if (shadowStyle === 'glow') {
            return { boxShadow: `0 8px 25px hsl(${hue}, ${saturation}%, 50%, 0.25)` };
        } else if (shadowStyle === 'soft') {
            return { boxShadow: '0 4px 15px rgba(0,0,0,0.06)' };
        }
        return { boxShadow: 'none' };
    };

    // Helper map for preview radius
    const getPreviewRadius = () => {
        const radiusMap: Record<string, string> = {
            'none': '0px', 'sm': '4px', 'md': '8px', 'lg': '14px', 'xl': '20px', 'full': '9999px'
        };
        return { borderRadius: radiusMap[radius] || '8px' };
    };

    // Helper map for preview font family
    const getPreviewFont = () => {
        const fontMap: Record<string, string> = {
            'outfit': 'Outfit, sans-serif',
            'inter': 'Inter, sans-serif',
            'serif': 'Playfair Display, Georgia, serif',
            'mono': 'Space Mono, monospace',
            'syne': 'Syne, sans-serif'
        };
        return { fontFamily: fontMap[fontFamily] || 'Outfit, sans-serif' };
    };

    // Helper map for preview letter spacing
    const getPreviewLetterSpacing = () => {
        const spacingMap: Record<string, string> = {
            'tight': '-0.04em', 'normal': '0em', 'wide': '0.06em'
        };
        return { letterSpacing: spacingMap[letterSpacing] || '0em' };
    };

    return (
        <div className="space-y-6">
            
            {/* 1. BRANDING HEADER */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Palette size={160} />
                </div>
                
                <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-center justify-between">
                    <div className="space-y-2 text-center lg:text-left">
                        <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                            Estudio Creativo
                        </span>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                            Boutique de Arte Vaultly
                        </h3>
                        <p className="text-sm text-zinc-650 dark:text-zinc-300 max-w-xl">
                            Moldea la interfaz a tu medida. Cambia colores, texturas de material, estilos tipográficos, profundidad y hasta la forma de las comas decimales.
                        </p>
                    </div>

                    {/* Quick Info Badge */}
                    <div className="flex items-center gap-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur px-5 py-3 rounded-xl border border-white/20">
                        <div className="text-center">
                            <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Tono Activo</span>
                            <span className="font-mono text-sm font-bold text-primary">{hue}° / 360°</span>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="text-center">
                            <span className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Tipografía</span>
                            <span className="text-sm font-bold capitalize text-zinc-800 dark:text-zinc-200">{fontFamily}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. THE STUDIO WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: LIVE CANVAS PREVIEW (Static height sticky preview) */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">
                            Lienzo de Prueba en Vivo
                        </h4>
                        <div className="flex bg-zinc-100 dark:bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-850">
                            <button
                                onClick={() => setPreviewMode('light')}
                                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${previewMode === 'light' ? 'bg-white text-orange-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                                title="Preview Mode: Light"
                            >
                                <Sun size={12} />
                            </button>
                            <button
                                onClick={() => setPreviewMode('dark')}
                                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${previewMode === 'dark' ? 'bg-zinc-850 text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                title="Preview Mode: Dark"
                            >
                                <Moon size={12} />
                            </button>
                        </div>
                    </div>

                    {/* LIVE SANDBOX CONTAINER */}
                    <div 
                        className={`w-full p-6 rounded-3xl border transition-all relative min-h-[460px] flex flex-col justify-between overflow-hidden shadow-inner ${previewMode === 'dark' ? 'bg-[#030307] border-zinc-900 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                    >
                        {/* Dynamic Background Overlays inside Sandbox */}
                        {bgType === 'gradient' && (
                            <div className="absolute inset-0 pointer-events-none opacity-30"
                                style={{
                                    backgroundImage: previewMode === 'dark' 
                                        ? `linear-gradient(135deg, #09090c 0%, hsl(${hue}, ${saturation}%, 8%) 100%)`
                                        : `linear-gradient(135deg, #f8fafc 0%, hsl(${hue}, ${saturation}%, 92%) 100%)`
                                }}
                            />
                        )}
                        {bgType === 'mesh' && (
                            <div className="absolute inset-0 pointer-events-none opacity-40 blur-[40px]"
                                style={{
                                    backgroundImage: `
                                        radial-gradient(circle at 10% 20%, hsl(${hue}, ${saturation}%, 50%, 0.12) 0%, transparent 60%),
                                        radial-gradient(circle at 90% 70%, hsl(${hue + 40}, ${saturation}%, 50%, 0.08) 0%, transparent 50%)
                                    `
                                }}
                            />
                        )}
                        
                        {/* Ambient Aurora inside Sandbox */}
                        {accentGlow !== 'none' && (
                            <div className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: accentGlow === 'aurora' 
                                        ? `radial-gradient(circle at 50% -20%, hsl(${hue}, ${saturation}%, 50%, 0.15) 0%, transparent 60%)`
                                        : accentGlow === 'cyberpunk'
                                            ? `repeating-linear-gradient(0deg, rgba(6, 182, 212, 0.03), rgba(6, 182, 212, 0.03) 1px, transparent 1px, transparent 4px)`
                                            : accentGlow === 'warm-sunset'
                                                ? `radial-gradient(circle at 50% 120%, rgba(249, 115, 22, 0.1) 0%, rgba(239, 68, 68, 0.04) 50%, transparent 80%)`
                                                : `repeating-linear-gradient(0deg, rgba(16, 185, 129, 0.04), rgba(16, 185, 129, 0.04) 1px, transparent 1px, transparent 2px)`
                                }}
                            />
                        )}

                        {/* Texture Overlays inside Sandbox */}
                        {texture !== 'none' && (
                            <div className="absolute inset-0 pointer-events-none opacity-30 z-0"
                                style={{
                                    backgroundImage: texture === 'noise'
                                        ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
                                        : texture === 'dots'
                                            ? `radial-gradient(var(--color-primary, #6366f1) 1px, transparent 1px)`
                                            : texture === 'grid'
                                                ? `linear-gradient(var(--color-primary, #6366f1) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary, #6366f1) 1px, transparent 1px)`
                                                : texture === 'stripes'
                                                    ? `repeating-linear-gradient(45deg, transparent, transparent 8px, var(--color-primary, #6366f1) 8px, var(--color-primary, #6366f1) 9px)`
                                                    : `radial-gradient(circle at 100% 150%, transparent 24%, var(--color-primary, #6366f1) 24%, var(--color-primary, #6366f1) 28%, transparent 28%, transparent)`,
                                    backgroundSize: texture === 'dots' || texture === 'grid' || texture === 'wave' ? '20px 20px' : texture === 'stripes' ? '16px 16px' : 'auto',
                                    opacity: textureIntensity / 100
                                }}
                            />
                        )}

                        {/* SANDBOX CONTENT (App widgets mockups) */}
                        <div className="space-y-4 relative z-10 w-full" style={{ ...getPreviewFont(), ...getPreviewLetterSpacing() }}>
                            
                            {/* Widget 1: Premium Credit Card */}
                            <div 
                                className="w-full p-5 flex flex-col justify-between h-36 relative transition-all duration-300 transform hover:scale-[1.02] border-t border-l border-white/20 select-none group"
                                style={{
                                    ...getPreviewRadius(),
                                    ...getPreviewShadow(),
                                    backgroundColor: previewMode === 'dark' ? 'rgba(25, 25, 35, 0.8)' : 'rgba(255, 255, 255, 0.85)',
                                    ...getPreviewBorder('card')
                                }}
                            >
                                {/* Textured highlight inside widget 1 if glass */}
                                {texture === 'glass' && (
                                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[12px] -z-10 pointer-events-none" style={getPreviewRadius()} />
                                )}

                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Wallet Balance</span>
                                        <span className="text-xl font-extrabold tracking-tight" style={{ color: `hsl(${hue}, ${saturation}%, ${previewMode === 'dark' ? 65 : 45}%)` }}>
                                            <ArtNumber value={1250.75} symbol="$" />
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow" style={{ backgroundColor: 'var(--color-primary)' }}>
                                        <CreditCard size={14} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="block text-[9px] text-zinc-400 tracking-wider">TARJETA DE ARTE</span>
                                        <span className="text-xs font-mono font-medium opacity-80 uppercase">Vaultly Designer</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-4 h-4 rounded-full bg-red-500/80" />
                                        <div className="w-4 h-4 rounded-full bg-yellow-500/80 -ml-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Widget 2: Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                
                                {/* Income stat */}
                                <div 
                                    className="p-3 border flex flex-col"
                                    style={{
                                        ...getPreviewRadius(),
                                        ...getPreviewShadow(),
                                        backgroundColor: previewMode === 'dark' ? 'rgba(25, 25, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                                        ...getPreviewBorder('card')
                                    }}
                                >
                                    <span className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase font-bold block">Ingresos</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                        <ArtNumber value={3820.00} symbol="$" minimumFractionDigits={0} />
                                    </span>
                                </div>

                                {/* Expense stat */}
                                <div 
                                    className="p-3 border flex flex-col"
                                    style={{
                                        ...getPreviewRadius(),
                                        ...getPreviewShadow(),
                                        backgroundColor: previewMode === 'dark' ? 'rgba(25, 25, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                                        ...getPreviewBorder('card')
                                    }}
                                >
                                    <span className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase font-bold block">Gastos</span>
                                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
                                        <ArtNumber value={2569.25} symbol="$" minimumFractionDigits={0} />
                                    </span>
                                </div>
                            </div>

                            {/* Widget 3: Button & User Row */}
                            <div 
                                className="p-3.5 border flex items-center justify-between gap-4"
                                style={{
                                    ...getPreviewRadius(),
                                    ...getPreviewShadow(),
                                    backgroundColor: previewMode === 'dark' ? 'rgba(25, 25, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                                    ...getPreviewBorder('card')
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400">
                                        <User size={14} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="block text-xs font-bold leading-none">Puntuación Visual</span>
                                        <span className="block text-[9px] text-zinc-400 leading-none">Estabilidad 100%</span>
                                    </div>
                                </div>

                                <button 
                                    className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm flex items-center gap-1 active:scale-95 transition-all"
                                    style={{
                                        ...getPreviewRadius(),
                                        backgroundColor: 'var(--color-primary)'
                                    }}
                                >
                                    Activar
                                </button>
                            </div>
                        </div>

                        {/* Typographical elements preview (Commas details) */}
                        <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-850 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">COMMA ART DETAIL:</span>
                            <div className="flex gap-2 font-mono bg-zinc-200/40 dark:bg-zinc-900/40 px-2.5 py-1 rounded-md">
                                <span className="opacity-60">1</span>
                                <span className="art-comma font-bold">,</span>
                                <span className="opacity-60">250</span>
                                <span className="art-dot font-bold">.</span>
                                <span className="opacity-60 text-[10px]">00</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Button to explicitly apply the Custom Design to the application */}
                    <button
                        onClick={() => {
                            setActiveThemeType('custom');
                            localStorage.setItem('vault_active_theme_type', 'custom');
                            VaultlyArt.applyCustomTheme(customTheme, currentAppMode);
                        }}
                        style={getPreviewRadius()}
                        className={`w-full py-3.5 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 ${
                            activeThemeType === 'custom' ? 'btn-art-applied' : 'btn-art-apply'
                        }`}
                    >
                        {activeThemeType === 'custom' ? (
                            <>
                                <CheckCircle2 size={13} className="stroke-[3]" />
                                Activo en la App
                            </>
                        ) : (
                            <>
                                <Zap size={13} className="animate-pulse" />
                                Aplicar al Sistema
                            </>
                        )}
                    </button>
                </div>

                {/* RIGHT COLUMN: INTERACTIVE CONTROLS TABS */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Control Tab Selector */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-900/50 rounded-xl p-1 gap-1 border border-zinc-250/20 dark:border-zinc-800">
                        {[
                            { id: 'colors', label: 'Color', icon: Palette },
                            { id: 'materials', label: 'Material', icon: Layers },
                            { id: 'borders', label: 'Bordes', icon: BordersIcon },
                            { id: 'typography', label: 'Letras', icon: Type },
                            { id: 'share', label: 'Compartir', icon: Download }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveControlTab(tab.id as any)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${activeControlTab === tab.id
                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/30'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                            >
                                <tab.icon size={13} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* CONTROL TAB CONTENTS */}
                    <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 min-h-[380px] flex flex-col justify-between">
                        
                        {/* 1. COLOR & ACCENT PANEL */}
                        {activeControlTab === 'colors' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Palette className="text-primary" size={16} /> Motor de Color HSL
                                    </h4>
                                    <p className="text-xs text-zinc-500">Mueve el tono y la saturación del color principal. Toda la paleta del sistema se re-calculará en base a tu color central.</p>
                                </div>

                                {/* Hue Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-zinc-500">Tono (Hue)</span>
                                        <span className="font-mono text-zinc-400 font-bold" style={{ color: `hsl(${hue}, 100%, 50%)` }}>{hue}°</span>
                                    </div>
                                    <div className="relative h-6 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} />
                                        <input
                                            type="range" min="0" max="360" value={hue}
                                            onChange={e => update('hue', parseInt(e.target.value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="absolute top-0 bottom-0 w-5 bg-white border-2 border-zinc-350 shadow-lg rounded-full pointer-events-none transition-all"
                                            style={{ left: `${(hue / 360) * 100}%`, transform: 'translateX(-50%)' }}
                                        />
                                    </div>
                                </div>

                                {/* Saturation Slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold text-zinc-500">Saturación (Intensidad)</span>
                                        <span className="font-mono text-zinc-450 dark:text-zinc-400 font-bold">{saturation}%</span>
                                    </div>
                                    <div className="relative h-6 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                                        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))` }} />
                                        <input
                                            type="range" min="0" max="100" value={saturation}
                                            onChange={e => update('saturation', parseInt(e.target.value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="absolute top-0 bottom-0 w-5 bg-white border-2 border-zinc-350 shadow-lg rounded-full pointer-events-none transition-all"
                                            style={{ left: `${saturation}%`, transform: 'translateX(-50%)' }}
                                        />
                                    </div>
                                </div>

                                {/* Accent Glow (Aurora Overlay) */}
                                <div className="space-y-3">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Resplandor de Fondo (Auroras)</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {[
                                            { id: 'none', label: 'Ninguno', color: 'bg-zinc-200 dark:bg-zinc-800' },
                                            { id: 'aurora', label: 'Aurora', color: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500' },
                                            { id: 'cyberpunk', label: 'Cyber', color: 'bg-cyan-500' },
                                            { id: 'warm-sunset', label: 'Warm', color: 'bg-orange-500' },
                                            { id: 'retro-green', label: 'Retro', color: 'bg-emerald-500' }
                                        ].map(glow => (
                                            <button
                                                key={glow.id}
                                                onClick={() => update('accentGlow', glow.id)}
                                                className={`p-2 rounded-xl border-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${accentGlow === glow.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full ${glow.color} shadow-inner`} />
                                                <span className="text-[10px] font-bold block">{glow.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. MATERIALS & SURFACES PANEL */}
                        {activeControlTab === 'materials' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Layers className="text-primary" size={16} /> Superficies & Filtros
                                    </h4>
                                    <p className="text-xs text-zinc-500">Configura la textura general y la transparencia del fondo de las tarjetas.</p>
                                </div>

                                {/* Background Type */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Estilo del Fondo Principal</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'solid', label: 'Sólido Plano' },
                                            { id: 'gradient', label: 'Gradiente Suave' },
                                            { id: 'mesh', label: 'Malla Animada' }
                                        ].map(bg => (
                                            <button
                                                key={bg.id}
                                                onClick={() => update('bgType', bg.id)}
                                                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${bgType === bg.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                            >
                                                {bg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Texture Grid */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Filtro de Textura</span>
                                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200/50 dark:border-zinc-800">
                                            {(['bg', 'card', 'both'] as const).map(target => (
                                                <button
                                                    key={target}
                                                    onClick={() => update('textureTarget', target)}
                                                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all ${textureTarget === target
                                                        ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary'
                                                        : 'text-zinc-550 dark:text-zinc-400'}`}
                                                >
                                                    {target === 'bg' ? 'Fondo' : target === 'card' ? 'Tarj' : 'Ambos'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: 'none', label: 'Limpio', icon: Zap },
                                            { id: 'noise', label: 'Ruido', icon: Layers },
                                            { id: 'glass', label: 'Cristal', icon: Scan },
                                            { id: 'dots', label: 'Puntos', icon: Grip },
                                            { id: 'grid', label: 'Malla', icon: LayoutGridIcon },
                                            { id: 'stripes', label: 'Líneas', icon: StripesIcon },
                                            { id: 'wave', label: 'Olas', icon: WaveIcon }
                                        ].map(tStyle => (
                                            <button
                                                key={tStyle.id}
                                                onClick={() => update('texture', tStyle.id)}
                                                className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${texture === tStyle.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                            >
                                                <tStyle.icon size={16} />
                                                <span className="text-[10px] font-bold block">{tStyle.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textures strength (Only if not none) */}
                                {texture !== 'none' && (
                                    <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                                        {texture !== 'glass' && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-semibold text-zinc-500">Intensidad de la Textura</span>
                                                    <span className="font-mono text-zinc-400 font-bold">{textureIntensity}%</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="100" value={textureIntensity}
                                                    onChange={e => update('textureIntensity', parseInt(e.target.value))}
                                                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                            </div>
                                        )}

                                        {texture === 'glass' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-semibold text-zinc-500">Desenfoque Blur</span>
                                                        <span className="font-mono text-zinc-400 font-bold">{glassBlur}px</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="32" value={glassBlur}
                                                        onChange={e => update('glassBlur', parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-semibold text-zinc-500">Transparencia</span>
                                                        <span className="font-mono text-zinc-400 font-bold">{glassOpacity}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="10" max="100" value={glassOpacity}
                                                        onChange={e => update('glassOpacity', parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. BORDERS & SHADOWS PANEL */}
                        {activeControlTab === 'borders' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Sliders className="text-primary" size={16} /> Estructura de Bordes & Sombra
                                    </h4>
                                    <p className="text-xs text-zinc-500">Ajusta los relieves físicos del lienzo: bordes gruesos, esquinas curvadas y sombras retro.</p>
                                </div>

                                {/* Radius Corner Selection */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Curvatura de Esquinas (Radius)</span>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {[
                                            { id: 'none', label: 'Recto' },
                                            { id: 'sm', label: 'Chico' },
                                            { id: 'md', label: 'Medio' },
                                            { id: 'lg', label: 'Grande' },
                                            { id: 'xl', label: 'Giga' },
                                            { id: 'full', label: 'Píldora' }
                                        ].map(rad => (
                                            <button
                                                key={rad.id}
                                                onClick={() => update('radius', rad.id)}
                                                className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${radius === rad.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                            >
                                                {rad.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Border Style & Thickness */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Estilo de Borde</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'clean', label: 'Limpio' },
                                                { id: 'contrast', label: 'Contraste' },
                                                { id: 'shadow', label: 'Sombra' },
                                                { id: 'brutalist', label: 'Brutal' }
                                            ].map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => update('borderStyle', item.id)}
                                                    className={`py-2 px-2 rounded-lg border text-[11px] font-bold transition-all ${borderStyle === item.id
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Grosor de Borde</span>
                                            <span className="font-mono text-zinc-400 font-bold">{borderThickness}px</span>
                                        </div>
                                        <div className="pt-2">
                                            <input
                                                type="range" min="0" max="3" step="0.5" value={borderThickness}
                                                onChange={e => update('borderThickness', parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Shadow Style selection */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Sombras & Profundidad (Shadows)</span>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: 'none', label: 'Ninguno' },
                                            { id: 'soft', label: 'Suave' },
                                            { id: 'glow', label: 'Brillo Neon' },
                                            { id: 'brutalist', label: 'Solid 3D' }
                                        ].map(shadow => (
                                            <button
                                                key={shadow.id}
                                                onClick={() => update('shadowStyle', shadow.id)}
                                                className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all ${shadowStyle === shadow.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                            >
                                                {shadow.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. TYPOGRAPHY & COMMA ART PANEL */}
                        {activeControlTab === 'typography' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Type className="text-primary" size={16} /> Tipografía & Comma Art
                                    </h4>
                                    <p className="text-xs text-zinc-500">Personaliza la fuente, la separación de caracteres y el aspecto de las comas de los números.</p>
                                </div>

                                {/* Font Family picker */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Familia Tipográfica</span>
                                        <select
                                            value={fontFamily}
                                            onChange={e => update('fontFamily', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="outfit">Outfit (Moderna/Elegante)</option>
                                            <option value="inter">Inter (Clásica/Limpia)</option>
                                            <option value="serif">Playfair (Serif Tradicional)</option>
                                            <option value="mono">Space Mono (Tech/Monospace)</option>
                                            <option value="syne">Syne (Artística/Bold)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Tracking (Separación)</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'tight', label: 'Estrecho' },
                                                { id: 'normal', label: 'Normal' },
                                                { id: 'wide', label: 'Ancho' }
                                            ].map(sp => (
                                                <button
                                                    key={sp.id}
                                                    onClick={() => update('letterSpacing', sp.id)}
                                                    className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${letterSpacing === sp.id
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                                >
                                                    {sp.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Comma Art Design */}
                                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Personalización de Comas (Decimales)</span>
                                        <span className="text-[10px] bg-primary/10 text-primary font-mono px-2 py-0.5 rounded-full uppercase">Commas Art</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400">Elige cómo se verán los separadores decimales de tus números en las pantallas principales.</p>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                        {[
                                            { id: 'standard', label: 'Estándar', preview: ',00' },
                                            { id: 'curly', label: 'Serif Curly', preview: '⹁00' },
                                            { id: 'monospaced', label: 'Tech Block', preview: '[,]' },
                                            { id: 'accented', label: 'Neon Bold', preview: ',00' }
                                        ].map(cStyle => (
                                            <button
                                                key={cStyle.id}
                                                onClick={() => update('commaStyle', cStyle.id)}
                                                className={`p-2 rounded-lg border text-center transition-all ${commaStyle === cStyle.id
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}
                                            >
                                                <span className="text-[10px] font-bold block mb-1">{cStyle.label}</span>
                                                <span className="text-sm font-black tracking-widest">{cStyle.preview}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. SHARE & EXPORT PANEL */}
                        {activeControlTab === 'share' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Download size={16} className="text-primary" /> Compartir & Importar Diseños
                                    </h4>
                                    <p className="text-xs text-zinc-500">Genera códigos compactos para guardar tus creaciones o importar temas compartidos por la comunidad.</p>
                                </div>

                                {/* Export Block */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Exportar Código de Tema</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" readOnly value={getShareCode()}
                                            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono select-all outline-none"
                                        />
                                        <button
                                            onClick={handleCopyCode}
                                            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-1.5 transition-opacity"
                                        >
                                            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                                            {copiedCode ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>

                                {/* Import Block */}
                                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Importar Código Externo</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" placeholder="Pega el código de tema aquí..."
                                            value={importCodeInput} onChange={e => setImportCodeInput(e.target.value)}
                                            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <button
                                            onClick={handleImportTheme}
                                            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-1.5 transition-opacity"
                                        >
                                            <Upload size={14} />
                                            Importar
                                        </button>
                                    </div>
                                    
                                    {importError && (
                                        <p className="text-[10px] text-rose-500 font-semibold">{importError}</p>
                                    )}
                                    {importSuccess && (
                                        <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                                            <CheckCircle2 size={12} /> ¡Tema importado y aplicado con éxito!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* RESET BUTTON */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
                            <button
                                onClick={() => updateCustomTheme({
                                    hue: 250,
                                    saturation: 85,
                                    accentGlow: 'none',
                                    bgType: 'solid',
                                    texture: 'none',
                                    textureTarget: 'bg',
                                    textureIntensity: 20,
                                    glassBlur: 16,
                                    glassOpacity: 75,
                                    radius: 'md',
                                    borderStyle: 'clean',
                                    borderThickness: 1,
                                    shadowStyle: 'soft',
                                    fontFamily: 'outfit',
                                    letterSpacing: 'normal',
                                    commaStyle: 'standard'
                                })}
                                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-xs font-bold flex items-center gap-1 transition-colors py-1 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <RefreshCw size={12} />
                                Restablecer Valores
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Quick custom vector icons for borders
function BordersIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="4" />
            <path d="M3 9h18" />
            <path d="M9 21V3" />
        </svg>
    );
}

function LayoutGridIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    );
}

function StripesIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/255" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="21" x2="21" y2="3" />
            <line x1="3" y1="12" x2="12" y2="3" />
            <line x1="12" y1="21" x2="21" y2="12" />
        </svg>
    );
}

function WaveIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6c.6.5 1.2 1 2.5 1s2-.5 2.5-1 1.2-1 2.5-1 2 .5 2.5 1 1.2 1 2.5 1 2-.5 2.5-1 1.2-1 2.5-1 2 .5 2.5 1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1s2-.5 2.5-1 1.2-1 2.5-1 2 .5 2.5 1 1.2 1 2.5 1 2-.5 2.5-1 1.2-1 2.5-1 2 .5 2.5 1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1s2-.5 2.5-1 1.2-1 2.5-1 2 .5 2.5 1 1.2 1 2.5 1 2-.5 2.5-1 1.2-1 2.5-1 2 .5 2.5 1" />
        </svg>
    );
}
