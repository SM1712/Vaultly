import {
    LayoutDashboard,
    Wallet,
    Receipt,
    Target,
    FolderKanban,
    PiggyBank,
    Landmark,
    Calculator,
    Calendar,
    BarChart3,
    Compass
} from 'lucide-react';

export interface NavItem {
    to: string;
    icon: any;
    label: string;
    id: string; // Unique identifier for settings persistence
    subItems?: NavItem[]; // Generic recursive structure
}

export interface NavSection {
    title?: string;
    items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
    {
        title: undefined,
        items: [
            { to: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
            { to: '/gamification', icon: Compass, label: 'Senda', id: 'gamification' },
        ]
    },
    {
        title: 'Gestión',
        items: [
            {
                to: '/finance', // Virtual path or redirect
                icon: Wallet,
                label: 'Finanzas',
                id: 'finance_group',
                subItems: [
                    { to: '/expenses', icon: Wallet, label: 'Gastos', id: 'expenses' },
                    { to: '/income', icon: Receipt, label: 'Ingresos', id: 'income' },
                    { to: '/funds', icon: PiggyBank, label: 'Fondos', id: 'funds' },
                ]
            },
            {
                to: '/planning',
                icon: Target,
                label: 'Planificación',
                id: 'planning_group',
                subItems: [
                    { to: '/goals', icon: Target, label: 'Metas', id: 'goals' },
                    { to: '/calendar', icon: Calendar, label: 'Calendario', id: 'calendar' },
                    { to: '/projections', icon: Calculator, label: 'Proyecciones', id: 'projections' },
                ]
            },
            {
                to: '/analysis',
                icon: BarChart3,
                label: 'Análisis',
                id: 'analysis_group',
                subItems: [
                    { to: '/reports', icon: BarChart3, label: 'Reportes', id: 'reports' },
                    { to: '/credits', icon: Landmark, label: 'Créditos', id: 'credits' },
                ]
            },
            {
                to: '/tools',
                icon: FolderKanban,
                label: 'Herramientas',
                id: 'tools_group',
                subItems: [
                    { to: '/projects', icon: FolderKanban, label: 'Proyectos', id: 'projects' },
                ]
            }
        ]
    }
];

// Default items enabled in Simple Mode
export const SIMPLE_MODE_ITEMS = [
    'dashboard',
    'expenses',
    'income',
    'goals',
    'funds',
    'credits'
];

// Items enabled in Essential Mode
export const ESSENTIAL_MODE_ITEMS = [
    'dashboard',
    'expenses',
    'income'
];
