import { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const IOSPWAPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Detectar si es iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        // Detectar si ya está en modo standalone (ya instalado)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        // Verificar si el usuario ya lo cerró anteriormente
        const hasDismissed = localStorage.getItem('ios-pwa-prompt-dismissed');

        if (isIOS && !isStandalone && !hasDismissed) {
            // Mostrar después de un pequeño delay para no ser intrusivo inmediatamente
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('ios-pwa-prompt-dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center pointer-events-none pb-6 sm:pb-0 px-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                    />

                    {/* Modal Card */}
                    <motion.div
                        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 p-6 rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto relative overflow-hidden"
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors bg-black/5 dark:bg-white/5 rounded-full"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
                                    <Smartphone size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                                        Instalar App
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Para una mejor experiencia
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                                    <Share className="text-blue-500 shrink-0" size={24} />
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                        1. Toca el botón <strong>Compartir</strong> en la barra inferior.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                                    <PlusSquare className="text-blue-500 shrink-0" size={24} />
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                        2. Selecciona <strong>Agregar a Inicio</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
