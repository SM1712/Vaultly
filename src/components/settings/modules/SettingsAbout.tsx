import { Rocket, PlayCircle } from 'lucide-react';
import Logo from '../../ui/Logo';
import { HelpCenter } from '../../help/HelpCenter';
import { BookOpen } from 'lucide-react';

export const SettingsAbout = () => {
    // Changelog could be a separate component if it grows
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="mb-6 flex justify-center">
                    <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10 shadow-[0_0_30px_-10px] shadow-primary/20 rotate-3 transition-transform hover:rotate-6">
                        <Logo size={56} />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Novedades de Vaultly</h2>
                <p className="text-zinc-500 text-sm">Historial de actualizaciones y mejoras.</p>
            </div>

            <div className="relative pl-8 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-10">
                {/* Simplified Changelog for brevity in module - keeping key items */}
                <div className="relative">
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-amber-500 border-4 border-white dark:border-zinc-950 shadow-sm ring-4 ring-amber-500/20" />
                    <div className="flex flex-col mb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Actualización Masiva</span>
                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">v2.2 - Financial Clarity Refined</p>
                            </div>
                            <span className="text-xs text-amber-100 bg-amber-600 px-2 py-1 rounded-full font-bold">New</span>
                        </div>
                        <span className="text-xs text-zinc-400">Enero 2026</span>
                    </div>
                    <div className="space-y-4 mb-4">
                        <div>
                            <h5 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-2">
                                <BookOpen size={14} className="text-amber-500" /> Libro Contable 2.0
                            </h5>
                            <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                                <li><strong>Diseño Reimaginado:</strong> Agrupación inteligente por días y gráfico de tendencia de flujo de caja.</li>
                                <li><strong>Exportación PDF:</strong> Genera reportes financieros detallados.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                {/* ... More changelog items can be added here ... */}
            </div>
        </div>
    );
};

export const SettingsHelp = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
            <div className="mb-6 p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 flex items-center justify-between">
                    <div>
                        <h4 className="font-black text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                            <Rocket className="text-indigo-500" /> Entrenamiento Básico
                        </h4>
                        <p className="text-sm text-zinc-500 max-w-md mt-1">
                            Aprende a usar Vaultly en un entorno de simulación seguro.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            window.location.hash = '#/onboarding';
                        }}
                        className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                    >
                        <PlayCircle size={20} />
                        Iniciar Tutorial
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <HelpCenter />
            </div>
        </div>
    );
}
