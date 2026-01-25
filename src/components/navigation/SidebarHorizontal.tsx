import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { LogoCombined } from '../ui/Logo';
import { useNavigation } from '../../hooks/useNavigation';
import { Settings, Download, X, Plus, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';

interface SidebarHorizontalProps {
    onOpenSettings: () => void;
    position: 'top' | 'bottom';
}

export const SidebarHorizontal = ({ onOpenSettings, position }: SidebarHorizontalProps) => {
    const { sections } = useNavigation();
    const { openTabs, closeTab, addTab } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLauncherOpen, setIsLauncherOpen] = useState(false);

    // Flatten items for horizontal view to avoid nested menus
    const allItems = sections.flatMap(s => s.items);

    // Auto-add current route to tabs logic moved to Layout or here?
    // Let's do it here for now as this component is mounting.
    // Actually, Layout is better, but here is safer for "View" logic.
    useEffect(() => {
        // Find matching item
        const currentItem = allItems.find(item => item.to === location.pathname);
        if (currentItem && !openTabs.includes(currentItem.to)) {
            addTab(currentItem.to);
        }
    }, [location.pathname, allItems, openTabs, addTab]);

    const handleCloseTab = (path: string) => {
        closeTab(path);
        // If closing active tab, navigate to last one or dashboard
        if (location.pathname === path) {
            const index = openTabs.indexOf(path);
            const nextTab = openTabs[index - 1] || openTabs[index + 1];
            if (nextTab) navigate(nextTab);
            else navigate('/');
        }
    };

    const handleAddTab = (path: string) => {
        addTab(path);
        setIsLauncherOpen(false);
        navigate(path);
    };

    const isActiveTab = (path: string) => location.pathname === path;

    return (
        <aside className={clsx(
            "fixed left-0 right-0 z-[60] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 flex items-center px-6 h-16 shadow-sm",
            position === 'top' ? "top-0 border-b" : "bottom-0 border-t"
        )}>
            {/* Logo Area */}
            <div className="flex-shrink-0 mr-4 scale-90 origin-left">
                <LogoCombined />
            </div>

            {/* Scrollable Nav Area (Tabs) */}
            <nav className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar h-full mask-linear-fade pr-2">
                {allItems.filter(item => openTabs.includes(item.to)).map((item) => (
                    <div
                        key={item.to}
                        className={clsx(
                            "group relative flex items-center h-10 px-1 py-1 rounded-t-lg transition-all duration-200",
                            "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                            // Active State (Tab shape)
                            isActiveTab(item.to)
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700 z-10"
                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border-b-2 border-transparent"
                        )}
                    >
                        <NavLink
                            to={item.to}
                            className="flex items-center gap-2 px-3 h-full outline-none"
                        >
                            <item.icon
                                size={14}
                                className={clsx(
                                    isActiveTab(item.to) ? "text-primary" : "text-zinc-400 dark:text-zinc-500"
                                )}
                            />
                            <span className="text-xs font-medium max-w-[100px] truncate">{item.label}</span>
                        </NavLink>

                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCloseTab(item.to);
                            }}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500 transition-all mr-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* New Tab Button */}
                <div className="relative">
                    <button
                        onClick={() => setIsLauncherOpen(!isLauncherOpen)}
                        className="p-2 ml-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Nueva Pestaña"
                    >
                        {isLauncherOpen ? <ChevronDown size={18} /> : <Plus size={18} />}
                    </button>

                    {/* Launcher Dropdown */}
                    {isLauncherOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-2 grid grid-cols-1 gap-1 max-h-[60vh] overflow-y-auto">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Aplicaciones</div>
                            {allItems.filter(item => !openTabs.includes(item.to)).map(item => (
                                <button
                                    key={item.to}
                                    onClick={() => handleAddTab(item.to)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-left text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                >
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                            {allItems.filter(item => !openTabs.includes(item.to)).length === 0 && (
                                <div className="px-3 py-4 text-center text-xs text-zinc-400 italic">
                                    Todas las apps están abiertas
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Actions Area */}
            <div className="flex-shrink-0 flex items-center gap-2 ml-4 pl-4 border-l border-zinc-100 dark:border-zinc-800 h-8">
                <NavLink
                    to="/download"
                    className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Descargar App"
                >
                    <Download size={18} />
                </NavLink>
                <button
                    onClick={onOpenSettings}
                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Configuración"
                >
                    <Settings size={18} />
                </button>
            </div>
        </aside>
    );
};
