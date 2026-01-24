import { NavLink, useLocation } from 'react-router-dom';

import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, X, Settings, Download, PanelLeftClose } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { SyncStatus } from './SyncStatus';
import { LogoCombined } from './ui/Logo';
import { NAV_SECTIONS, ESSENTIAL_MODE_ITEMS, SIMPLE_MODE_ITEMS } from '../constants/navigation';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
}

const Sidebar = ({ isOpen, onClose, onOpenSettings }: SidebarProps) => {
    const { theme, toggleTheme, toggleSidebarCollapsed, navMode, customModeItems } = useTheme();
    const location = useLocation();

    // Logic to keep user in Onboarding environment if they are already there
    const isOnboarding = location.pathname.startsWith('/onboarding');
    const getPath = (path: string) => {
        if (!isOnboarding) return path;
        // If we are in onboarding, force all sidebar links to stay in /onboarding prefix
        return path === '/' ? '/onboarding' : `/onboarding${path}`;
    };

    // Filter and Process Sections
    const sections = NAV_SECTIONS.map(section => ({
        ...section,
        items: section.items
            .filter(item => {
                if (navMode === 'normal') return true;
                if (navMode === 'essential') return ESSENTIAL_MODE_ITEMS.includes(item.id);
                if (navMode === 'simple') return SIMPLE_MODE_ITEMS.includes(item.id);
                if (navMode === 'custom') return customModeItems.includes(item.id);
                return true;
            })
            .map(item => ({
                ...item,
                to: getPath(item.to)
            }))
    })).filter(section => section.items.length > 0); // Hide empty sections

    return (
        <>
            {/* Sidebar */}
            <aside className={clsx(
                "fixed md:static inset-y-0 left-0 z-[60] w-72 md:w-64 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] flex flex-col",
                "h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl md:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6 flex-shrink-0 flex items-center justify-between">
                    <LogoCombined />
                    <div className="flex gap-2">
                        <button
                            onClick={toggleSidebarCollapsed}
                            className="hidden md:flex p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            title="Ocultar menú lateral"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                        <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-6">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-1">
                            {section.title && (
                                <h4 className="px-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-600 mb-2 mt-2">
                                    {section.title}
                                </h4>
                            )}
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => window.innerWidth < 768 && onClose()}
                                    className={({ isActive }) =>
                                        twMerge(
                                            clsx(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm",
                                                "md:hover:bg-zinc-50 md:dark:hover:bg-zinc-900/50 active:scale-95 md:active:scale-100",
                                                isActive
                                                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                            )
                                        )
                                    }
                                    id={`nav-${item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon
                                                size={18}
                                                className={clsx(
                                                    "transition-colors",
                                                    isActive ? "text-current" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                                )}
                                            />
                                            <span>{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="p-4 mx-2 mb-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2 flex-shrink-0">
                    <NavLink
                        to="/download"
                        className={({ isActive }) =>
                            twMerge(
                                clsx(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm",
                                    "hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 stroke-2",
                                    isActive ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                                )
                            )
                        }
                    >
                        <Download size={18} />
                        <span>Descargar App</span>
                    </NavLink>

                    <button
                        onClick={() => {
                            onOpenSettings();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all font-medium text-sm"
                    >
                        <Settings size={18} />
                        <span>Configuración</span>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                        <div className="p-1 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                        </div>
                    </button>

                    <div className="flex justify-center pt-2">
                        <SyncStatus />
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
