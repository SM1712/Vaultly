import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { Sun, Moon, Settings } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/navigation';
import { useTheme } from '../../context/ThemeContext';

export const MobileDockNav = () => {
    const { theme, toggleTheme, setIsSettingsOpen } = useTheme();

    const items = NAV_SECTIONS.flatMap(section => section.items);

    return (
        <nav className="fixed bottom-4 inset-x-0 z-50 flex justify-center pointer-events-none">
            <div className={clsx(
                "flex items-center gap-1 px-3 py-1.5 mx-4",
                "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl",
                "border border-zinc-200/50 dark:border-zinc-800/50",
                "shadow-lg shadow-zinc-900/10 dark:shadow-black/40",
                "rounded-full pointer-events-auto overflow-x-auto no-scrollbar max-w-[90vw]"
            )}>
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.id}
                            to={item.to}
                            className={({ isActive }) => clsx(
                                "relative flex flex-col items-center justify-center min-w-[2.75rem] h-10 rounded-full transition-all duration-300 shrink-0",
                                isActive
                                    ? "text-white bg-primary shadow-md shadow-primary/20 scale-100"
                                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105"
                            )}
                        >
                            <Icon size={18} strokeWidth={2.5} />
                        </NavLink>
                    );
                })}

                {/* Separator */}
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1 shrink-0" />

                {/* Functional Buttons */}
                <button
                    onClick={toggleTheme}
                    className="relative flex flex-col items-center justify-center min-w-[2.75rem] h-10 rounded-full transition-all duration-300 shrink-0 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105"
                >
                    {theme === 'dark' ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
                </button>

                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="relative flex flex-col items-center justify-center min-w-[2.75rem] h-10 rounded-full transition-all duration-300 shrink-0 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105"
                >
                    <Settings size={18} strokeWidth={2.5} />
                </button>
            </div>
        </nav>
    );
};
