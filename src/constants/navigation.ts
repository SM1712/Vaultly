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
    BarChart3
} from 'lucide-react';

export interface NavItem {
    to: string;
    icon: any;
    label: string;
    id: string; // Unique identifier for settings persistence
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
            { to: '/calendar', icon: Calendar, label: 'Calendario', id: 'calendar' },
        ]
    },
    {
        title: 'Finanzas',
        items: [
            { to: '/expenses', icon: Wallet, label: 'Gastos', id: 'expenses' },
            { to: '/income', icon: Receipt, label: 'Ingresos', id: 'income' },
            { to: '/goals', icon: Target, label: 'Metas', id: 'goals' },
            { to: '/funds', icon: PiggyBank, label: 'Fondos', id: 'funds' },
            { to: '/credits', icon: Landmark, label: 'Créditos', id: 'credits' },
        ]
    },
    {
        title: 'Gestión',
        items: [
            { to: '/projects', icon: FolderKanban, label: 'Proyectos', id: 'projects' },
            { to: '/projections', icon: Calculator, label: 'Proyecciones', id: 'projections' },
            { to: '/reports', icon: BarChart3, label: 'Reportes', id: 'reports' },
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
