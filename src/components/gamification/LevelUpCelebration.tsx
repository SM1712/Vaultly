import { motion, AnimatePresence } from 'framer-motion';
import { Award, ArrowRight, Sparkles, TrendingUp, PiggyBank, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';

interface LevelUpCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    title: string;
    savingLevel?: number;
    disciplineLevel?: number;
    growthLevel?: number;
}

// Simple floating crystal particle component
const CrystalParticle = ({ delay = 0, x = 0, color = 'bg-primary' }) => {
    return (
        <motion.div
            initial={{ y: '110vh', opacity: 0, rotate: 0, scale: 0.5 }}
            animate={{
                y: '-10vh',
                opacity: [0, 0.7, 0.7, 0],
                rotate: 360,
                scale: [0.5, 1, 1, 0.5]
            }}
            transition={{
                duration: 4.5,
                delay,
                ease: 'easeOut',
                repeat: Infinity
            }}
            className={`absolute w-3 h-5 ${color} clip-diamond filter blur-[0.5px] pointer-events-none`}
            style={{ left: `${x}%` }}
        />
    );
};

export const LevelUpCelebration = ({
    isOpen,
    onClose,
    level,
    title,
    savingLevel = 1,
    disciplineLevel = 1,
    growthLevel = 1
}: LevelUpCelebrationProps) => {

    useEffect(() => {
        if (isOpen) {
            // Play Majestic Level Up Sound (Chime/Harp)
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
                audio.volume = 0.25;
                audio.play().catch(() => {});
            } catch (e) {
                console.error("Error playing audio chime", e);
            }

            // Vibrate device if supported
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Generate random particle locations
    const particles = Array.from({ length: 25 }).map((_, idx) => ({
        delay: Math.random() * 3,
        x: Math.random() * 100,
        color: idx % 3 === 0 ? 'bg-emerald-500/60' : idx % 3 === 1 ? 'bg-indigo-500/60' : 'bg-amber-500/60'
    }));

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md overflow-hidden select-none">
                
                {/* Float particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {particles.map((p, idx) => (
                        <CrystalParticle key={idx} delay={p.delay} x={p.x} color={p.color} />
                    ))}
                </div>

                {/* Main Card Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -30 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                    className="relative w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-8 backdrop-blur-2xl text-center overflow-hidden"
                >
                    {/* Glowing aurora backgrounds */}
                    <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/20 filter blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/20 filter blur-3xl" />

                    {/* Spinning Core Crystal (SVG) */}
                    <div className="relative mb-6 flex justify-center items-center">
                        <div className="absolute w-28 h-28 bg-indigo-500/10 rounded-full filter blur-xl animate-pulse" />
                        
                        <motion.div
                            animate={{ rotateY: 360, y: [0, -6, 0] }}
                            transition={{
                                rotateY: { repeat: Infinity, duration: 8, ease: 'linear' },
                                y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                            }}
                            className="relative w-24 h-24 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-white/10 rounded-3xl shadow-lg shadow-indigo-500/10"
                        >
                            <Award className="w-12 h-12 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" strokeWidth={1.5} />
                            
                            {/* Floating Level core */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-base w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300"
                            >
                                {level}
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-indigo-300 to-emerald-200 mb-1 tracking-tight">
                        ¡Ascenso de Nivel Global!
                    </h2>
                    <p className="text-xs text-zinc-400 font-bold mb-6 uppercase tracking-widest">
                        Rango Alcanzado: <span className="text-indigo-400 capitalize">{title}</span>
                    </p>

                    {/* Paths Progress Breakdown */}
                    <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 mb-6 space-y-3.5 text-left">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Estado de tus Sendas</span>
                        
                        {/* Saving Level */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                    <PiggyBank size={14} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300">Senda del Ahorro</span>
                            </div>
                            <span className="text-xs font-black text-emerald-400">Nivel {savingLevel}</span>
                        </div>

                        {/* Discipline Level */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                    <ShieldCheck size={14} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300">Senda de la Disciplina</span>
                            </div>
                            <span className="text-xs font-black text-indigo-400">Nivel {disciplineLevel}</span>
                        </div>

                        {/* Growth Level */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                    <TrendingUp size={14} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300">Senda del Crecimiento</span>
                            </div>
                            <span className="text-xs font-black text-amber-400">Nivel {growthLevel}</span>
                        </div>
                    </div>

                    {/* Unlocked Perks list */}
                    <div className="flex flex-col items-center gap-2 mb-8">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300">
                            <Sparkles size={12} />
                            <span>PRIVILEGIOS Y BONUS DESBLOQUEADOS</span>
                        </div>
                        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                            Has aumentado tu capacidad y ganado acceso a nuevos contratos en la Bóveda Celestial. ¡Tu salud financiera se está consolidando!
                        </p>
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group border border-indigo-400/20"
                    >
                        <span>Aceptar Rango</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
