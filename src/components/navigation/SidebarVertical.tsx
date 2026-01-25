import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, X, Settings, Download, PanelLeftClose } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SyncStatus } from '../SyncStatus';
import { LogoCombined } from '../ui/Logo';
import { useNavigation } from '../../hooks/useNavigation';

interface SidebarVerticalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    position: 'left' | 'right';
}

export const SidebarVertical = ({ isOpen, onClose, onOpenSettings, position }: SidebarVerticalProps) => {
    const { theme, toggleTheme, toggleSidebarCollapsed, isSidebarCollapsed, sidebarVisibility } = useTheme();
    const { sections } = useNavigation();

    const isAuto = sidebarVisibility === 'auto';
    const isFloating = sidebarVisibility === 'floating';

    // Collapsed state only applies if NOT auto and NOT floating (effectively 'pinned')
    // and only on desktop (lg).
    const isCollapsed = isSidebarCollapsed && !isAuto && !isFloating;

    return (
        <aside className={clsx(
            "fixed inset-y-0 z-[60] flex flex-col transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]",
            "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl lg:shadow-none",
            !isAuto && "lg:static lg:h-full", // Static on desktop if pinned, with FULL HEIGHT enforced

            // Width Logic
            isCollapsed ? "w-72 lg:w-20" : "w-72 lg:w-64", // Mobile always 72, Desktop dynamic

            // Auto Mode Logic (Overlay)
            isAuto ? (
                position === 'left' ? "-translate-x-[calc(100%_-_12px)] hover:translate-x-0" : "translate-x-[calc(100%_-_12px)] hover:translate-x-0"
            ) : "",

            // Position & Border
            position === 'right' ? "right-0 border-l" : "left-0 border-r",

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
                "flex-1 overflow-y-auto no-scrollbar space-y-2", // Increased spacing between items
                isCollapsed ? "px-2" : "px-4"
            )}>
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        {section.title && !isCollapsed && (
                            <h4 className="px-4 text-[11px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-600 mb-3 mt-4"> {/* Increased typo and margins */}
                                {section.title}
                            </h4>
                        )}
                        {/* Divider for collapsed mode sections */}
                        {isCollapsed && idx > 0 && <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2 my-2" />}

                        {section.items.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                                className={({ isActive }) =>
                                    twMerge(
                                        clsx(
                                            "flex items-center rounded-xl transition-all duration-200 group font-medium text-sm",
                                            isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3.5", // Increased padding from 2.5 to 3.5
                                            "lg:hover:bg-zinc-50 lg:dark:hover:bg-zinc-900/50 active:scale-95 lg:active:scale-100",
                                            isActive
                                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm"
                                                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                        )
                                    )
                                }
                                title={isCollapsed ? item.label : undefined}
                                id={`nav-${item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon
                                            size={isCollapsed ? 20 : 18}
                                            className={clsx(
                                                "transition-colors",
                                                isActive ? "text-current" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                            )}
                                        />
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </>
                                )}
                            </NavLink>
                        ))}
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
                                isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3.5", // Padding matched
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
                        isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3.5" // Padding matched
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
                        isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3.5" // Padding matched
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
        </aside>
    );
};
