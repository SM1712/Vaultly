
import type { AchievementRarity } from '../../types';
import * as LucideIcons from 'lucide-react';

// --- XP Bar ---
interface XPBarProps {
    current: number;
    max: number;
    level: number;
    className?: string;
}

export const XPBar = ({ current, max, level, className = '' }: XPBarProps) => {
    const percentage = Math.min((current / max) * 100, 100);

    return (
        <div className={`w-full ${className}`}>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                <span>Nivel {level}</span>
                <span>{current} / {max} XP</span>
            </div>
            <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// --- Rarity Utils ---
export const getRarityColor = (rarity: AchievementRarity) => {
    switch (rarity) {
        case 'common': return 'border-zinc-300 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
        case 'uncommon': return 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
        case 'rare': return 'border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
        case 'epic': return 'border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
        case 'legendary': return 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 shadow-[0_0_15px_-3px_rgba(251,191,36,0.5)]';
        default: return 'border-zinc-200';
    }
};

// --- Achievement Badge ---
interface AchievementBadgeProps {
    icon: string;
    title: string;
    description?: string;
    rarity: AchievementRarity;
    locked?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const AchievementBadge = ({ icon, title, description, rarity, locked = false, size = 'md' }: AchievementBadgeProps) => {
    // Dynamic Icon
    const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Trophy;

    const baseClasses = `
        relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300
        ${locked ? 'border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 opacity-60 grayscale' : getRarityColor(rarity)}
        ${size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-32 h-32' : 'w-24 h-24'}
        hover:scale-105 active:scale-95
    `;

    return (
        <div className="flex flex-col items-center text-center group cursor-pointer w-32">
            <div className={baseClasses}>
                <IconComponent size={size === 'sm' ? 20 : size === 'lg' ? 40 : 28} />
                {locked && <div className="absolute inset-0 bg-white/20 dark:bg-black/20" />}
            </div>

            <div className="mt-3 flex flex-col items-center px-1">
                <p className={`font-bold text-sm truncate w-full ${locked ? 'text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {title}
                </p>
                {description && (
                    <p className={`text-xs leading-snug mt-1.5 line-clamp-3 ${locked ? 'text-zinc-300 dark:text-zinc-600 italic' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {locked ? 'Juega para descubrir más...' : description}
                    </p>
                )}
            </div>
        </div>
    );
};
