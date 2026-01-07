import { NavLink } from 'react-router-dom';

import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Wallet, Receipt, Target, FolderKanban, Moon, Sun, PiggyBank, Landmark, Calculator, X, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
}

const Sidebar = ({ isOpen, onClose, onOpenSettings }: SidebarProps) => {
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/expenses', icon: Wallet, label: 'Gastos' },
        { to: '/income', icon: Receipt, label: 'Ingresos' }, // Changed icon from TrendingUp to Receipt
        { to: '/goals', icon: Target, label: 'Metas' },
        { to: '/funds', icon: PiggyBank, label: 'Fondos' },
        { to: '/credits', icon: Landmark, label: 'Créditos' },
        { to: '/projects', icon: FolderKanban, label: 'Proyectos' }, // Changed icon from Presentation to FolderKanban
        { to: '/projections', icon: Calculator, label: 'Proyecciones' }, // Added new item
    ];

    const isOnline = useNetworkStatus();

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            {/* Sidebar */}
            <aside className={clsx(
                "fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] flex flex-col",
                // Mobile and Desktop: Full height, plain border, shadow on mobile
                "h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl md:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-emerald-600 dark:text-emerald-500 font-mono tracking-wider">
                            VAULTLY
                        </h1>
                        <p className="text-[10px] text-zinc-400 font-medium">Personal Finance v2.0</p>
                    </div>
                    <button onClick={onClose} className="md:hidden text-zinc-500">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => window.innerWidth < 768 && onClose()}
                            className={({ isActive }) =>
                                twMerge(
                                    clsx(
                                        "flex items-center gap-4 px-5 py-3.5 md:py-2.5 rounded-2xl md:rounded-xl transition-all duration-200 group font-bold md:font-medium",
                                        "md:hover:bg-zinc-50 md:dark:hover:bg-zinc-900/50 active:scale-95 md:active:scale-100",
                                        isActive
                                            ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-md md:shadow-none"
                                            : "text-zinc-500 dark:text-zinc-400"
                                    )
                                )
                            }
                        >
                            <item.icon size={22} className={clsx("transition-colors md:w-[18px] md:h-[18px]", ({ isActive }: any) => isActive ? "text-emerald-400 dark:text-emerald-600" : "group-hover:text-emerald-500")} />
                            <span className="text-base md:text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 mx-2 mb-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">


                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center gap-4 px-5 py-3.5 md:py-2.5 rounded-2xl md:rounded-xl text-zinc-500 dark:text-zinc-400 md:hover:bg-zinc-50 md:dark:hover:bg-zinc-900 md:hover:text-emerald-500 transition-all font-bold md:font-medium active:bg-zinc-100 dark:active:bg-zinc-900"
                    >
                        <Settings size={22} className="md:w-[18px] md:h-[18px]" />
                        <span className="text-base md:text-sm">Configuración</span>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-5 py-3.5 md:py-2.5 rounded-2xl md:rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 md:hover:text-emerald-500 transition-colors border border-transparent md:hover:border-zinc-200 md:dark:hover:border-zinc-700 active:scale-95 md:active:scale-100"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    <div className="flex items-center gap-2 text-zinc-400 text-[10px] justify-center tracking-widest uppercase pt-1">
                        <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-500", isOnline ? "bg-emerald-500" : "bg-red-500")} />
                        <span>{isOnline ? "Online" : "Offline"}</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

