import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigation } from '../../hooks/useNavigation';
import { Settings } from 'lucide-react';
// import { useTheme } from '../../context/ThemeContext'; // Unused

interface SidebarDockProps {
    onOpenSettings: () => void;
}

export const SidebarDock = ({ onOpenSettings }: SidebarDockProps) => {
    const { sections } = useNavigation();
    // const { theme } = useTheme(); // Unused
    // const [hoveredIndex, setHoveredIndex] = useState<number | null>(null); // Hover logic simplified to CSS for now

    // Flatten items logic
    const allItems = sections.flatMap(s => s.items);

    return (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 w-full max-w-[85vw] sm:max-w-fit">

            {/* Main Dock Pill */}
            <nav className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl",
                "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
                "border border-white/20 dark:border-zinc-800/50",
                "shadow-2xl shadow-zinc-900/20 ring-1 ring-black/5",
                "overflow-x-auto no-scrollbar w-full sm:w-auto"
            )}>
                {allItems.map((item) => (
                    <div key={item.to} className="relative group">
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {item.label}
                        </div>

                        <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                                twMerge(
                                    clsx(
                                        "p-2 rounded-xl transition-all duration-300 ease-out flex items-center justify-center",
                                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                                            : "text-zinc-500 dark:text-zinc-400 hover:scale-110"
                                    )
                                )
                            }
                        >
                            <item.icon size={20} className="stroke-[2.5px]" />
                        </NavLink>
                    </div>
                ))}

                {/* Apps Separator */}
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                <div className="flex gap-1">
                    <button
                        onClick={onOpenSettings}
                        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-110"
                        title="Configuración"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </nav>
        </div>
    );
};
