import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { 
    calculateArchetype, 
    getPathTitle, 
    calculatePathNextLevelXP, 
    PATHS
} from '../../context/GamificationConstants';
import { GAMIFICATION_ICONS } from '../../components/gamification/GamificationIcons';
import { 
    Compass, ShieldCheck, PiggyBank, TrendingUp, Lock, Check,
    Trophy, ChevronLeft, ChevronDown, Zap, HelpCircle, 
    CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const MobileGamification = () => {
    const navigate = useNavigate();
    const { profile, achievements, claimQuestXp } = useGamification();
    const { user } = useAuth();
    const { currency } = useSettings();

    // Active path details
    const [selectedPath, setSelectedPath] = useState<'saving' | 'discipline' | 'growth'>('saving');
    
    // Quests filter ('daily' | 'weekly' | 'saga')
    const [questTab, setQuestTab] = useState<'daily' | 'weekly' | 'saga'>('daily');

    // Selected relic state for Bottom Sheet
    const [selectedRelic, setSelectedRelic] = useState<any | null>(null);

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

    // Radar points
    const radarPolygonPoints = useMemo(() => {
        const cx = 100;
        const cy = 105;
        const maxLevelVal = Math.max(savingLvl, disciplineLvl, growthLvl, 10);

        const sFactor = savingLvl / maxLevelVal;
        const dFactor = disciplineLvl / maxLevelVal;
        const gFactor = growthLvl / maxLevelVal;

        const disciplinePt = { x: cx, y: cy - 70 * dFactor };
        const growthPt = { x: cx + 60.6 * gFactor, y: cy + 35 * gFactor };
        const savingPt = { x: cx - 60.6 * sFactor, y: cy + 35 * sFactor };

        return `${disciplinePt.x},${disciplinePt.y} ${growthPt.x},${growthPt.y} ${savingPt.x},${savingPt.y}`;
    }, [savingLvl, disciplineLvl, growthLvl]);

    const pathPercent = (xp: number, max: number) => Math.min(100, (xp / max) * 100);

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(35);
        }
    };

    const handleClaim = (questId: string) => {
        triggerHaptic();
        claimQuestXp(questId);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Banner */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => { triggerHaptic(); navigate(-1); }}
                        className="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 active:scale-90 transition-transform"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Camino de Sabiduría</span>
                        <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Senda Financiera 🧭</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 px-3 py-1.5 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-zinc-955 font-black text-sm border border-amber-300">
                        {profile?.level || 1}
                    </div>
                    <div className="text-left">
                        <span className="text-[9px] font-black text-zinc-400 uppercase block leading-none">Global</span>
                        <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold block mt-0.5">
                            {profile?.currentXP || 0}/{profile?.nextLevelXP || 150} XP
                        </span>
                    </div>
                </div>
            </div>

            {/* Bóveda Celestial Interactive Layout Container */}
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[340px]">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.01] to-transparent pointer-events-none" />
                
                <h3 className="text-[10px] font-black text-indigo-500/80 dark:text-indigo-400/80 uppercase tracking-[0.25em] mb-4 z-10 text-center">
                    La Bóveda Celestial
                </h3>

                {/* Interactive Crystals Circle */}
                <div className="relative w-60 h-60 flex items-center justify-center z-10">
                    {/* Overall Level Core */}
                    <div className="absolute w-24 h-24 flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                            className="absolute inset-0 rounded-full border border-dashed border-indigo-500/20 dark:border-indigo-500/10"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                            className="absolute w-16 h-16 rounded-full border border-dashed border-emerald-500/15 dark:border-emerald-500/5"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.04, 1] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            className="w-14 h-14 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center shadow-md z-10"
                        >
                            <span className="text-[7px] font-black tracking-widest text-indigo-500 uppercase">LVL</span>
                            <span className="text-base font-black text-zinc-800 dark:text-white leading-none mt-0.5">{profile?.level || 1}</span>
                        </motion.div>
                    </div>

                    {/* Top: Discipline Crystal */}
                    <motion.button
                        onClick={() => { triggerHaptic(); setSelectedPath('discipline'); }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 3, delay: 0.1 }}
                        className="absolute top-1 flex flex-col items-center focus:outline-none"
                    >
                        <div className={clsx(
                            "w-12 h-16 rounded-xl flex items-center justify-center transition-all duration-300 border relative overflow-hidden",
                            selectedPath === 'discipline' 
                                ? 'bg-indigo-500/15 border-indigo-500 shadow-lg scale-110' 
                                : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-850 opacity-60'
                        )}>
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none" />
                            <ShieldCheck className={clsx(
                                "w-6 h-6 z-10 transition-transform duration-300",
                                selectedPath === 'discipline' ? 'text-indigo-500 scale-105' : 'text-zinc-500'
                            )} />
                        </div>
                        <span className="text-[8px] font-black mt-1.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Disciplina</span>
                    </motion.button>

                    {/* Bottom Left: Saving Crystal */}
                    <motion.button
                        onClick={() => { triggerHaptic(); setSelectedPath('saving'); }}
                        animate={{ y: [0, 3, 0], x: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 3.4, delay: 0.3 }}
                        className="absolute bottom-1 left-1 flex flex-col items-center focus:outline-none"
                    >
                        <div className={clsx(
                            "w-12 h-16 rounded-xl flex items-center justify-center transition-all duration-300 border relative overflow-hidden",
                            selectedPath === 'saving' 
                                ? 'bg-emerald-500/15 border-emerald-500 shadow-lg scale-110' 
                                : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-850 opacity-60'
                        )}>
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none" />
                            <PiggyBank className={clsx(
                                "w-6 h-6 z-10 transition-transform duration-300",
                                selectedPath === 'saving' ? 'text-emerald-500 scale-105' : 'text-zinc-500'
                            )} />
                        </div>
                        <span className="text-[8px] font-black mt-1.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Ahorro</span>
                    </motion.button>

                    {/* Bottom Right: Growth Crystal */}
                    <motion.button
                        onClick={() => { triggerHaptic(); setSelectedPath('growth'); }}
                        animate={{ y: [0, 3, 0], x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 3.4, delay: 0.5 }}
                        className="absolute bottom-1 right-1 flex flex-col items-center focus:outline-none"
                    >
                        <div className={clsx(
                            "w-12 h-16 rounded-xl flex items-center justify-center transition-all duration-300 border relative overflow-hidden",
                            selectedPath === 'growth' 
                                ? 'bg-amber-500/15 border-amber-500 shadow-lg scale-110' 
                                : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-850 opacity-60'
                        )}>
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none" />
                            <TrendingUp className={clsx(
                                "w-6 h-6 z-10 transition-transform duration-300",
                                selectedPath === 'growth' ? 'text-amber-500 scale-105' : 'text-zinc-500'
                            )} />
                        </div>
                        <span className="text-[8px] font-black mt-1.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Crecimiento</span>
                    </motion.button>
                </div>
            </div>

            {/* Path details sheet */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl p-5 shadow-sm space-y-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedPath}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center border",
                                    selectedPath === 'saving' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    selectedPath === 'discipline' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                )}>
                                    {selectedPath === 'saving' ? <PiggyBank size={16} /> :
                                     selectedPath === 'discipline' ? <ShieldCheck size={16} /> :
                                     <TrendingUp size={16} />}
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-zinc-850 dark:text-white leading-tight">
                                        {PATHS[selectedPath].label}
                                    </h3>
                                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block">
                                        Rango: {getPathTitle(selectedPath, selectedPath === 'saving' ? savingLvl : selectedPath === 'discipline' ? disciplineLvl : growthLvl)}
                                    </span>
                                </div>
                            </div>
                            <span className={clsx(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black border",
                                selectedPath === 'saving' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                selectedPath === 'discipline' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                                'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                            )}>
                                Lvl {selectedPath === 'saving' ? savingLvl : selectedPath === 'discipline' ? disciplineLvl : growthLvl}
                            </span>
                        </div>

                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                            {PATHS[selectedPath].description}
                        </p>

                        {/* Path XP Progress */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center text-[8px] font-black text-zinc-400 uppercase tracking-wide">
                                <span>Puntos del Camino</span>
                                <span>
                                    {selectedPath === 'saving' ? `${savingXP}/${savingMax}` :
                                     selectedPath === 'discipline' ? `${disciplineXP}/${disciplineMax}` :
                                     `${growthXP}/${growthMax}`} XP
                                </span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden p-0.5 border border-zinc-200/50 dark:border-zinc-800/80">
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

                        {/* Guide / How to level up */}
                        <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-2xl p-3 space-y-2 text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold">
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">¿Cómo subir este nivel?</span>
                            <ul className="space-y-1.5">
                                {selectedPath === 'saving' && (
                                    <>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                                            <span>Realiza aportes frecuentes a tus metas de ahorro.</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                                            <span>Crea y engrosa fondos de emergencia.</span>
                                        </li>
                                    </>
                                )}
                                {selectedPath === 'discipline' && (
                                    <>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                                            <span>Registra tus gastos e ingresos diariamente.</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                                            <span>Consigue perfectos meses de presupuestos.</span>
                                        </li>
                                    </>
                                )}
                                {selectedPath === 'growth' && (
                                    <>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                                            <span>Realiza abonos a capital de deudas activas.</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                                            <span>Financia y completa proyectos de inversión en el simulador.</span>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Path selectors pills */}
                <div className="grid grid-cols-3 gap-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    {(['saving', 'discipline', 'growth'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => { triggerHaptic(); setSelectedPath(p); }}
                            className={clsx(
                                "py-2 rounded-xl text-[9px] font-black border transition-all text-center",
                                selectedPath === p
                                    ? p === 'saving' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' :
                                      p === 'discipline' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-450' :
                                      'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-450'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                            )}
                        >
                            {p === 'saving' ? 'AHORRO' : p === 'discipline' ? 'DISCIPLINA' : 'CRECIMIENTO'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Archetype & Radar Graph Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                <div className="flex flex-col gap-4">
                    <div className="space-y-2 text-center">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Mi Arquetipo</span>
                        <h3 className="text-sm font-black text-zinc-850 dark:text-white leading-tight flex items-center justify-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                {archetype.id === 'alchemist' ? <Zap size={14} /> :
                                 archetype.id === 'guardian' ? <ShieldCheck size={14} /> :
                                 archetype.id === 'architect' ? <Compass size={14} /> :
                                 <TrendingUp size={14} />}
                            </span>
                            {archetype.title}
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                            {archetype.description}
                        </p>
                        <p className="text-[10px] italic text-zinc-400 dark:text-zinc-500 font-medium leading-normal bg-zinc-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-200/10">
                            "{archetype.lore}"
                        </p>
                    </div>

                    {/* Radar Graph */}
                    <div className="flex justify-center pt-2">
                        <div className="relative w-40 h-40 flex items-center justify-center bg-zinc-50 dark:bg-zinc-955/45 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                            <svg className="w-36 h-36" viewBox="0 0 200 200">
                                <polygon points="100,45 152,135 48,135" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1.5" />
                                <polygon points="100,75 126,120 74,120" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/40" strokeWidth="1" strokeDasharray="3" />
                                <line x1="100" y1="105" x2="100" y2="45" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="1" />
                                <line x1="100" y1="105" x2="152" y2="135" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="1" />
                                <line x1="100" y1="105" x2="48" y2="135" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/50" strokeWidth="1" />
                                <text x="100" y="32" textAnchor="middle" className="text-[10px] font-black fill-zinc-400 dark:fill-zinc-600">DISCIPLINA</text>
                                <text x="165" y="148" textAnchor="middle" className="text-[10px] font-black fill-zinc-400 dark:fill-zinc-600">CRECE</text>
                                <text x="35" y="148" textAnchor="middle" className="text-[10px] font-black fill-zinc-400 dark:fill-zinc-600">AHORRO</text>
                                <polygon points={radarPolygonPoints} fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="2" />
                                <circle cx="100" cy="105" r="3" fill="#6366f1" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pizarra de Misiones */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl p-4 shadow-sm space-y-4">
                <div className="flex flex-col gap-2.5 pb-2.5 border-b border-zinc-150 dark:border-zinc-800/40">
                    <h3 className="text-sm font-black text-zinc-850 dark:text-white">Pizarra de Misiones</h3>
                    <p className="text-[10px] text-zinc-400 font-bold">Completa misiones para ganar XP</p>
                    
                    {/* Tab Switcher Pills */}
                    <div className="grid grid-cols-3 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/10 rounded-xl mt-1.5">
                        {(['daily', 'weekly', 'saga'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => { triggerHaptic(); setQuestTab(tab); }}
                                className={clsx(
                                    "py-2 rounded-lg text-[10px] font-black transition-all uppercase",
                                    questTab === tab
                                        ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm"
                                        : "text-zinc-500"
                                )}
                            >
                                {tab === 'daily' ? 'Diarias' : tab === 'weekly' ? 'Semanales' : 'Sagas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quests List */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredQuests.length === 0 ? (
                            <div className="py-6 text-center text-xs text-zinc-400 font-bold">
                                No hay misiones activas.
                            </div>
                        ) : (
                            filteredQuests.map((quest) => {
                                const QIcon = quest.xpType === 'saving' ? PiggyBank :
                                              quest.xpType === 'discipline' ? ShieldCheck :
                                              TrendingUp;
                                
                                return (
                                    <motion.div
                                        key={quest.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        className={clsx(
                                            "border rounded-2xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden",
                                            quest.claimed 
                                                ? "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-900 opacity-60" 
                                                : quest.completed 
                                                    ? "bg-indigo-500/5 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.08)]" 
                                                    : "bg-white dark:bg-zinc-950/25 border-zinc-150 dark:border-zinc-800"
                                        )}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className={clsx(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center border",
                                                    quest.xpType === 'saving' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    quest.xpType === 'discipline' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                )}>
                                                    <QIcon size={14} />
                                                </span>
                                                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase">
                                                    +{quest.xpReward} XP
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                                                    {quest.title}
                                                </h4>
                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold leading-normal mt-0.5">
                                                    {quest.description}
                                                </p>
                                                {quest.requirementsDescription && (
                                                    <div className="mt-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold border border-zinc-200/5">
                                                        {quest.requirementsDescription}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between gap-4">
                                            <div className="text-[9px] font-black text-zinc-400">
                                                Progreso: <span className="text-zinc-700 dark:text-zinc-300">
                                                    {quest.type === 'saga' && quest.id === 'saga_card' 
                                                        ? `${quest.current}/3` 
                                                        : quest.id === 'weekly_save'
                                                            ? `${currency}${quest.current}/${quest.target}`
                                                            : `${quest.current}/${quest.target}`}
                                                </span>
                                            </div>

                                            {quest.claimed ? (
                                                <span className="text-[9px] font-black text-zinc-450 uppercase flex items-center gap-1">
                                                    <CheckCircle size={10} className="text-emerald-500" /> Reclamado
                                                </span>
                                            ) : quest.completed ? (
                                                <button
                                                    onClick={() => handleClaim(quest.id)}
                                                    className="px-2.5 py-1 bg-indigo-500 active:scale-95 text-white text-[9px] font-black rounded-lg transition-transform"
                                                >
                                                    RECLAMAR XP
                                                </button>
                                            ) : (
                                                <span className="text-[9px] font-black text-zinc-400 uppercase">
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

            {/* Cámara de Reliquias */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl p-4 shadow-sm space-y-4">
                <div>
                    <h3 className="text-sm font-black text-zinc-850 dark:text-white">Cámara de Reliquias</h3>
                    <p className="text-[10px] text-zinc-400 font-bold">Colección de reliquias sagradas desbloqueadas ({profile?.unlockedAchievements?.length || 0} / {achievements.length})</p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                    {sortedRelics.map(relic => {
                        const unlocked = isRelicUnlocked(relic.id);
                        const RelicIcon = GAMIFICATION_ICONS[relic.icon] || Trophy;
                        
                        const rarityColor = 
                            relic.rarity === 'legendary' ? 'text-amber-500 border-amber-500/25 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.06)]' :
                            relic.rarity === 'epic' ? 'text-purple-500 border-purple-500/25 bg-purple-500/5' :
                            relic.rarity === 'rare' ? 'text-blue-500 border-blue-500/25 bg-blue-500/5' :
                            relic.rarity === 'uncommon' ? 'text-emerald-500 border-emerald-500/25 bg-emerald-500/5' :
                            'text-zinc-400 border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10';

                        if (relic.isHidden && !unlocked) {
                            return (
                                <div 
                                    key={relic.id}
                                    className="border border-dashed border-zinc-200 dark:border-zinc-850 p-3 rounded-2xl flex flex-col items-center justify-center text-center opacity-40 min-h-[90px]"
                                >
                                    <Lock size={16} className="text-zinc-400 dark:text-zinc-650" />
                                    <span className="text-[8px] font-black text-zinc-450 block mt-1 uppercase">Oculto</span>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={relic.id}
                                onClick={() => { triggerHaptic(); if (unlocked || !relic.isHidden) setSelectedRelic(relic); }}
                                className={clsx(
                                    "border p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all min-h-[90px] cursor-pointer",
                                    unlocked 
                                        ? rarityColor 
                                        : "border-zinc-150 dark:border-zinc-850 opacity-40 grayscale"
                                )}
                            >
                                <motion.div
                                    animate={unlocked ? { y: [0, -2, 0] } : {}}
                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                    className="mb-1"
                                >
                                    <RelicIcon size={22} strokeWidth={1.5} />
                                </motion.div>
                                <span className={clsx(
                                    "text-[9px] font-black truncate w-full block",
                                    unlocked ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"
                                )}>
                                    {relic.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Relic detail Bottom Sheet */}
            <AnimatePresence>
                {selectedRelic && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRelic(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full bg-white dark:bg-zinc-955 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[70vh] flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={() => setSelectedRelic(null)} />
                            
                            <div className="flex justify-between items-center mb-6">
                                <button onClick={() => setSelectedRelic(null)} className="p-2 -ml-2 text-zinc-400">
                                    <ChevronDown size={28} />
                                </button>
                                <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                                    Reliquia Sagrada
                                </span>
                                <div className="w-10" />
                            </div>

                            <div className="space-y-4 text-center pb-6">
                                <div className="flex justify-center">
                                    <div className={clsx(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center border",
                                        isRelicUnlocked(selectedRelic.id)
                                            ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg"
                                            : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                                    )}>
                                        {(() => {
                                            const Icon = GAMIFICATION_ICONS[selectedRelic.icon] || Trophy;
                                            return <Icon size={32} strokeWidth={1.5} />;
                                        })()}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">{selectedRelic.title}</h3>
                                    <span className="inline-block text-[9px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full mt-1.5">
                                        Raridad: {selectedRelic.rarity}
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                                    {selectedRelic.description}
                                </p>

                                {isRelicUnlocked(selectedRelic.id) ? (
                                    <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200/5">
                                        <p className="text-[11px] italic text-zinc-400 dark:text-zinc-550 leading-normal font-semibold">
                                            "{selectedRelic.relicLore}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-rose-500/5 text-rose-500 text-[10px] font-black rounded-2xl border border-rose-500/10 flex items-center justify-center gap-1.5">
                                        <Lock size={12} /> Esta reliquia sigue sellada
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileGamification;
