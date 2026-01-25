import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { LayoutGrid, Wallet, TrendingUp, Target, MoreHorizontal, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const MobileNavBar = () => {
    const { toggleSidebarCollapsed, setMobileNavStyle, setIsMobileMenuOpen } = useTheme();
    const location = useLocation();

    // Main navigation items for mobile
    const mainItems = [
        { id: 'dashboard', label: 'Inicio', icon: LayoutGrid, to: '/' },
        { id: 'expenses', label: 'Gastos', icon: Wallet, to: '/expenses' },
        { id: 'income', label: 'Ingresos', icon: TrendingUp, to: '/income' },
        { id: 'goals', label: 'Metas', icon: Target, to: '/goals' },
        // Use "More" to toggle the classic sidebar for full access
        { id: 'more', label: 'Menú', icon: MoreHorizontal, action: () => setIsMobileMenuOpen(true) },
    ];

    return (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe-area">
            <div className="flex items-center justify-around h-16 px-2">
                {mainItems.map((item) => (
                    item.to ? (
                        <NavLink
                            key={item.id}
                            to={item.to}
                            className={({ isActive }) => clsx(
                                "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-90 transition-transform",
                                isActive
                                    ? "text-primary dark:text-primary"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={clsx(
                                        "p-1 rounded-xl transition-all duration-300",
                                        isActive ? "bg-primary/10" : "bg-transparent"
                                    )}>
                                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ) : (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className="flex flex-col items-center justify-center w-full h-full gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 active:scale-90 transition-transform"
                        >
                            <div className="p-1">
                                <item.icon size={20} />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                ))}
            </div>
        </nav>
    );
};
