import { GAMIFICATION_ICONS } from './GamificationIcons';
import { motion } from 'framer-motion';

interface RelicToastProps {
    toastId: string | number;
    title: string;
    xpReward: number;
    relicIcon: string;
    rarity: string;
    lore: string;
    onClose?: () => void;
}

const getRarityGlow = (rarity: string) => {
    switch (rarity) {
        case 'common': return 'shadow-[0_0_15px_rgba(161,161,170,0.3)] border-zinc-200/50 dark:border-zinc-800/50';
        case 'uncommon': return 'shadow-[0_0_15px_rgba(16,185,129,0.4)] border-emerald-500/30';
        case 'rare': return 'shadow-[0_0_15px_rgba(59,130,246,0.4)] border-blue-500/30';
        case 'epic': return 'shadow-[0_0_20px_rgba(168,85,247,0.5)] border-purple-500/35';
        case 'legendary': return 'shadow-[0_0_25px_rgba(245,158,11,0.6)] border-amber-500/40 animate-pulse';
        default: return 'shadow-md';
    }
};

const getRarityBadge = (rarity: string) => {
    switch (rarity) {
        case 'common': return 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-300';
        case 'uncommon': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
        case 'rare': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
        case 'epic': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
        case 'legendary': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold';
        default: return 'bg-zinc-100 text-zinc-600';
    }
};

export const RelicToastContent = ({
    title,
    xpReward,
    relicIcon,
    rarity,
    lore,
    onClose
}: RelicToastProps) => {
    const IconComponent = GAMIFICATION_ICONS[relicIcon] || GAMIFICATION_ICONS.Trophy;
    const CloseIcon = GAMIFICATION_ICONS.X;

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 150 }}
            className={`w-full max-w-sm rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border p-4 flex gap-4 ${getRarityGlow(rarity)} text-left select-none relative overflow-hidden pointer-events-auto`}
        >
            {/* Ambient Background Glow Spot */}
            <div className={`absolute -top-10 -left-10 w-24 h-24 rounded-full filter blur-xl opacity-20 ${
                rarity === 'legendary' ? 'bg-amber-500' :
                rarity === 'epic' ? 'bg-purple-500' :
                rarity === 'rare' ? 'bg-blue-500' :
                rarity === 'uncommon' ? 'bg-emerald-500' : 'bg-zinc-400'
            }`} />

            {/* Glowing Icon Holder */}
            <div className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-800/30 border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                    className={`text-zinc-700 dark:text-zinc-200 ${
                        rarity === 'legendary' ? 'text-amber-500' :
                        rarity === 'epic' ? 'text-purple-500' :
                        rarity === 'rare' ? 'text-blue-500' :
                        rarity === 'uncommon' ? 'text-emerald-500' : ''
                    }`}
                >
                    <IconComponent size={24} strokeWidth={1.5} />
                </motion.div>
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Reliquia Revelada</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${getRarityBadge(rarity)}`}>
                        {rarity}
                    </span>
                </div>
                <h4 className="text-sm font-black text-zinc-850 dark:text-white truncate">
                    {title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mt-0.5">
                    {lore}
                </p>
                <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-bold">
                        +{xpReward} XP
                    </span>
                </div>
            </div>

            {/* Close button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1"
                >
                    <CloseIcon size={14} />
                </button>
            )}
        </motion.div>
    );
};
