import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../../components/ui/Modal'; // Asegurarse que la ruta es correcta
import {
    Palette, LayoutGrid, ChevronRight, Moon, Sun
} from 'lucide-react';

interface PlanivioSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PlanivioSettingsModal = ({ isOpen, onClose }: PlanivioSettingsModalProps) => {
    const { theme, toggleTheme, themeStyle, setThemeStyle } = useTheme();

    // Tabs state
    const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('appearance');
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

    // Theme Definitions (Reutilizado de SettingsMenu)
    const themes = [
        { id: 'classic', name: 'Soft Stone', color: 'bg-[#a8a29e]' }, // stone-400
        { id: 'clay', name: 'Soft Clay', color: 'bg-[#fb923c]' }, // orange-400
        { id: 'sand', name: 'Soft Sand', color: 'bg-[#d6b885]' }, // custom sand
        { id: 'coffee', name: 'Soft Coffee', color: 'bg-[#b97f6a]' }, // custom coffee
        { id: 'sage', name: 'Soft Sage', color: 'bg-[#64ad84]' }, // custom sage
        { id: 'nordic', name: 'Soft Nordic', color: 'bg-[#0ea5e9]' }, // sky-500
        { id: 'mist', name: 'Soft Mist', color: 'bg-[#94a3b8]' }, // slate-400
        { id: 'royal', name: 'Soft Royal', color: 'bg-[#a78bfa]' }, // violet-400
        { id: 'bloom', name: 'Soft Bloom', color: 'bg-[#fb7185]' }, // rose-400
        { id: 'comic', name: 'Comic Pop', color: 'bg-[#fde047] border-2 border-[#451a03]' }, // amber-300
        { id: 'pop', name: 'Electric Pop', color: 'bg-[#3b82f6] border-2 border-white' }, // blue-500
    ];

    // Groups Definition
    const menuGroups = [
        {
            title: 'General',
            items: [
                { id: 'appearance', label: 'Apariencia', icon: Palette },
                { id: 'general', label: 'Cuenta', icon: LayoutGrid },
            ]
        }
    ] as const;

    const getActiveLabel = () => {
        for (const group of menuGroups) {
            const item = group.items.find(i => i.id === activeTab);
            if (item) return item.label;
        }
        return 'Configuración';
    };

    const handleClose = () => {
        setIsMobileDetailOpen(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={isMobileDetailOpen ? getActiveLabel() : 'Configuración'} maxWidth="max-w-5xl" className="h-[100dvh] md:h-[650px] w-full" noPadding={true}>
            <div className="flex h-full w-full overflow-hidden relative text-slate-900 dark:text-slate-100">

                {/* 1. SIDEBAR NAVIGATION */}
                <div className={`
                    bg-slate-50 dark:bg-[#0f111a] border-r border-slate-200 dark:border-white/5 flex flex-col p-2 md:p-3 space-y-6 overflow-y-auto no-scrollbar
                    ${isMobileDetailOpen ? 'hidden md:flex md:w-64 flex-shrink-0' : 'w-full md:w-64 flex-shrink-0'}
                `}>
                    {menuGroups.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-1">
                            {group.title && (
                                <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2">
                                    {group.title}
                                </h3>
                            )}
                            {group.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id as any);
                                        setIsMobileDetailOpen(true);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group border md:border-transparent
                                        ${activeTab === item.id
                                            ? 'md:bg-white md:dark:bg-white/5 md:shadow-md md:border-slate-200 md:dark:border-white/5 font-bold bg-white shadow-sm border-slate-200'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border-transparent'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-lg shrink-0 ${activeTab === item.id ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-transparent text-slate-500 dark:text-slate-500'}`}>
                                        <item.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`block text-sm truncate ${activeTab === item.id ? 'text-slate-900 dark:text-white' : ''}`}>{item.label}</span>
                                    </div>

                                    {activeTab === item.id && <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />}
                                    <ChevronRight size={16} className="md:hidden text-slate-300" />
                                </button>
                            ))}
                        </div>
                    ))}

                    <div className="flex-1" />
                    <div className="hidden md:block px-4 py-2 text-[10px] text-slate-400 font-mono text-center opacity-50">
                        Planivio via Vault
                    </div>
                </div>

                {/* 2. CONTENT AREA */}
                <div className={`
                    flex-1 bg-white dark:bg-[#0a0b14]
                    ${isMobileDetailOpen ? 'block w-full' : 'hidden md:block'}
                    overflow-y-auto
                `}>
                    {/* Mobile Header */}
                    <div className="md:hidden sticky top-0 z-20 bg-white/80 dark:bg-[#0a0b14]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileDetailOpen(false)}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                        >
                            <ChevronRight className="rotate-180" size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {getActiveLabel()}
                        </h2>
                    </div>

                    <div className="p-4 md:p-8 pb-20 md:pb-8">

                        {activeTab === 'appearance' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Theme Toggle (Light/Dark) */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Modo</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => theme === 'dark' && toggleTheme()}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light'
                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-300'
                                                : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'
                                                }`}
                                        >
                                            <Sun size={24} />
                                            <span className="font-bold text-sm">Claro</span>
                                        </button>
                                        <button
                                            onClick={() => theme === 'light' && toggleTheme()}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark'
                                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-300'
                                                : 'border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'
                                                }`}
                                        >
                                            <Moon size={24} />
                                            <span className="font-bold text-sm">Oscuro</span>
                                        </button>
                                    </div>
                                </section>

                                {/* Theme Styles */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tema de Color</h3>
                                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">Global</span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {themes.map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => setThemeStyle(style.id as any)}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all relative overflow-hidden group ${themeStyle === style.id
                                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10 shadow-md'
                                                    : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-full ${style.color} shadow-sm group-hover:scale-110 transition-transform duration-300`} />
                                                <span className={`text-sm font-bold ${themeStyle === style.id ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {style.name}
                                                </span>
                                                {themeStyle === style.id && (
                                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="text-center py-10 opacity-50">
                                <LayoutGrid className="mx-auto mb-4 text-slate-300" size={48} />
                                <p>Configuración de cuenta gestionada en Vault Principal.</p>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default PlanivioSettingsModal;
