import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Compass, Sliders, Moon, Sun, Check, Volume2, 
    VolumeX, Monitor, LogOut, ChevronRight, Lock, Zap,
    Palette, Loader2, X, FolderKanban
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useLocalNotifications } from '../../hooks/useLocalNotifications';
import { useCollaboration } from '../../context/CollaborationContext';
import { ACHIEVEMENTS, getTitleForLevel } from '../../context/GamificationConstants';
import { clsx } from 'clsx';
import { toast } from 'sonner';

const MobileSettings = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { profile: collabProfile, checkNicknameAvailability, registerNickname, invitations } = useCollaboration();
    const { 
        theme, toggleTheme, themeStyle, setThemeStyle, 
        customTheme, updateCustomTheme 
    } = useTheme();

    const { profile: gameProfile, achievements } = useGamification();
    const { isSoundEnabled, toggleSound } = useLocalNotifications();
    const { accessibility, updateAccessibility } = useSettings();

    // Expanded accordion states
    const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
    const [isColortlyOpen, setIsColortlyOpen] = useState(true);
    const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);

    const [newNick, setNewNick] = useState('');
    const [nickStatus, setNickStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [nickError, setNickError] = useState('');
    const [registering, setRegistering] = useState(false);
    const checkTimeout = useRef<any>(null);

    const handleInputNick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^a-zA-Z0-9_.\-\u00C0-\u017F\s]/g, '');
        setNewNick(val);
        setNickStatus('idle');
        setNickError('');

        if (checkTimeout.current) clearTimeout(checkTimeout.current);

        if (val.length < 3) return;

        setNickStatus('checking');
        checkTimeout.current = setTimeout(async () => {
            try {
                const available = await checkNicknameAvailability(val);
                setNickStatus(available ? 'available' : 'taken');
                if (!available) setNickError('Este nickname ya está registrado');
            } catch (err: any) {
                console.error("Check Nickname Error:", err);
                setNickStatus('idle');
            }
        }, 500);
    };

    const handleRegisterNick = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nickStatus !== 'available' || registering) return;

        setRegistering(true);
        try {
            await registerNickname(newNick);
            setNewNick('');
            setNickStatus('idle');
        } catch (err: any) {
            toast.error("Error de Registro", {
                description: err.message || "Hubo un problema al crear tu perfil."
            });
        } finally {
            setRegistering(false);
        }
    };

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    // Preset themes mapped
    const presets = [
        { id: 'neolux', name: 'Neo-Lux' },
        { id: 'classic', name: 'Soft Stone' },
        { id: 'brutalist', name: 'Brutalist' },
        { id: 'glassneon', name: 'Glass Neon' },
        { id: 'cyberpunk', name: 'Cyberpunk' }
    ];

    const currentLevel = gameProfile?.level || 1;
    const currentTitle = useMemo(() => {
        return getTitleForLevel(currentLevel);
    }, [currentLevel]);

    const handleForceDesktop = () => {
        triggerHaptic();
        localStorage.setItem('vaultly_preferred_view', 'desktop');
        toast.success('Cambiando a versión de escritorio...');
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 300);
    };

    const handleLogout = async () => {
        triggerHaptic();
        try {
            await logout();
            toast.success('Sesión cerrada correctamente');
            navigate('/login', { replace: true });
        } catch (err) {
            toast.error('Error al cerrar sesión');
        }
    };

    // Calculate level percent
    const levelPercent = useMemo(() => {
        if (!gameProfile?.nextLevelXP) return 0;
        return Math.min(100, (gameProfile.currentXP / gameProfile.nextLevelXP) * 100);
    }, [gameProfile]);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Ajustes Generales</span>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Menú y Diseño ⚙️</h1>
            </div>

            {/* Profile & Level section */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-black text-xl">
                        {collabProfile?.nickname?.charAt(0).toUpperCase() || 'V'}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                            {collabProfile?.nickname || 'Usuario de Vaultly'}
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-bold flex items-center gap-1 mt-0.5">
                            <Zap size={10} className="text-primary fill-current" />
                            {currentTitle}
                        </p>
                    </div>
                </div>

                {/* Level progress bar info */}
                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/20">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                        <span>Nivel {currentLevel}</span>
                        <span>{gameProfile?.currentXP || 0} / {gameProfile?.nextLevelXP || 100} XP</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${levelPercent}%` }} />
                    </div>
                </div>

                {/* Nickname setup if not present */}
                {!collabProfile && (
                    <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 space-y-2.5 mt-2 animate-in fade-in duration-200">
                        <div>
                            <span className="block text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Activar Identidad Colaborativa</span>
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5 leading-relaxed">
                                Define tu apodo para colaborar en bovedas en tiempo real.
                            </p>
                        </div>
                        <form onSubmit={handleRegisterNick} className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newNick}
                                    onChange={handleInputNick}
                                    placeholder="ej. apodo_movil"
                                    className={clsx(
                                        "w-full bg-white dark:bg-zinc-950 border rounded-xl px-3 py-2 text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono",
                                        nickStatus === 'taken' ? "border-rose-500" :
                                        nickStatus === 'available' ? "border-emerald-500" :
                                        "border-zinc-200 dark:border-zinc-800"
                                    )}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {nickStatus === 'checking' && <Loader2 className="animate-spin text-zinc-400" size={12} />}
                                    {nickStatus === 'available' && <Check className="text-emerald-500" size={12} />}
                                    {nickStatus === 'taken' && <X className="text-rose-500" size={12} />}
                                </div>
                            </div>
                            {nickError && <p className="text-[9px] text-rose-500 font-bold">{nickError}</p>}
                            <button
                                type="submit"
                                disabled={nickStatus !== 'available' || registering}
                                className={clsx(
                                    "w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                                    nickStatus === 'available'
                                        ? "bg-indigo-600 hover:bg-indigo-750 text-white cursor-pointer"
                                        : "bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-650 cursor-not-allowed"
                                )}
                            >
                                {registering ? <Loader2 className="animate-spin" size={10} /> : null}
                                <span>Guardar Apodo</span>
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Senda Financiera Link */}
            <button
                onClick={() => { triggerHaptic(); navigate('/m/gamification'); }}
                className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left active:scale-[0.99] transition-transform"
            >
                <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                    <Compass className="text-primary" size={20} />
                    <span className="text-xs font-black">Senda y Reliquias Financieras</span>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
            </button>

            {/* Proyectos Colaborativos Link */}
            <button
                onClick={() => { triggerHaptic(); navigate('/m/projects'); }}
                className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left active:scale-[0.99] transition-transform"
            >
                <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                    <FolderKanban className="text-indigo-500" size={20} />
                    <span className="text-xs font-black">Proyectos Colaborativos</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {invitations.length > 0 && (
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            {invitations.length}
                        </span>
                    )}
                    <ChevronRight size={16} className="text-zinc-400" />
                </div>
            </button>

            {/* Accessibility Accordion */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm overflow-hidden">
                <button
                    onClick={() => { triggerHaptic(); setIsAccessibilityOpen(!isAccessibilityOpen); }}
                    className="w-full p-4 flex justify-between items-center text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/80 active:bg-zinc-105"
                >
                    <div className="flex items-center gap-2.5">
                        <Sliders className="text-primary" size={20} />
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">Accesibilidad</span>
                    </div>
                    <ChevronRight 
                        size={18} 
                        className={clsx("text-zinc-400 transition-transform duration-200", isAccessibilityOpen && "rotate-90")} 
                    />
                </button>

                <AnimatePresence>
                    {isAccessibilityOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800/50 pt-4 space-y-4"
                        >
                            {/* Font Size Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Tamaño del Texto</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'small', label: 'Chico' },
                                        { id: 'medium', label: 'Mediano' },
                                        { id: 'large', label: 'Grande' }
                                    ].map(sz => (
                                        <button
                                            key={sz.id}
                                            onClick={() => { triggerHaptic(); updateAccessibility({ fontSize: sz.id as any }); }}
                                            className={clsx(
                                                "py-2 rounded-xl text-[10px] font-black border transition-all",
                                                accessibility.fontSize === sz.id
                                                    ? "border-primary bg-primary text-white shadow-sm"
                                                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                                            )}
                                        >
                                            {sz.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Spacing Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Espaciado e Interfaz</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'compact', label: 'Compacto' },
                                        { id: 'standard', label: 'Estándar' },
                                        { id: 'cozy', label: 'Cómodo' }
                                    ].map(sp => (
                                        <button
                                            key={sp.id}
                                            onClick={() => { triggerHaptic(); updateAccessibility({ spacing: sp.id as any }); }}
                                            className={clsx(
                                                "py-2 rounded-xl text-[10px] font-black border transition-all",
                                                accessibility.spacing === sp.id
                                                    ? "border-primary bg-primary text-white shadow-sm"
                                                    : "border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400"
                                            )}
                                        >
                                            {sp.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* High Contrast Toggle */}
                            <div className="flex justify-between items-center pt-2">
                                <div>
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Alto Contraste</span>
                                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block">Forzar colores de alta legibilidad</span>
                                </div>
                                <button
                                    onClick={() => {
                                        triggerHaptic();
                                        updateAccessibility({ highContrast: !accessibility.highContrast });
                                    }}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-xl text-xs font-black transition-all border",
                                        accessibility.highContrast
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300"
                                    )}
                                >
                                    {accessibility.highContrast ? 'Activo' : 'Inactivo'}
                                </button>
                            </div>

                            {/* Sound Effects Toggle */}
                            <div className="flex justify-between items-center pt-2">
                                <div>
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Efectos de Sonido</span>
                                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block">Alertas sonoras en la app</span>
                                </div>
                                <button
                                    onClick={() => {
                                        triggerHaptic();
                                        updateAccessibility({ soundEffects: !accessibility.soundEffects });
                                    }}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-xl text-xs font-black transition-all border",
                                        accessibility.soundEffects
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300"
                                    )}
                                >
                                    {accessibility.soundEffects ? 'Habilitado' : 'Deshabilitado'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Colortly Theme Studio Accordion */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm overflow-hidden">
                <button
                    onClick={() => { triggerHaptic(); setIsColortlyOpen(!isColortlyOpen); }}
                    className="w-full p-4 flex justify-between items-center text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/80 active:bg-zinc-105"
                >
                    <div className="flex items-center gap-2.5">
                        <Palette className="text-primary" size={20} />
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">Estudio Colortly Móvil</span>
                    </div>
                    <ChevronRight 
                        size={18} 
                        className={clsx("text-zinc-400 transition-transform duration-200", isColortlyOpen && "rotate-90")} 
                    />
                </button>

                <AnimatePresence>
                    {isColortlyOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800/50 pt-4 space-y-5"
                        >
                            {/* Dark/Light Mode toggle */}
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Modo de Interfaz</span>
                                <button
                                    onClick={() => { triggerHaptic(); toggleTheme(); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl active:scale-95 text-xs font-black text-zinc-700 dark:text-zinc-300"
                                >
                                    {theme === 'dark' ? (
                                        <>
                                            <Moon size={14} /> Oscuro
                                        </>
                                    ) : (
                                        <>
                                            <Sun size={14} /> Claro
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Preset Themes Grid */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Ajustes Predefinidos</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {presets.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { triggerHaptic(); setThemeStyle(p.id as any); }}
                                            className={clsx(
                                                "py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left",
                                                themeStyle === p.id 
                                                    ? "border-primary bg-primary/10 text-primary" 
                                                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-450"
                                            )}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Sliders for Hue & Saturation */}
                            <div className="space-y-4 pt-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                                        <span>TONALIDAD (HUE)</span>
                                        <span>{customTheme.hue}°</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="360" 
                                        value={customTheme.hue} 
                                        onChange={e => updateCustomTheme({ hue: Number(e.target.value) })}
                                        className="w-full accent-primary h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                                        <span>SATURACIÓN</span>
                                        <span>{customTheme.saturation}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={customTheme.saturation} 
                                        onChange={e => updateCustomTheme({ saturation: Number(e.target.value) })}
                                        className="w-full accent-primary h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                                        <span>DIFUMINADO DE CRISTAL (BLUR)</span>
                                        <span>{customTheme.glassBlur}px</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="30" 
                                        value={customTheme.glassBlur} 
                                        onChange={e => updateCustomTheme({ glassBlur: Number(e.target.value) })}
                                        className="w-full accent-primary h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                                        <span>TRANSPARENCIA (OPACIDAD)</span>
                                        <span>{customTheme.glassOpacity}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        value={customTheme.glassOpacity} 
                                        onChange={e => updateCustomTheme({ glassOpacity: Number(e.target.value) })}
                                        className="w-full accent-primary h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
                                    />
                                </div>

                                {/* Roundedness Selector */}
                                <div className="space-y-2 pt-1">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">Redondez de Esquinas</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'none', label: 'Retro' },
                                            { id: 'md', label: 'Mediano' },
                                            { id: 'xl', label: 'Píldora' }
                                        ].map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => { triggerHaptic(); updateCustomTheme({ radius: r.id as any }); }}
                                                className={clsx(
                                                    "py-2 rounded-xl text-[10px] font-black border transition-all",
                                                    customTheme.radius === r.id
                                                        ? "border-primary bg-primary text-white shadow-sm"
                                                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                                                )}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* App settings: Sound effects */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Efectos de Sonido</span>
                <button
                    onClick={() => {
                        triggerHaptic();
                        toggleSound(!isSoundEnabled);
                        toast.info(isSoundEnabled ? 'Sonidos desactivados' : 'Sonidos activados');
                    }}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl active:scale-95 text-zinc-650 dark:text-zinc-300"
                >
                    {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
            </div>

            {/* View options: Force Desktop */}
            <button
                onClick={handleForceDesktop}
                className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left active:scale-[0.99] transition-transform"
            >
                <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                    <Monitor size={18} />
                    <span className="text-xs font-bold">Forzar Vista de Escritorio</span>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
            </button>

            {/* Logout button */}
            <button
                onClick={handleLogout}
                className="w-full py-4 bg-rose-500 text-white rounded-3xl font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
                <LogOut size={16} /> Cerrar Sesión
            </button>
        </div>
    );
};

export default MobileSettings;
