import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Check, Palette, Monitor, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { theme, toggleTheme, themeStyle, setThemeStyle } = useTheme();
    const modalRef = useRef<HTMLDivElement>(null);

    const themeStyles: { id: string; name: string; color: string }[] = [
        { id: 'classic', name: 'Clásico', color: 'bg-emerald-500' },
        { id: 'clay', name: 'Clay', color: 'bg-orange-400' },
        { id: 'mist', name: 'Mist', color: 'bg-cyan-500' },
        { id: 'royal', name: 'Royal', color: 'bg-purple-600' },
        { id: 'bloom', name: 'Bloom', color: 'bg-pink-500' },
        { id: 'sage', name: 'Sage', color: 'bg-stone-500' },
        { id: 'nordic', name: 'Nordic', color: 'bg-slate-500' },
    ];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="w-full max-w-2xl bg-white dark:bg-[#1a1d2d] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Personaliza tu experiencia en Planivio.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Appearance Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <Monitor size={18} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Apariencia</h3>
                        </div>

                        <div className="space-y-6 pl-11">
                            {/* Dark/Light Mode */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Modo</h4>
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5 w-full sm:w-auto"
                                >
                                    <div className="flex items-center gap-3">
                                        {theme === 'dark' ? <Moon size={20} className="text-violet-500 dark:text-violet-400" /> : <Sun size={20} className="text-amber-500" />}
                                        <span className="font-medium text-slate-900 dark:text-white min-w-[100px] text-left">
                                            {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                                        </span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-violet-600' : 'bg-slate-400'}`}>
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Theme Styles */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <Palette size={14} />
                                    Paleta de Colores
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {themeStyles.map(style => (
                                        <button
                                            key={style.id}
                                            onClick={() => setThemeStyle(style.id as any)}
                                            className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all ${themeStyle === style.id
                                                    ? 'bg-violet-50 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/50'
                                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-violet-300 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full ${style.color} shadow-sm ring-2 ring-white dark:ring-white/10`} />
                                            <span className={`text-sm font-medium ${themeStyle === style.id
                                                    ? 'text-violet-700 dark:text-white'
                                                    : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                                                }`}>
                                                {style.name}
                                            </span>
                                            {themeStyle === style.id && (
                                                <div className="absolute top-2 right-2 text-violet-600 dark:text-violet-400">
                                                    <Check size={12} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Planivio v2.2 • Designed for Students</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
