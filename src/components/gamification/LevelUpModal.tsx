import { Award, ArrowRight } from 'lucide-react';

export const LevelUpModal = () => {
    // Kept for backward compatibility if ever mounted passively.
    return null;
};

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    title: string;
}

const LevelUpModalContent = ({ isOpen, onClose, level, title }: LevelUpModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm">

                {/* Modern Glassmorphism Notification Box */}
                <div className="relative bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl p-6 rounded-3xl overflow-hidden backdrop-blur-xl transform transition-all animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">

                    {/* Subtle Top Gradient Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 flex justify-center">
                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center">

                        {/* Clean Badge */}
                        <div className="relative mb-5 flex justify-center items-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-zinc-800 dark:to-zinc-800/50 border border-indigo-100 dark:border-zinc-700 shadow-inner">
                            <Award className="w-10 h-10 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />

                            {/* Floating Level Bubble */}
                            <div className="absolute -bottom-2 -right-2 bg-indigo-600 dark:bg-indigo-500 text-white font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md ring-4 ring-white dark:ring-zinc-900">
                                {level}
                            </div>
                        </div>

                        {/* Text */}
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">
                            ¡Siguiente Nivel Alcanzado!
                        </h2>

                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                            Tu constancia ha rendido frutos. Has desbloqueado el rango de <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">{title}</span>.
                        </p>

                        {/* Action Button */}
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                            <span>Continuar</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelUpModalContent;
