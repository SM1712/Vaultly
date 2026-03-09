import { useState, useEffect } from 'react';
import { Sparkles, Palette, Zap, Layers, Grip, Scan, CreditCard, User } from 'lucide-react';
import { type ThemeRadius, type ThemeTexture } from '../../../systems/Colortly';
import { useTheme } from '../../../context/ThemeContext';

export const ColortlyStudio = () => {
    const { customTheme, updateCustomTheme } = useTheme();

    // Use values directly from context (Single Source of Truth)
    const { hue, saturation, texture, textureTarget, textureIntensity, radius, borderStyle } = customTheme;

    // Helper to update specific fields
    const update = (field: keyof typeof customTheme, value: any) => {
        updateCustomTheme({ [field]: value });
        if (field === 'hue' || field === 'saturation') {
            // Trigger color engine update for H/S changes immediately
            // (We could also move updatePalette to context if needed, but keeping it local-ish is fine for now)
            // Actually, we need to call updatePalette here or in an effect.
        }
    };

    // Color Logic: Generates a full palette (50-950) from Hue + Saturation
    const updatePalette = (h: number, s: number) => {
        requestAnimationFrame(() => {
            const root = document.documentElement;
            root.style.setProperty('--color-primary', `hsl(${h}, ${s}%, 50%)`);

            const lightnessMap: Record<number, number> = {
                50: 98, 100: 95, 200: 90, 300: 82, 400: 64,
                500: 50, 600: 40, 700: 30, 800: 20, 900: 12, 950: 6
            };
            Object.entries(lightnessMap).forEach(([stop, l]) => {
                root.style.setProperty(`--color-app-${stop}`, `hsl(${h}, ${s}%, ${l}%)`);
            });
        });
    };

    // Effect to apply colors when H/S change in context
    useEffect(() => {
        updatePalette(hue, saturation);
    }, [hue, saturation]);


    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-6 rounded-2xl border border-violet-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={120} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-violet-900 dark:text-violet-100 flex items-center gap-2 mb-2">
                            <Palette className="text-violet-500" />
                            Colortly Studio <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                        </h3>
                        <p className="text-sm text-violet-700 dark:text-violet-300">
                            Crea un tema único. Ajusta el tono y la intensidad y verás como toda la interfaz cobra vida.
                        </p>
                    </div>

                    {/* LIVE PREVIEW CARD */}
                    <div className="shrink-0">
                        <div className="w-64 h-40 rounded-xl shadow-2xl overflow-hidden relative border-2 border-white/20 transition-all transform hover:scale-105"
                            style={{
                                backgroundColor: 'var(--color-app-50)',
                            }}
                        >
                            {/* Card Header (Primary Color) */}
                            <div className="h-14 w-full bg-primary p-4 flex items-center justify-between text-white transition-colors duration-200">
                                <span className="font-bold text-sm opacity-90">Vaultly Design</span>
                                <CreditCard size={18} className="opacity-80" />
                            </div>

                            {/* Texture Overlay (Preview) */}
                            {texture !== 'none' && (
                                <div className="absolute inset-0 pointer-events-none opacity-50 z-20"
                                    style={{
                                        backgroundImage: texture === 'noise'
                                            ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
                                            : texture === 'dots'
                                                ? 'radial-gradient(var(--color-app-300) 1px, transparent 1px)'
                                                : texture === 'grid'
                                                    ? 'linear-gradient(var(--color-app-200) 1px, transparent 1px), linear-gradient(90deg, var(--color-app-200) 1px, transparent 1px)'
                                                    : 'none',
                                        backgroundSize: texture === 'dots' || texture === 'grid' ? '20px 20px' : 'auto',
                                    }}
                                >
                                    {texture === 'glass' && (
                                        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
                                    )}
                                </div>
                            )}

                            {/* Internal Elements using explicit vars to ensure update */}
                            <div className="p-4 space-y-3 relative z-10">
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-app-200)' }}>
                                        <User size={14} style={{ color: 'var(--color-app-500)' }} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="h-2 w-20 rounded-full" style={{ backgroundColor: 'var(--color-app-200)' }} />
                                        <div className="h-2 w-12 rounded-full" style={{ backgroundColor: 'var(--color-app-100)' }} />
                                    </div>
                                </div>
                                <div className="h-8 w-full border rounded-lg flex items-center justify-center text-xs font-bold transition-colors duration-200"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--color-primary), transparent 90%)',
                                        borderColor: 'color-mix(in srgb, var(--color-primary), transparent 80%)',
                                        color: 'var(--color-primary)'
                                    }}>
                                    Action Button
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-violet-400 font-mono mt-2 uppercase tracking-widest">
                            Vista Previa
                        </p>
                    </div>
                </div>
            </div>

            {/* Atmosphere / Texture Selector */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block">Atmósfera (Textura)</label>

                    {/* Texture Target Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                        {(['bg', 'card', 'both'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => update('textureTarget', t)}
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all focus:outline-none 
                                    ${textureTarget === t
                                        ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                                title={`Apply to ${t}`}
                            >
                                {t === 'bg' ? 'Fondo' : t === 'card' ? 'Tarjetas' : 'Ambos'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { id: 'none', label: 'Limpio', icon: Zap },
                        { id: 'noise', label: 'Ruido', icon: Layers },
                        { id: 'glass', label: 'Cristal', icon: Scan },
                        { id: 'dots', label: 'Puntos', icon: Grip },
                        { id: 'grid', label: 'Malla', icon: LayoutGrid }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => update('texture', item.id)}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${texture === item.id
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'}`}
                        >
                            <item.icon size={20} />
                            <span className="text-xs font-bold">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>



            {/* Border Style Selector */}
            <section>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 block">Estilo de Borde</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'clean', label: 'Limpio', desc: 'Minimalista' },
                        { id: 'contrast', label: 'Contraste', desc: 'Bordes fuertes' },
                        { id: 'shadow', label: 'Sombreado', desc: 'Profundidad' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => update('borderStyle', item.id)}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${borderStyle === item.id
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'}`}
                        >
                            <span className="text-xs font-bold">{item.label}</span>
                            <span className="text-[10px] opacity-70">{item.desc}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Custom Palette Engine */}
            <section>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 block">Motor de Color</label>

                <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-8">

                    {/* Hue Slider */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-semibold text-zinc-500">Tono (Color Base)</label>
                            <span className="text-xs font-mono text-zinc-400" style={{ color: `hsl(${hue}, 100%, 50%)` }}>{hue}°</span>
                        </div>
                        <div className="relative h-6 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                            {/* Rainbow Background */}
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} />

                            {/* Input */}
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={hue}
                                onChange={(e) => update('hue', parseInt(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />

                            {/* Visual Thumb */}
                            <div
                                className="absolute top-0 bottom-0 w-4 bg-white border-2 border-zinc-200 shadow-lg rounded-full pointer-events-none transition-transform duration-75 ease-out"
                                style={{
                                    left: `${(hue / 360) * 100}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Saturation Slider */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs font-semibold text-zinc-500">Intensidad (Saturación)</label>
                            <span className="text-xs font-mono text-zinc-400">{saturation}%</span>
                        </div>
                        <div className="relative h-6 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                            {/* Saturation Gradient (Gray -> Full Color) */}
                            <div className="absolute inset-0" style={{ background: `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))` }} />

                            {/* Input */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={saturation}
                                onChange={(e) => update('saturation', parseInt(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />

                            {/* Visual Thumb */}
                            <div
                                className="absolute top-0 bottom-0 w-4 bg-white border-2 border-zinc-200 shadow-lg rounded-full pointer-events-none transition-transform duration-75 ease-out"
                                style={{
                                    left: `${saturation}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Generated Palette Preview */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-2 block">Paleta Generada</label>
                        <div className="flex rounded-xl overflow-hidden h-8 ring-1 ring-black/5">
                            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(step => (
                                <div
                                    key={step}
                                    className="flex-1"
                                    style={{ backgroundColor: `var(--color-app-${step})` }}
                                    title={`Step ${step}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Texture Intensity Slider - Only show if not Clean */}
                    {/* Texture Intensity Slider - Only show if not Clean */}
                    {texture !== 'none' && (
                        <div className="mt-4 px-1">
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-xs font-semibold text-zinc-500">Fuerza del Efecto</label>
                                <span className="text-xs font-mono text-zinc-400">{textureIntensity}%</span>
                            </div>
                            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-75"
                                    style={{ width: `${textureIntensity}%` }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={textureIntensity}
                                    onChange={(e) => update('textureIntensity', parseInt(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function LayoutGrid(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    )
}
