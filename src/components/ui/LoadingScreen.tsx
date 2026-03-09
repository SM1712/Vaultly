import Logo from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
    message?: string;
    isExiting?: boolean;
}

const LoadingScreen = ({ message = 'Iniciando...', isExiting = false }: LoadingScreenProps) => {
    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center z-[100] overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Background Accents */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="w-[40vw] h-[40vw] max-w-md max-h-md bg-primary/10 dark:bg-primary/5 blur-[100px] rounded-full" />
                    </motion.div>

                    <div className="relative flex flex-col items-center z-10">
                        {/* Logo Animation */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: [0.16, 1, 0.3, 1],
                                delay: 0.1
                            }}
                            className="relative"
                        >
                            <Logo className="w-20 h-20 md:w-24 md:h-24 pb-4 drop-shadow-2xl" />
                        </motion.div>

                        {/* Brand Name */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                            className="mt-6 flex flex-col items-center"
                        >
                            <h1 className="text-3xl md:text-4xl font-black tracking-[0.25em] text-zinc-900 dark:text-zinc-100 font-mono">
                                VAULTLY
                            </h1>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 48 }}
                                transition={{ duration: 0.8, delay: 0.6, ease: "circOut" }}
                                className="h-1 bg-primary mt-5 rounded-full"
                            />
                        </motion.div>

                        {/* Status Message */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.5, 1] }}
                            transition={{
                                duration: 2,
                                delay: 0.8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute -bottom-24 text-zinc-500 font-mono text-xs tracking-widest uppercase font-bold"
                        >
                            {message}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingScreen;
