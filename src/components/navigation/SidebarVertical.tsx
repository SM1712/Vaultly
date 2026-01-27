import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, X, Settings, Download, PanelLeftClose, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SyncStatus } from '../SyncStatus';
import { LogoCombined } from '../ui/Logo';
import { useNavigation } from '../../hooks/useNavigation';
import { useState, useEffect } from 'react';

interface SidebarVerticalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    position: 'left' | 'right';
}

export const SidebarVertical = ({ isOpen, onClose, onOpenSettings, position }: SidebarVerticalProps) => {
    const { theme, toggleTheme, toggleSidebarCollapsed, isSidebarCollapsed, sidebarVisibility } = useTheme();
    const { sections } = useNavigation();
    const location = useLocation();

    // State for expanded groups
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    const isAuto = sidebarVisibility === 'auto';
    const isFloating = sidebarVisibility === 'floating';

    // Collapsed state only applies if NOT auto and NOT floating (effectively 'pinned')
    // and only on desktop (lg). On mobile (isOpen), we always want expanded text.
    const isCollapsed = isSidebarCollapsed && !isAuto && !isFloating && !isOpen;

    // Auto-expand groups based on active route
    useEffect(() => {
        const activeGroupIds: string[] = [];
        sections.forEach(section => {
            section.items.forEach(item => {
                if (item.subItems) {
                    const hasActiveChild = item.subItems.some(sub => sub.to === location.pathname);
                    if (hasActiveChild) {
                        activeGroupIds.push(item.id);
                    }
                }
            });
        });

        if (activeGroupIds.length > 0) {
            setExpandedGroups(prev => [...new Set([...prev, ...activeGroupIds])]);
        }
    }, [location.pathname, sections]); // Depend on sections/location

    const toggleGroup = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCollapsed) return; // Don't toggle in collapsed mode (maybe open popover? strictly disable for now)

        setExpandedGroups(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    return (
        <aside className={clsx(
            "fixed inset-y-0 z-[60] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] pointer-events-auto",
            "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl lg:shadow-none",
            !isAuto && "lg:static lg:h-full",

            // Width Logic
            isCollapsed ? "w-20" : "w-72", // Simplified width logic, removing complex responsive conditional for clarity

            // Auto Mode & Position Logic
            isAuto && (position === 'left' ? "-translate-x-[calc(100%_-_12px)] hover:translate-x-0" : "translate-x-[calc(100%_-_12px)] hover:translate-x-0"),
            position === 'right' ? "right-0 border-l" : "left-0 border-r", // Position

            // Mobile Visibility
            isOpen
                ? "translate-x-0"
                : (!isAuto && (position === 'left' ? "-translate-x-full lg:translate-x-0" : "translate-x-full lg:translate-x-0"))
        )}>
            {/* Header */}
            <div className={clsx(
                "flex-shrink-0 flex items-center transition-all duration-300",
                isCollapsed ? "flex-col gap-4 py-4" : "p-6 justify-between"
            )}>
                <div className={clsx("transition-transform duration-300", isCollapsed && "scale-75")}>
                    <LogoCombined showText={!isCollapsed} />
                </div>

                {/* Toggle Button */}
                <div className={clsx("flex gap-2", isCollapsed ? "flex-col items-center" : "")}>
                    <button
                        onClick={toggleSidebarCollapsed}
                        className={clsx(
                            "hidden lg:flex p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            isCollapsed && "bg-zinc-50 dark:bg-zinc-900"
                        )}
                        title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                    >
                        <PanelLeftClose size={20} className={clsx("transition-transform duration-300",
                            position === 'right' ? (isCollapsed ? "rotate-0" : "rotate-180") : (isCollapsed ? "rotate-180" : "rotate-0")
                        )} />
                    </button>
                    {!isCollapsed && (
                        <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className={clsx(
                "flex-1 overflow-y-auto no-scrollbar space-y-6", // Increased spacing between sections
                isCollapsed ? "px-2" : "px-4"
            )}>
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        {section.title && !isCollapsed && (
                            <h4 className="px-4 text-[11px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-600 mb-2">
                                {section.title}
                            </h4>
                        )}
                        {/* Divider for collapsed mode sections */}
                        {isCollapsed && idx > 0 && <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2 my-2" />}

                        {section.items.map((item) => {
                            // Flat Style: Treat items with subItems as Group Headers
                            if (item.subItems) {
                                return (
                                    <div key={item.id} className="mb-4">
                                        {!isCollapsed && (
                                            <h5 className="px-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-600 mb-2 mt-4 flex items-center gap-2">
                                                <item.icon size={12} className="opacity-70" /> {item.label}
                                            </h5>
                                        )}
                                        {/* Divider for collapsed */}
                                        {isCollapsed && <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2 my-2" />}

                                        <div className="space-y-0.5">
                                            {item.subItems.map(subItem => {
                                                const isActive = subItem.to === location.pathname;
                                                return (
                                                    <NavLink
                                                        key={subItem.to}
                                                        to={subItem.to}
                                                        onClick={() => window.innerWidth < 1024 && onClose()}
                                                        className={clsx(
                                                            "flex items-center gap-3 rounded-lg transition-all duration-200 group font-medium text-sm border border-transparent",
                                                            isCollapsed ? "justify-center p-2.5 mx-1" : "px-4 py-2 mx-2",
                                                            isActive
                                                                ? "bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border-indigo-50 dark:border-indigo-900/10"
                                                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                                                        )}
                                                        title={isCollapsed ? subItem.label : undefined}
                                                    >
                                                        <subItem.icon size={isCollapsed ? 18 : 16} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-600"} />
                                                        {!isCollapsed && <span>{subItem.label}</span>}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }

                            // Standard Item
                            const isActive = item.to === location.pathname;
                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.to}
                                    onClick={() => window.innerWidth < 1024 && onClose()}
                                    className={clsx(
                                        "flex items-center gap-3 rounded-lg transition-all duration-200 group font-medium text-sm border border-transparent mb-1",
                                        isCollapsed ? "justify-center p-2.5 mx-1" : "px-4 py-2 mx-2",
                                        isActive
                                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                    id={`nav-${item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                >
                                    <item.icon
                                        size={isCollapsed ? 18 : 16}
                                        className={clsx(
                                            "transition-colors",
                                            isActive ? "text-current" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                        )}
                                    />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className={clsx(
                "mb-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2 flex-shrink-0",
                isCollapsed ? "p-2 mx-0" : "p-4 mx-2"
            )}>
                <NavLink
                    to="/download"
                    className={({ isActive }) =>
                        twMerge(
                            clsx(
                                "flex items-center rounded-xl transition-all duration-200 group font-medium text-sm",
                                isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3.5",
                                "hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 stroke-2",
                                isActive ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                            )
                        )
                    }
                    title={isCollapsed ? "Descargar App" : undefined}
                >
                    <Download size={18} />
                    {!isCollapsed && <span>Descargar App</span>}
                </NavLink>

                <button
                    onClick={() => {
                        onOpenSettings();
                        onClose();
                    }}
                    className={clsx(
                        "w-full flex items-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all font-medium text-sm",
                        isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3.5"
                    )}
                    title={isCollapsed ? "Configuración" : undefined}
                >
                    <Settings size={18} />
                    {!isCollapsed && <span>Configuración</span>}
                </button>

                <button
                    onClick={toggleTheme}
                    className={clsx(
                        "w-full flex items-center rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                        isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3.5"
                    )}
                    title={isCollapsed ? `Modo ${theme === 'dark' ? 'Oscuro' : 'Claro'}` : undefined}
                >
                    {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>}
                    <div className={clsx("rounded-lg shadow-sm", !isCollapsed && "p-1 bg-white dark:bg-zinc-800")}>
                        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                    </div>
                </button>

                <div className="flex justify-center pt-2">
                    <SyncStatus />
                </div>
            </div>
        </aside >
    );
};
