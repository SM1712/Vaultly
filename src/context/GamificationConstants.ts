import type { Achievement, UserTitle } from '../types';

// --- XP SYSTEM ---
// Formula: XP = Base * (Level ^ Multiplier)
// This builds a progressive curve.
// Increased multiplier to 2.1 to make leveling significantly harder as requested (Level 236 issue).
export const BASE_XP = 150;
export const XP_MULTIPLIER = 2.1;

export const calculateNextLevelXP = (level: number): number => {
    return Math.floor(BASE_XP * Math.pow(level, XP_MULTIPLIER));
};

// --- TITLES ---
export const TITLES: UserTitle[] = [
    { id: 'novice', label: 'Novato Financiero', minLevel: 1 },
    { id: 'apprentice', label: 'Aprendiz de la Bóveda', minLevel: 5 },
    { id: 'saver', label: 'Ahorrador Iniciado', minLevel: 10 },
    { id: 'planner', label: 'Planificador Táctico', minLevel: 15 },
    { id: 'strategist', label: 'Estratega de Capital', minLevel: 20 },
    { id: 'guardian', label: 'Guardián del Saldo', minLevel: 30 },
    { id: 'baron', label: 'Barón del Presupuesto', minLevel: 40 },
    { id: 'sovereign', label: 'Soberano de la Riqueza', minLevel: 50 },
    { id: 'legend', label: 'Leyenda Financiera', minLevel: 75 },
    { id: 'mythic', label: 'El Oráculo', minLevel: 100 },
];

export const getTitleForLevel = (level: number): string => {
    // Find the highest title where minLevel <= currentLevel
    const title = [...TITLES].reverse().find(t => t.minLevel <= level);
    return title ? title.label : TITLES[0].label;
};

// --- ACHIEVEMENTS ---
export const ACHIEVEMENTS: Achievement[] = [
    // --- COMMON ---
    {
        id: 'first_steps',
        title: 'Primeros Pasos',
        description: 'Registra tu primera transacción.',
        icon: 'Footprints',
        rarity: 'common',
        xpReward: 50,
    },
    {
        id: 'saver_init',
        title: 'Semilla',
        description: 'Crea tu primera meta de ahorro.',
        icon: 'Sprout',
        rarity: 'common',
        xpReward: 50,
    },
    {
        id: 'feedback_loop',
        title: 'Feedback',
        description: 'Importa una copia de seguridad.',
        icon: 'Upload',
        rarity: 'common',
        xpReward: 30,
    },

    // --- UNCOMMON ---
    {
        id: 'streak_3',
        title: 'Constancia',
        description: 'Registra movimientos 3 días seguidos.',
        icon: 'Flame',
        rarity: 'uncommon',
        xpReward: 150,
    },
    {
        id: 'budget_aware',
        title: 'Consciente',
        description: 'Revisa tus proyecciones 5 veces en total.',
        icon: 'Eye',
        rarity: 'uncommon',
        xpReward: 100,
    },
    {
        id: 'debt_slayer_1',
        title: 'Pagador',
        description: 'Registra tu primer abono a una deuda.',
        icon: 'ShieldCheck',
        rarity: 'uncommon',
        xpReward: 120,
    },

    // --- RARE ---
    {
        id: 'savings_warrior',
        title: 'Guerrero del Ahorro',
        description: 'Completa una meta de ahorro al 100%.',
        icon: 'Trophy',
        rarity: 'rare',
        xpReward: 500,
    },
    {
        id: 'data_hoarder',
        title: 'Historiador',
        description: 'Alcanza 100 transacciones registradas.',
        icon: 'Scroll',
        rarity: 'rare',
        xpReward: 400,
    },
    {
        id: 'night_owl',
        title: 'Búho Nocturno',
        description: 'Registra una transacción entre la 1AM y 4AM.',
        icon: 'Moon',
        rarity: 'rare',
        xpReward: 300,
        isHidden: true,
    },
    {
        id: 'smart_saver',
        title: 'Ahorrador Inteligente',
        description: 'Ahorra al menos el 20% de tus ingresos en un mes.',
        icon: 'PiggyBank',
        rarity: 'rare',
        xpReward: 350,
    },
    {
        id: 'wealth_builder',
        title: 'Constructor de Riqueza',
        description: 'Ingresa más de 5000 y ahorra el 70%.',
        icon: 'Gem',
        rarity: 'epic',
        xpReward: 1200,
    },

    // --- EPIC ---
    {
        id: 'sniper',
        title: 'Francotirador',
        description: 'Termina el mes con una desviación menor al 2% de tus ingresos vs gastos.',
        icon: 'Crosshair',
        rarity: 'epic',
        xpReward: 1000,
    },
    {
        id: 'centurion',
        title: 'Centurión',
        description: 'Alcanza el nivel 25.',
        icon: 'Crown',
        rarity: 'epic',
        xpReward: 800,
    },

    // --- LEGENDARY ---
    {
        id: 'financial_freedom',
        title: 'Libertad Financiera',
        description: 'Ten más ingresos pasivos que gastos en un mes (Simulado).',
        icon: 'Infinity',
        rarity: 'legendary',
        xpReward: 5000,
        isHidden: true,
    },
];

// --- AVATARS ---
export const getDynamicAvatar = (name: string, level: number): string => {
    // Adventurer style (RPG/Fantasy look) - "Otra cosa" instead of robots
    const tier = Math.floor(level / 10);
    // Sanitize name for seed to ensure stability
    const seed = `${name.replace(/[^a-zA-Z0-9]/g, '')}_lvl${tier}`;
    // Using Adventurer for a more "RPG/Leveling" feel
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;
};
