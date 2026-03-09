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

    // Flatten items logic (Unwrap groups so Dock shows actual apps)
    const allItems = sections.flatMap(s =>
        s.items.flatMap(i =>
            (i.subItems && i.subItems.length > 0) ? i.subItems : [i]
        )
    );

    return (

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2">

            {/* Main Dock Pill */}
            <nav className={clsx(
                "flex items-center gap-2 px-4 py-3 rounded-3xl",
                "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl",
                "border border-white/20 dark:border-zinc-800/50",
                "shadow-2xl shadow-zinc-900/20 ring-1 ring-black/5",
                "transition-all duration-300 ease-out hover:scale-[1.02]"
            )}>
                {allItems.map((item) => (
                    <div key={item.to} className="relative group flex flex-col items-center">
                        {/* Tooltip */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                            {item.label}
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                        </div>

                        <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                                twMerge(
                                    clsx(
                                        "p-3 rounded-2xl transition-all duration-300 ease-out flex items-center justify-center",
                                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                                            : "text-zinc-500 dark:text-zinc-400 hover:scale-110 hover:-translate-y-1"
                                    )
                                )
                            }
                        >
                            <item.icon size={24} className="stroke-[2px]" />
                        </NavLink>
                    </div>
                ))}

                {/* Apps Separator */}
                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-2" />

                <div className="flex gap-1 relative group">
                    {/* Settings Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                        Configuración
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                    </div>

                    <button
                        onClick={onOpenSettings}
                        className="p-3 rounded-2xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-110 hover:rotate-90 duration-500"
                    >
                        <Settings size={24} />
                    </button>
                </div>
            </nav>
        </div>
    );
};
