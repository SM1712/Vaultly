import type { Achievement, UserTitle, Quest } from '../types';

// --- XP SYSTEM ---
// Formula for overall level: XP = Base * (Level ^ Multiplier)
export const BASE_XP = 150;
export const XP_MULTIPLIER = 2.1;

export const calculateNextLevelXP = (level: number): number => {
    return Math.floor(BASE_XP * Math.pow(level, XP_MULTIPLIER));
};

// Formula for path levels (Saving, Discipline, Growth)
// Slightly easier curve for paths so users see frequent sub-level updates
export const calculatePathNextLevelXP = (level: number): number => {
    return Math.floor(100 * Math.pow(level, 1.7));
};

// --- PATH DEFINITIONS ---
export type PathType = 'saving' | 'discipline' | 'growth';

export interface PathInfo {
    id: PathType;
    label: string;
    description: string;
    color: string; // Tailwind class color mapping
    icon: string; // Lucide icon name
}

export const PATHS: Record<PathType, PathInfo> = {
    saving: {
        id: 'saving',
        label: 'Senda del Ahorro',
        description: 'Mide tu habilidad para acumular recursos y crear fondos de respaldo.',
        color: 'emerald',
        icon: 'PiggyBank'
    },
    discipline: {
        id: 'discipline',
        label: 'Senda de la Disciplina',
        description: 'Representa tu constancia en registrar gastos e ingresos y respetar presupuestos.',
        color: 'indigo',
        icon: 'ShieldCheck'
    },
    growth: {
        id: 'growth',
        label: 'Senda del Crecimiento',
        description: 'Mide tu control sobre deudas activas e inversiones en proyectos futuros.',
        color: 'amber',
        icon: 'TrendingUp'
    }
};

// --- TITLES ---
export const TITLES: UserTitle[] = [
    { id: 'novice', label: 'Iniciado de Cristal', minLevel: 1 },
    { id: 'apprentice', label: 'Centinela Constante', minLevel: 5 },
    { id: 'saver', label: 'Analista de Bóvedas', minLevel: 10 },
    { id: 'planner', label: 'Planificador de Destinos', minLevel: 15 },
    { id: 'strategist', label: 'Estratega del Ahorro', minLevel: 20 },
    { id: 'guardian', label: 'Gestor del Tesoro', minLevel: 30 },
    { id: 'baron', label: 'Visionario del Cobre', minLevel: 40 },
    { id: 'sovereign', label: 'Director del Oro', minLevel: 50 },
    { id: 'legend', label: 'Maestro Alquimista', minLevel: 75 },
    { id: 'mythic', label: 'Soberano Absoluto', minLevel: 100 },
];

export const getTitleForLevel = (level: number): string => {
    const title = [...TITLES].reverse().find(t => t.minLevel <= level);
    return title ? title.label : TITLES[0].label;
};

// Path Title helper based on path levels
export const getPathTitle = (path: PathType, level: number): string => {
    if (path === 'saving') {
        if (level < 3) return 'Recolector de Cobre';
        if (level < 7) return 'Guardador del Cofre';
        if (level < 12) return 'Señor de las Bóvedas';
        if (level < 20) return 'Titán de la Reserva';
        return 'Soberano de la Abundancia';
    } else if (path === 'discipline') {
        if (level < 3) return 'Escriba Novato';
        if (level < 7) return 'Registrador Activo';
        if (level < 12) return 'Arquitecto del Presupuesto';
        if (level < 20) return 'Guardián del Orden';
        return 'Maestro de la Disciplina';
    } else { // growth
        if (level < 3) return 'Buscador de Oportunidades';
        if (level < 7) return 'Slayer de Deudas';
        if (level < 12) return 'Inversionista Semilla';
        if (level < 20) return 'Magnate de Proyectos';
        return 'Alquimista del Crecimiento';
    }
};

// --- FINANCIAL ARCHETYPES ---
export interface Archetype {
    id: string;
    title: string;
    description: string;
    icon: string;
    accentColor: string;
    lore: string;
}

export const ARCHETYPES: Record<string, Archetype> = {
    alchemist: {
        id: 'alchemist',
        title: 'El Alquimista de Cristal',
        description: 'Mantienes un balance perfecto entre ahorrar, planificar tus presupuestos y crecer financieramente.',
        icon: 'Sparkles',
        accentColor: 'from-violet-500 to-indigo-600 dark:from-violet-400 dark:to-indigo-500',
        lore: 'Dominas los tres elementos del dinero. Para ti, las finanzas no son una limitación, sino una ciencia de transmutación de abundancia.'
    },
    guardian: {
        id: 'guardian',
        title: 'El Guardián del Tesoro',
        description: 'Destacas principalmente en el ahorro. Tu capacidad para acumular fondos y metas es tu mayor fortaleza.',
        icon: 'ShieldAlert',
        accentColor: 'from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500',
        lore: 'Tu bóveda es inexpugnable. Proteges tus ahorros con la determinación de un dragón, asegurando tu paz y estabilidad mental.'
    },
    architect: {
        id: 'architect',
        title: 'El Arquitecto del Presupuesto',
        description: 'Tu mayor poder es la disciplina del registro diario y el control rígido de los presupuestos.',
        icon: 'Compass',
        accentColor: 'from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500',
        lore: 'Diseñas y ejecutas tus planes financieros con milimétrica precisión. Ningún gasto hormiga pasa desapercibido bajo tu radar.'
    },
    pioneer: {
        id: 'pioneer',
        title: 'El Pionero del Crecimiento',
        description: 'Te enfocas en extinguir deudas y realizar inversiones en proyectos. Eres audaz con el futuro.',
        icon: 'TrendingUp',
        accentColor: 'from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500',
        lore: 'No temes expandir tus horizontes. Conquistas las deudas y siembras capital en proyectos buscando multiplicar el valor de tu riqueza.'
    }
};

export const calculateArchetype = (
    savingLvl: number,
    disciplineLvl: number,
    growthLvl: number
): Archetype => {
    const total = savingLvl + disciplineLvl + growthLvl;
    if (total === 0) return ARCHETYPES.alchemist;

    const savingRatio = savingLvl / total;
    const disciplineRatio = disciplineLvl / total;
    const growthRatio = growthLvl / total;

    // If balanced (no path exceeds others by a significant margin)
    const threshold = 0.40; // Over 40% represents high dominance
    
    if (savingRatio >= threshold && savingLvl > disciplineLvl && savingLvl > growthLvl) {
        return ARCHETYPES.guardian;
    }
    if (disciplineRatio >= threshold && disciplineLvl > savingLvl && disciplineLvl > growthLvl) {
        return ARCHETYPES.architect;
    }
    if (growthRatio >= threshold && growthLvl > savingLvl && growthLvl > disciplineLvl) {
        return ARCHETYPES.pioneer;
    }

    return ARCHETYPES.alchemist;
};

// --- ACHIEVEMENTS / RELICS CATALOG ---
export interface Relic extends Achievement {
    relicLore: string;
    pathType: PathType | 'general';
}

export const ACHIEVEMENTS: Relic[] = [
    // --- SAVING PATH RELICS ---
    {
        id: 'saver_init',
        title: 'La Semilla Radiante',
        description: 'Crea tu primera meta de ahorro en las bóvedas.',
        icon: 'Sprout',
        rarity: 'common',
        xpReward: 100,
        pathType: 'saving',
        relicLore: 'Una pequeña semilla cristalina que brilla al contacto con tus monedas. El primer brote del ahorro futuro.'
    },
    {
        id: 'savings_warrior',
        title: 'El Cofre del Titán',
        description: 'Completa una meta de ahorro al 100%.',
        icon: 'Trophy',
        rarity: 'rare',
        xpReward: 500,
        pathType: 'saving',
        relicLore: 'Un arcón reforzado con hierro estelar, capaz de resguardar el fruto de tu determinación constante.'
    },
    {
        id: 'smart_saver',
        title: 'El Escudo Frugal de Plata',
        description: 'Ahorra al menos el 20% de tus ingresos en un mes completo.',
        icon: 'PiggyBank',
        rarity: 'rare',
        xpReward: 350,
        pathType: 'saving',
        relicLore: 'Escudo forjado en plata líquida que repele las tentaciones del consumo impulsivo.'
    },

    // --- DISCIPLINE PATH RELICS ---
    {
        id: 'first_steps',
        title: 'La Brújula del Viajero',
        description: 'Registra tu primera transacción financiera.',
        icon: 'Footprints',
        rarity: 'common',
        xpReward: 50,
        pathType: 'discipline',
        relicLore: 'Una brújula antigua que te guiará en tus primeros pasos por el vasto territorio de las finanzas personales.'
    },
    {
        id: 'feedback_loop',
        title: 'Espejo de Sincronía',
        description: 'Importa una copia de seguridad.',
        icon: 'Upload',
        rarity: 'common',
        xpReward: 50,
        pathType: 'discipline',
        relicLore: 'Refleja la historia de tu riqueza y asegura que tu memoria financiera nunca se pierda en el vacío.'
    },
    {
        id: 'streak_3',
        title: 'La Llama Inextinguible',
        description: 'Registra movimientos financieros por 3 días seguidos.',
        icon: 'Flame',
        rarity: 'uncommon',
        xpReward: 150,
        pathType: 'discipline',
        relicLore: 'Una antorcha mística que arde con más intensidad mientras mantengas viva tu constancia diaria.'
    },
    {
        id: 'budget_aware',
        title: 'El Ojo Visor de Cristal',
        description: 'Revisa tus proyecciones financieras 5 veces en total.',
        icon: 'Eye',
        rarity: 'uncommon',
        xpReward: 100,
        pathType: 'discipline',
        relicLore: 'Lente esmerilada que permite atisbar las líneas de tiempo futuras de tu flujo de efectivo.'
    },
    {
        id: 'data_hoarder',
        title: 'El Pergamino del Cronista',
        description: 'Alcanza 100 transacciones registradas en el libro contable.',
        icon: 'Scroll',
        rarity: 'rare',
        xpReward: 400,
        pathType: 'discipline',
        relicLore: 'Un papiro interminable que detalla cronológicamente cada intercambio material de tu viaje.'
    },
    {
        id: 'night_owl',
        title: 'El Amuleto Umbrío',
        description: 'Registra una transacción entre la 1:00 AM y 4:00 AM.',
        icon: 'Moon',
        rarity: 'rare',
        xpReward: 300,
        isHidden: true,
        pathType: 'discipline',
        relicLore: 'Objeto consagrado a los guardianes nocturnos que vigilan la bóveda mientras el mundo duerme.'
    },
    {
        id: 'sniper',
        title: 'La Flecha de Precisión Astral',
        description: 'Termina el mes con una desviación menor al 2% entre tus ingresos y tus gastos.',
        icon: 'Crosshair',
        rarity: 'epic',
        xpReward: 1000,
        pathType: 'discipline',
        relicLore: 'Flecha plateada que impacta directo en el centro de tu blanco presupuestario.'
    },

    // --- GROWTH PATH RELICS ---
    {
        id: 'debt_slayer_1',
        title: 'La Daga Rompe-Cadenas',
        description: 'Registra tu primer abono a una deuda activa.',
        icon: 'ShieldCheck',
        rarity: 'uncommon',
        xpReward: 150,
        pathType: 'growth',
        relicLore: 'Una afilada hoja mágica forjada con el propósito de cortar los pesados grilletes de las deudas.'
    },
    {
        id: 'wealth_builder',
        title: 'El Cetro de la Abundancia',
        description: 'Ingresa más de $5,000 en un mes y ahorra el 70%.',
        icon: 'Gem',
        rarity: 'epic',
        xpReward: 1200,
        pathType: 'growth',
        relicLore: 'Cetro enjoyado que simboliza la soberanía sobre grandes flujos de recursos y multiplicación de riqueza.'
    },
    {
        id: 'financial_freedom',
        title: 'Reloj del Tiempo Infinito',
        description: 'Ten más ingresos pasivos que gastos simulados en un mes.',
        icon: 'Infinity',
        rarity: 'legendary',
        xpReward: 5000,
        isHidden: true,
        pathType: 'growth',
        relicLore: 'Artefacto definitivo que detiene el paso del tiempo laboral obligatorio, permitiéndote vivir bajo tus propias reglas.'
    },

    // --- GENERAL RELICS ---
    {
        id: 'centurion',
        title: 'La Corona del Soberano',
        description: 'Alcanza el nivel 25 global en la Bóveda Celestial.',
        icon: 'Crown',
        rarity: 'epic',
        xpReward: 800,
        pathType: 'general',
        relicLore: 'Diadema imperial de cristal esmerilado otorgada únicamente a los maestros de la arquitectura financiera.'
    },

    // --- SAGAS RELICS ---
    {
        id: 'saga_card_complete',
        title: 'La Tarjeta Templada',
        description: 'Completa la Saga de la Tarjeta manteniendo un historial crediticio sano.',
        icon: 'CreditCard',
        rarity: 'epic',
        xpReward: 500,
        pathType: 'growth',
        relicLore: 'Una credencial forjada en obsidiana y filigrana de oro. Simboliza un historial crediticio impecable y poder financiero.'
    },
    {
        id: 'saga_builder_complete',
        title: 'El Martillo del Constructor',
        description: 'Financia por completo 3 proyectos de inversión.',
        icon: 'Hammer',
        rarity: 'epic',
        xpReward: 600,
        pathType: 'growth',
        relicLore: 'Martillo rúnico utilizado para cimentar proyectos duraderos y generar retornos fructíferos.'
    },
    {
        id: 'saga_shield_complete',
        title: 'El Escudo de Aegis',
        description: 'Acumula un fondo de emergencia equivalente a 3 meses de gastos.',
        icon: 'Shield',
        rarity: 'epic',
        xpReward: 600,
        pathType: 'saving',
        relicLore: 'Legendario escudo protector capaz de resistir las tormentas e imprevistos más severos.'
    }
];

// --- QUEST TEMPLATES & GENERATION ---

export const DAILY_QUEST_TEMPLATES = [
    {
        id: 'daily_login',
        title: 'Inspección del Reino',
        description: 'Accede al panel y revisa tu estado financiero.',
        target: 1,
        xpReward: 15,
        xpType: 'discipline' as PathType
    },
    {
        id: 'daily_tx',
        title: 'Bitácora al Día',
        description: 'Registra al menos una transacción (gasto o ingreso) hoy.',
        target: 1,
        xpReward: 25,
        xpType: 'discipline' as PathType
    }
];

export const WEEKLY_QUEST_TEMPLATES = [
    {
        id: 'weekly_save',
        title: 'Tributo a la Bóveda',
        description: 'Deposita al menos $50 en tus metas de ahorro o fondos.',
        target: 50,
        xpReward: 100,
        xpType: 'saving' as PathType
    },
    {
        id: 'weekly_check',
        title: 'Mirada al Futuro',
        description: 'Consulta tus Proyecciones o Calendario en 2 ocasiones esta semana.',
        target: 2,
        xpReward: 50,
        xpType: 'discipline' as PathType
    },
    {
        id: 'weekly_repay',
        title: 'Abono del Paladín',
        description: 'Realiza un pago o abono a tus deudas/créditos activos.',
        target: 1,
        xpReward: 120,
        xpType: 'growth' as PathType
    }
];

export const SAGA_TEMPLATES = [
    {
        id: 'saga_card',
        title: 'Senda de la Tarjeta',
        description: 'Aprende y demuestra hábitos para obtener y usar tarjetas de crédito de forma saludable.',
        target: 3, // 3 sub-tareas
        xpReward: 500,
        xpType: 'growth' as PathType,
        requirementsDescription: 'Pasos: 1. Consulta Proyecciones para simular cuotas. 2. Registra un pago a crédito. 3. Mantén tus deudas por debajo del 30% del presupuesto de gastos.'
    },
    {
        id: 'saga_builder',
        title: 'El Gran Constructor',
        description: 'Establece y consolida proyectos de inversión a largo plazo.',
        target: 3, // Financia 3 proyectos
        xpReward: 600,
        xpType: 'growth' as PathType,
        requirementsDescription: 'Crea y asigna fondos de capital a 3 proyectos de inversión.'
    },
    {
        id: 'saga_shield',
        title: 'El Escudo Inquebrantable',
        description: 'Edifica un fondo de emergencia para blindar tu economía.',
        target: 3, // Metas alcanzadas o valor acumulado
        xpReward: 600,
        xpType: 'saving' as PathType,
        requirementsDescription: 'Crea un fondo dedicado de emergencia y deposita fondos al menos 3 veces.'
    }
];

// Helper to generate default/initial quests
export const generateDefaultQuests = (): Quest[] => {
    const dailies: Quest[] = DAILY_QUEST_TEMPLATES.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: 'daily',
        target: t.target,
        current: 0,
        xpReward: t.xpReward,
        xpType: t.xpType,
        completed: false
    }));

    const weeklies: Quest[] = WEEKLY_QUEST_TEMPLATES.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: 'weekly',
        target: t.target,
        current: 0,
        xpReward: t.xpReward,
        xpType: t.xpType,
        completed: false
    }));

    const sagas: Quest[] = SAGA_TEMPLATES.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: 'saga',
        target: t.target,
        current: 0,
        xpReward: t.xpReward,
        xpType: t.xpType,
        completed: false,
        requirementsDescription: t.requirementsDescription
    }));

    // Auto-complete login quest on first launch
    dailies[0].current = 1;
    dailies[0].completed = true;

    return [...dailies, ...weeklies, ...sagas];
};

export const getDynamicAvatar = (name: string, level: number): string => {
    const tier = Math.floor(level / 10);
    const seed = `${name.replace(/[^a-zA-Z0-9]/g, '')}_tier${tier}`;
    return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=transparent`;
};
