import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, TrendingUp, Target, Presentation, Sun, Moon, X, Settings, PiggyBank } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
        { to: '/income', icon: TrendingUp, label: 'Ingresos' },
        { to: '/goals', icon: Target, label: 'Metas' },
        { to: '/funds', icon: PiggyBank, label: 'Fondos' },
        { to: '/projects', icon: Presentation, label: 'Proyectos' },
    ];

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
            <aside className={clsx(
                "fixed md:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out flex flex-col",
                // Floating island style for desktop
                "md:h-[calc(100vh-2rem)] md:m-4 md:rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/50",
                // Mobile style (full height)
                "h-full",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-500 font-mono tracking-wider">
                            VAULTLY
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1 font-medium">Personal Finance v2.0</p>
                    </div>
                    <button onClick={onClose} className="md:hidden text-zinc-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 px-3 py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => window.innerWidth < 768 && onClose()}
                            className={({ isActive }) =>
                                twMerge(
                                    clsx(
                                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group font-medium",
                                        "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:pl-6",
                                        isActive
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/20 dark:shadow-zinc-200/10"
                                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                    )
                                )
                            }
                        >
                            <item.icon size={20} className={clsx("transition-colors", ({ isActive }: any) => isActive ? "text-emerald-400 dark:text-emerald-600" : "group-hover:text-emerald-500")} />
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 mx-3 mb-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-emerald-500 transition-all font-medium"
                    >
                        <Settings size={20} />
                        <span className="text-sm">Configuración</span>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                    >
                        <span className="text-sm font-medium">Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    <div className="flex items-center gap-2 text-zinc-400 text-[10px] justify-center tracking-widest uppercase pt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

