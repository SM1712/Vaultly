import { Search, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface SettingsSidebarProps {
    menuGroups: {
        title: string;
        items: {
            id: string;
            label: string;
            icon: any;
        }[];
    }[];
    activeTab: string;
    onSelectTab: (id: string) => void;
}

export const SettingsSidebar = ({ menuGroups, activeTab, onSelectTab }: SettingsSidebarProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    return (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-2 md:p-3 w-full md:w-64 flex-shrink-0 h-full">
            {/* Search Bar */}
            <div className="px-1 mb-4">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar ajuste..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-zinc-400"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                {filteredGroups.length > 0 ? filteredGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1">
                        {group.title && (
                            <h3 className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 mt-2">
                                {group.title}
                            </h3>
                        )}
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSelectTab(item.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group border md:border-transparent",
                                    activeTab === item.id
                                        ? "md:bg-white md:dark:bg-zinc-800 md:shadow-sm md:border-zinc-200 md:dark:border-zinc-700 font-bold bg-white shadow-sm border-zinc-200"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent"
                                )}
                            >
                                <div className={clsx("p-1.5 rounded-lg shrink-0", activeTab === item.id ? "bg-primary/10 text-primary" : "bg-transparent text-zinc-500 dark:text-zinc-500")}>
                                    <item.icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={clsx("block text-sm truncate", activeTab === item.id ? "text-zinc-900 dark:text-zinc-100" : "")}>{item.label}</span>
                                </div>

                                {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                <ChevronRight size={16} className="md:hidden text-zinc-300" />
                            </button>
                        ))}
                    </div>
                )) : (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                        No se encontraron resultados
                    </div>
                )}
            </div>

            <div className="hidden md:block px-4 py-2 text-[10px] text-zinc-400 font-mono text-center opacity-50 mt-auto">
                Vault Ledger v2.2
            </div>
        </div>
    );
};
