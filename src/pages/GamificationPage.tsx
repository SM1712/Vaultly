import { useState, useMemo } from 'react';
import { useGamification } from '../context/GamificationContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { 
    calculateArchetype, 
    getPathTitle, 
    calculatePathNextLevelXP, 
    PATHS,
    calculateNextLevelXP
} from '../context/GamificationConstants';
import { 
    PiggyBank, ShieldCheck, TrendingUp, Sparkles, Shield, Compass, Trophy, Lock, CheckCircle
} from 'lucide-react';
import { GAMIFICATION_ICONS } from '../components/gamification/GamificationIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export const GamificationPage = () => {
    const { profile, achievements, claimQuestXp } = useGamification();
    const { user } = useAuth();
    const { currency } = useSettings();

    // Active path for detailed view (defaults to 'saving')
    const [selectedPath, setSelectedPath] = useState<'saving' | 'discipline' | 'growth'>('saving');
    
    // Quests filter ('daily' | 'weekly' | 'saga')
    const [questTab, setQuestTab] = useState<'daily' | 'weekly' | 'saga'>('daily');

    // Extract path stats
    const savingLvl = profile?.savingLevel || 1;
    const savingXP = profile?.savingXP || 0;
    const savingMax = calculatePathNextLevelXP(savingLvl);

    const disciplineLvl = profile?.disciplineLevel || 1;
    const disciplineXP = profile?.disciplineXP || 0;
    const disciplineMax = calculatePathNextLevelXP(disciplineLvl);

    const growthLvl = profile?.growthLevel || 1;
    const growthXP = profile?.growthXP || 0;
    const growthMax = calculatePathNextLevelXP(growthLvl);

    // Dynamic Archetype calculation
    const archetype = useMemo(() => {
        return calculateArchetype(savingLvl, disciplineLvl, growthLvl);
    }, [savingLvl, disciplineLvl, growthLvl]);

    // Active quests based on tab
    const filteredQuests = useMemo(() => {
        return (profile?.activeQuests || []).filter(q => q.type === questTab);
    }, [profile?.activeQuests, questTab]);

    // Relic status helper
    const isRelicUnlocked = (id: string) => {
        return (profile?.unlockedAchievements || []).some(ua => ua.achievementId === id);
    };

    // Sort: Unlocked first, then by rarity weight
    const sortedRelics = useMemo(() => {
        return [...achievements].sort((a, b) => {
            const aUnlocked = isRelicUnlocked(a.id);
            const bUnlocked = isRelicUnlocked(b.id);
            if (aUnlocked && !bUnlocked) return -1;
            if (!aUnlocked && bUnlocked) return 1;

            const rarityWeight = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
            return rarityWeight[b.rarity] - rarityWeight[a.rarity];
        });
    }, [achievements, profile?.unlockedAchievements]);

    // Dynamic radar chart calculations for the SVG triangle
    const radarPolygonPoints = useMemo(() => {
        // Base triangle center is (100, 105)
        // Vertices represent:
        // Top: Discipline (0, -60) -> (100, 45)
        // Bottom Right: Growth (52, 30) -> (152, 135)
        // Bottom Left: Saving (-52, 30) -> (48, 135)
        const cx = 100;
        const cy = 105;
        const maxLevelVal = Math.max(savingLvl, disciplineLvl, growthLvl, 10); // Scale relative to max level or at least 10

        const sFactor = savingLvl / maxLevelVal;
        const dFactor = disciplineLvl / maxLevelVal;
        const gFactor = growthLvl / maxLevelVal;

        // Calculate points
        const disciplinePt = { x: cx, y: cy - 70 * dFactor };
        const growthPt = { x: cx + 60.6 * gFactor, y: cy + 35 * gFactor };
        const savingPt = { x: cx - 60.6 * sFactor, y: cy + 35 * sFactor };

        return `${disciplinePt.x},${disciplinePt.y} ${growthPt.x},${growthPt.y} ${savingPt.x},${savingPt.y}`;
    }, [savingLvl, disciplineLvl, growthLvl]);

    // Path level ups progress bar percentages
    const pathPercent = (xp: number, max: number) => Math.min(100, (xp / max) * 100);

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-500">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block">Progreso de la Riqueza</span>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50">Senda Financiera</h1>
                </div>
                <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/50 px-4 py-2.5 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-zinc-950 font-black text-lg border border-amber-300">
                        {profile?.level || 1}
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-zinc-850 dark:text-white leading-none">Nivel Global</h4>
                        <span className="text-[10px] text-zinc-400 font-bold block mt-1">
                            {profile?.currentXP || 0} / {profile?.nextLevelXP || 150} XP
                        </span>
                    </div>
                </div>
            </div>

            {/* Bóveda Celestial Interactive Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Visual Crystal Vault (6 columns) */}
                <div className="lg:col-span-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-800/40 rounded-[2rem] p-6 shadow-sm flex flex-col justify-center items-center relative overflow-hidden min-h-[420px]">
                    {/* Cosmic Background star grid */}
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/20 to-indigo-500/[0.02] dark:from-zinc-950/20 dark:to-indigo-500/[0.04] pointer-events-none" />
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/[0.06] dark:bg-indigo-500/[0.08] filter blur-3xl pointer-events-none animate-pulse" />

                    <h3 className="text-xs font-black text-indigo-500/80 dark:text-indigo-400/80 uppercase tracking-[0.2em] mb-8 z-10 text-center">
                        La Bóveda Celestial
                    </h3>

                    {/* Interactive Crystals & Cosmic Core */}
                    <div className="relative w-72 h-72 flex items-center justify-center z-10">
                        
                        {/* Central Energy Core representing Overall Level - FIXED text rotation */}
                        <div className="absolute w-28 h-28 flex items-center justify-center">
                            {/* Outer Spinning Cosmic Rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                                className="absolute inset-0 rounded-full border border-dashed border-indigo-500/25 dark:border-indigo-500/15"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                                className="absolute w-20 h-20 rounded-full border border-dashed border-emerald-500/20 dark:border-emerald-500/10"
                            />
                            
                            {/* Inner Glowing Core - DOES NOT ROTATE */}
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.15)] dark:shadow-[0_0_35px_rgba(99,102,241,0.1)] z-10"
                            >
                                <span className="text-[8px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">LVL</span>
                                <span className="text-xl font-black text-zinc-800 dark:text-white leading-none mt-0.5">{profile?.level || 1}</span>
                            </motion.div>
                        </div>

                        {/* Top: discipline crystal (Blue) */}
                        <motion.button
                            onClick={() => setSelectedPath('discipline')}
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 3.2, delay: 0.1 }}
                            className="absolute top-2 flex flex-col items-center focus:outline-none"
                        >
                            <div className={clsx(
                                "w-16 h-22 rounded-2xl flex items-center justify-center transition-all duration-300 border relative overflow-hidden",
                                selectedPath === 'discipline' 
                                    ? 'bg-indigo-500/15 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.4)] dark:shadow-[0_0_35px_rgba(99,102,241,0.25)] scale-110' 
                                    : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-850 opacity-60 hover:opacity-100 hover:scale-105'
                            )}>
                                {/* Glass Reflections */}
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 dark:from-white/5 to-transparent rounded-t-2xl pointer-events-none" />
                                <div className="absolute inset-px rounded-[14px] border border-white/20 dark:border-white/5 pointer-events-none" />
                                <div className="absolute -bottom-10 w-16 h-16 rounded-full bg-indigo-500/20 blur-md pointer-events-none" />

                                <ShieldCheck className={clsx(
                                    "w-8 h-8 drop-shadow-[0_2px_5px_rgba(0,0,0,0.1)] relative z-10 transition-transform duration-300",
                                    selectedPath === 'discipline' ? 'text-indigo-500 dark:text-indigo-450 scale-110' : 'text-zinc-500 dark:text-zinc-400'
                                )} />
                            </div>
                            <span className={clsx(
                                "text-[9px] font-black mt-2.5 uppercase tracking-widest transition-colors",
                                selectedPath === 'discipline' ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
                            )}>Disciplina</span>
                        </motion.button>

                        {/* Bottom Left: saving crystal (Green) */}
                        <motion.button
                            onClick={() => setSelectedPath('saving')}
                            animate={{ y: [0, 4, 0], x: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 3.6, delay: 0.3 }}
                            className="absolute bottom-2 left-2 flex flex-col items-center focus:outline-none"
                        >
                            <div className={clsx(
                                "w-16 h-22 rounded-2xl flex items-center justify-center transition-all duration-300 border relative overflow-hidden",
                                selectedPath === 'saving' 
                                    ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] dark:shadow-[0_0_35px_rgba(16,185,129,0.25)] scale-110' 
                                    : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-850 opacity-60 hover:opacity-100 hover:scale-105'
                            )}>
                                {/* Glass Reflections */}
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 dark:from-white/5 to-transparent rounded-t-2xl pointer-events-none" />
                                <div className="absolute inset-px rounded-[14px] border border-white/20 dark:border-white/5 pointer-events-none" />
                                <div className="absolute -bottom-10 w-16 h-16 rounded-full bg-emerald-500/20 blur-md pointer-events-none" />

                                <PiggyBank className={clsx(
                                    "w-8 h-8 drop-shadow-[0_2px_5px_rgba(0,0,0,0.1)] relative z-10 transition-transform duration-300",
                                    selectedPath === 'saving' ? 'text-emerald-500 dark:text-emerald-450 scale-110' : 'text-zinc-500 dark:text-zinc-400'
                                )} />
                            </div>
                            <span className={clsx(
                                "text-[9px] font-black mt-2.5 uppercase tracking-widest transition-colors",
                                selectedPath === 'saving' ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                            )}>Ahorro</span>
                        </motion.button>

                        {/* Bottom Right: growth crystal (Gold) */}
                        <motion.button
                            onClick={() => setSelectedPath('growth')}
                            animate={{ y: [0, 4, 0], x: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 3.6, delay: 0.5 }}
                            className="absolute bottom-2 right-2 flex flex-col items-center focus:outline-none"
                        >
                            <div className={clsx(
                                "w-16 h-22 rounded-2xl flex items-center justify-center transition-all duration-300 border relative overflow-hidden",
                                selectedPath === 'growth' 
                                    ? 'bg-amber-500/15 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.4)] dark:shadow-[0_0_35px_rgba(245,158,11,0.25)] scale-110' 
                                    : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-850 opacity-60 hover:opacity-100 hover:scale-105'
                            )}>
                                {/* Glass Reflections */}
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 dark:from-white/5 to-transparent rounded-t-2xl pointer-events-none" />
                                <div className="absolute inset-px rounded-[14px] border border-white/20 dark:border-white/5 pointer-events-none" />
                                <div className="absolute -bottom-10 w-16 h-16 rounded-full bg-amber-500/20 blur-md pointer-events-none" />

                                <TrendingUp className={clsx(
                                    "w-8 h-8 drop-shadow-[0_2px_5px_rgba(0,0,0,0.1)] relative z-10 transition-transform duration-300",
                                    selectedPath === 'growth' ? 'text-amber-500 dark:text-amber-450 scale-110' : 'text-zinc-500 dark:text-zinc-400'
                                )} />
                            </div>
                            <span className={clsx(
                                "text-[9px] font-black mt-2.5 uppercase tracking-widest transition-colors",
                                selectedPath === 'growth' ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-500'
                            )}>Crecimiento</span>
                        </motion.button>

                    </div>

                    <div className="mt-6 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-full relative z-10">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">
                            Toca un cristal para ver estadísticas del camino.
                        </p>
                    </div>
                </div>

                {/* Selected Senda Detail Card (6 columns) */}
                <div className="lg:col-span-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-800/40 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
                    
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedPath}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Path Title & Level info */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                                        selectedPath === 'saving' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                        selectedPath === 'discipline' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                    )}>
                                        {selectedPath === 'saving' ? <PiggyBank size={20} /> :
                                         selectedPath === 'discipline' ? <ShieldCheck size={20} /> :
                                         <TrendingUp size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-zinc-850 dark:text-white leading-tight">
                                            {PATHS[selectedPath].label}
                                        </h3>
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold block mt-0.5">
                                            Rango: {getPathTitle(selectedPath, selectedPath === 'saving' ? savingLvl : selectedPath === 'discipline' ? disciplineLvl : growthLvl)}
                                        </span>
                                    </div>
                                </div>
                                <span className={clsx(
                                    "px-3 py-1.5 rounded-xl text-xs font-black border",
                                    selectedPath === 'saving' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                    selectedPath === 'discipline' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                                    'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                )}>
                                    Nivel {selectedPath === 'saving' ? savingLvl : selectedPath === 'discipline' ? disciplineLvl : growthLvl}
                                </span>
                            </div>

                            {/* Path Description */}
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                {PATHS[selectedPath].description}
                            </p>

                            {/* Path XP Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-wide">
                                    <span>Puntos de Experiencia</span>
                                    <span>
                                        {selectedPath === 'saving' ? `${savingXP}/${savingMax}` :
                                         selectedPath === 'discipline' ? `${disciplineXP}/${disciplineMax}` :
                                         `${growthXP}/${growthMax}`} XP
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-800/80">
                                    <div
                                        className={clsx(
                                            "h-full rounded-full transition-all duration-700 ease-out",
                                            selectedPath === 'saving' ? 'bg-emerald-500' :
                                            selectedPath === 'discipline' ? 'bg-indigo-500' :
                                            'bg-amber-500'
                                        )}
                                        style={{ 
                                            width: `${pathPercent(
                                                selectedPath === 'saving' ? savingXP : selectedPath === 'discipline' ? disciplineXP : growthXP,
                                                selectedPath === 'saving' ? savingMax : selectedPath === 'discipline' ? disciplineMax : growthMax
                                            )}%` 
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Path Tips / How to level up */}
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800/30 rounded-2xl p-4 space-y-3">
                                <span className="text-[10px] font-black text-zinc-450 uppercase tracking-widest block">¿Cómo subir este nivel?</span>
                                <ul className="space-y-2 text-xs font-semibold text-zinc-650 dark:text-zinc-400">
                                    {selectedPath === 'saving' && (
                                        <>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                <span>Realiza aportes frecuentes a tus metas de ahorro.</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                <span>Crea y engrosa fondos de emergencia.</span>
                                            </li>
                                        </>
                                    )}
                                    {selectedPath === 'discipline' && (
                                        <>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                                <span>Registra tus gastos e ingresos diariamente.</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                                <span>Consigue perfectos meses de presupuestos.</span>
                                            </li>
                                        </>
                                    )}
                                    {selectedPath === 'growth' && (
                                        <>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                <span>Realiza abonos a capital de deudas activas.</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                <span>Financia y completa proyectos de inversión en el simulador.</span>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Path summary pill indicator footer */}
                    <div className="grid grid-cols-3 gap-2 mt-6">
                        {(['saving', 'discipline', 'growth'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setSelectedPath(p)}
                                className={clsx(
                                    "py-2 rounded-xl text-[10px] font-black border transition-all text-center",
                                    selectedPath === p
                                        ? p === 'saving' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                          p === 'discipline' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                                          'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                                )}
                            >
                                {p === 'saving' ? 'AHORRO' : p === 'discipline' ? 'DISCIPLINA' : 'CRECIMIENTO'}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Archetype details & Radar Graph Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Holographic Archetype Card (7 columns) */}
                <div className="lg:col-span-7 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-800/40 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden items-center justify-between">
                    
                    {/* Animated Holographic Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

                    <div className="space-y-4 max-w-sm text-center md:text-left">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Arquetipo Financiero</span>
                        <h3 className="text-xl font-black text-zinc-850 dark:text-white leading-tight flex items-center justify-center md:justify-start gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                {archetype.id === 'alchemist' ? <Sparkles size={18} /> :
                                 archetype.id === 'guardian' ? <Shield size={18} /> :
                                 archetype.id === 'architect' ? <Compass size={18} /> :
                                 <TrendingUp size={18} />}
                            </span>
                            {archetype.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                            {archetype.description}
                        </p>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-150 dark:border-zinc-800/30 rounded-xl">
                            <p className="text-[11px] italic text-zinc-400 dark:text-zinc-500 leading-normal font-medium">
                                "{archetype.lore}"
                            </p>
                        </div>
                    </div>

                    {/* Radar SVG Graph display */}
                    <div className="relative shrink-0 w-48 h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50">
                        <svg className="w-40 h-40" viewBox="0 0 200 200">
                            {/* Inner web lines */}
                            <polygon points="100,45 152,135 48,135" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1.5" />
                            <polygon points="100,75 126,120 74,120" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/40" strokeWidth="1" strokeDasharray="3" />
                            
                            {/* Inner web lines axes */}
                            <line x1="100" y1="105" x2="100" y2="45" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="1" />
                            <line x1="100" y1="105" x2="152" y2="135" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="1" />
                            <line x1="100" y1="105" x2="48" y2="135" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="1" />

                            {/* Label text */}
                            <text x="100" y="32" textAnchor="middle" className="text-[9px] font-black fill-zinc-400 dark:fill-zinc-600">DISCIPLINA</text>
                            <text x="175" y="148" textAnchor="middle" className="text-[9px] font-black fill-zinc-400 dark:fill-zinc-600">CRECIMIENTO</text>
                            <text x="25" y="148" textAnchor="middle" className="text-[9px] font-black fill-zinc-400 dark:fill-zinc-600">AHORRO</text>

                            {/* Filled polygon based on user data */}
                            <polygon 
                                points={radarPolygonPoints} 
                                fill="rgba(99, 102, 241, 0.2)" 
                                stroke="#6366f1" 
                                strokeWidth="2"
                                className="transition-all duration-1000 ease-out"
                            />
                            
                            {/* Glowing Vertex Dots */}
                            <circle cx="100" cy="105" r="3" fill="#6366f1" />
                        </svg>
                    </div>

                </div>

                {/* Relics Chambers preview (5 columns) */}
                <div className="lg:col-span-5 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-800/40 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between items-center text-center">
                    <div className="space-y-2 w-full">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Cámara de Logros</span>
                        <h3 className="text-lg font-black text-zinc-850 dark:text-white leading-tight">Colección de Reliquias</h3>
                        
                        <div className="py-6 flex items-center justify-center">
                            <div className="relative w-28 h-28 flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-white/10 rounded-full shadow-inner animate-[pulse_3s_infinite]">
                                <Trophy className="w-12 h-12 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                            </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-950/30 rounded-xl p-3 text-xs font-bold text-zinc-500">
                            Has revelado <span className="text-indigo-500 font-black">{(profile?.unlockedAchievements || []).length} de {achievements.length}</span> reliquias sagradas en tu camino.
                        </div>
                    </div>
                </div>

            </div>

            {/* Quests board (Pizarra de Misiones) */}
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-800/40 rounded-[2rem] p-6 shadow-sm space-y-6">
                
                {/* Header Board & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/40 dark:border-zinc-800/40 pb-4">
                    <div>
                        <h3 className="text-lg font-black text-zinc-850 dark:text-white">Pizarra de Misiones</h3>
                        <p className="text-xs text-zinc-400 font-bold mt-1">Completa contratos para ganar XP de caminos específicos</p>
                    </div>

                    {/* Quest filters buttons */}
                    <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 self-start md:self-auto">
                        {(['daily', 'weekly', 'saga'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setQuestTab(tab)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-xs font-black transition-all uppercase",
                                    questTab === tab
                                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/10"
                                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                {tab === 'daily' ? 'Diarias' : tab === 'weekly' ? 'Semanales' : 'Sagas (Largo Plazo)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quests list */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredQuests.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-zinc-400 font-bold">
                                No hay misiones activas en este momento.
                            </div>
                        ) : (
                            filteredQuests.map((quest) => {
                                const QIcon = quest.xpType === 'saving' ? PiggyBank :
                                              quest.xpType === 'discipline' ? ShieldCheck :
                                              TrendingUp;
                                const pathColor = quest.xpType === 'saving' ? 'text-emerald-500' :
                                                  quest.xpType === 'discipline' ? 'text-indigo-500' :
                                                  'text-amber-500';
                                
                                return (
                                    <motion.div
                                        key={quest.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className={clsx(
                                            "border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 shadow-sm relative overflow-hidden",
                                            quest.claimed 
                                                ? "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-900 opacity-60" 
                                                : quest.completed 
                                                    ? "bg-indigo-500/5 border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]" 
                                                    : "bg-white dark:bg-zinc-950/30 border-zinc-200/50 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="space-y-3">
                                            {/* Icon & Type */}
                                            <div className="flex justify-between items-center">
                                                <span className={clsx(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center border",
                                                    quest.xpType === 'saving' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    quest.xpType === 'discipline' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                )}>
                                                    <QIcon size={16} />
                                                </span>
                                                <span className="text-[10px] font-black tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                                                    +{quest.xpReward} XP
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div>
                                                <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                                                    {quest.title}
                                                </h4>
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold leading-normal mt-1">
                                                    {quest.description}
                                                </p>
                                                
                                                {/* Quest lore / requirements detail (for sagas mainly) */}
                                                {quest.requirementsDescription && (
                                                    <div className="mt-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-[10px] text-zinc-450 dark:text-zinc-500 font-bold border border-zinc-200/10">
                                                        {quest.requirementsDescription}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar & Buttons */}
                                        <div className="mt-4 pt-3 border-t border-zinc-200/20 dark:border-zinc-800/30 flex items-center justify-between gap-4">
                                            
                                            {/* Progress text */}
                                            <div className="text-[10px] font-black text-zinc-400">
                                                Progreso: <span className="text-zinc-700 dark:text-zinc-300 font-black">
                                                    {quest.type === 'saga' && quest.id === 'saga_card' 
                                                        ? `${quest.current}/3` // Clean display
                                                        : quest.id === 'weekly_save'
                                                            ? `${currency}${quest.current}/${quest.target}`
                                                            : `${quest.current}/${quest.target}`}
                                                </span>
                                            </div>

                                            {/* Action Button */}
                                            {quest.claimed ? (
                                                <span className="text-[10px] font-black text-zinc-450 uppercase flex items-center gap-1">
                                                    <CheckCircle size={12} className="text-emerald-500" /> Reclamada
                                                </span>
                                            ) : quest.completed ? (
                                                <button
                                                    onClick={() => claimQuestXp(quest.id)}
                                                    className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-[10px] font-black rounded-lg transition-all shadow-md shadow-indigo-500/20"
                                                >
                                                    RECLAMAR XP
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black text-zinc-400 uppercase">
                                                    En Curso...
                                                </span>
                                            )}

                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* Relics list showcase (Cámara de Reliquias) */}
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-800/40 rounded-[2rem] p-6 shadow-sm space-y-6">
                <div>
                    <h3 className="text-lg font-black text-zinc-850 dark:text-white">La Cámara de Reliquias</h3>
                    <p className="text-xs text-zinc-400 font-bold mt-1">Expositor de tesoros y logros míticos desbloqueados</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {sortedRelics.map(relic => {
                        const unlocked = isRelicUnlocked(relic.id);
                        const RelicIcon = GAMIFICATION_ICONS[relic.icon] || Trophy;
                        
                        // Rarity colors mapping
                        const rarityColor = 
                            relic.rarity === 'legendary' ? 'text-amber-500 border-amber-500/35 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.1)]' :
                            relic.rarity === 'epic' ? 'text-purple-500 border-purple-500/35 bg-purple-500/5' :
                            relic.rarity === 'rare' ? 'text-blue-500 border-blue-500/35 bg-blue-500/5' :
                            relic.rarity === 'uncommon' ? 'text-emerald-500 border-emerald-500/35 bg-emerald-500/5' :
                            'text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30';

                        // Hidden relic handling
                        if (relic.isHidden && !unlocked) {
                            return (
                                <div 
                                    key={relic.id}
                                    className="border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-100/30 dark:bg-zinc-900/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center opacity-40 min-h-[140px]"
                                >
                                    <Lock size={20} className="text-zinc-400 dark:text-zinc-650" />
                                    <h5 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 mt-2 uppercase tracking-wide">Misterio</h5>
                                    <span className="text-[8px] text-zinc-400 block mt-1">Continúa explorando</span>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={relic.id}
                                className={clsx(
                                    "border p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[140px] relative group cursor-help",
                                    unlocked 
                                        ? rarityColor 
                                        : "border-zinc-200/50 dark:border-zinc-800/80 bg-zinc-50/10 dark:bg-zinc-950/20 opacity-30 grayscale"
                                )}
                            >
                                {/* Hologram floating light on hover */}
                                {unlocked && (
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                )}

                                <motion.div
                                    animate={unlocked ? { y: [0, -3, 0] } : {}}
                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                    className="mb-2"
                                >
                                    <RelicIcon size={28} strokeWidth={1.5} />
                                </motion.div>

                                <h5 className={clsx(
                                    "text-xs font-black truncate w-full",
                                    unlocked ? "text-zinc-800 dark:text-zinc-250" : "text-zinc-500"
                                )}>
                                    {relic.title}
                                </h5>

                                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mt-1 block">
                                    {relic.rarity}
                                </span>

                                {/* Tooltip details on hover */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col w-48 p-2.5 bg-zinc-900 text-white rounded-xl text-[10px] text-left border border-white/10 shadow-xl pointer-events-none z-30 animate-in fade-in duration-150">
                                    <span className="font-black text-amber-400 uppercase tracking-wide block mb-0.5">Reliquia</span>
                                    <span className="font-bold text-[11px] block">{relic.title}</span>
                                    <p className="text-zinc-400 mt-1 font-semibold leading-normal">{relic.description}</p>
                                    {unlocked && (
                                        <p className="text-indigo-300 italic mt-1.5 font-medium leading-normal border-t border-white/5 pt-1.5">
                                            "{relic.relicLore}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};
export default GamificationPage;
