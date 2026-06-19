import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    isExiting?: boolean;
}

const LoadingScreen = ({ message = 'Iniciando...', isExiting = false }: LoadingScreenProps) => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    // Smooth animation for the progress counter (0 to 100)
    useEffect(() => {
        let startTime = performance.now();
        const duration = 1500; // 1.5 seconds

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const rate = elapsed / duration;

            // EaseInOutCubic progress curve for organic acceleration & deceleration
            const ease = rate < 0.5 
                ? 4 * rate * rate * rate 
                : 1 - Math.pow(-2 * rate + 2, 3) / 2;

            const currentProgress = Math.min(Math.round(ease * 100), 100);
            setProgress(currentProgress);

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, []);

    // Technical startup logs synced with progress
    useEffect(() => {
        const newLogs: string[] = [];
        if (progress >= 5) newLogs.push("SECURE_CHANNEL: OK (SSL_256_GCM)");
        if (progress >= 22) newLogs.push("IDENTITY_RESOLVER: SYNCING GATEWAY...");
        if (progress >= 48) newLogs.push("FIREBASE_AUTH: SESSION VERIFIED");
        if (progress >= 72) newLogs.push("DATABASE_LEDGER: SYNCED & SECURED");
        if (progress >= 92) newLogs.push("VAULTLY_ENGINE: READY (BOOT_SUCCESS)");
        setLogs(newLogs);
    }, [progress]);

    // Slice to show only the latest 3 logs
    const visibleLogs = logs.slice(-3);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center z-[100] overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Background Grid Overlay */}
                    <div 
                        className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-60" 
                    />

                    {/* Floating Ambient Light Blobs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1],
                                x: [0, 40, 0],
                                y: [0, -20, 0],
                            }}
                            transition={{
                                duration: 12,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="absolute top-1/4 left-1/4 w-[45vw] h-[45vw] max-w-sm rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/5 dark:from-indigo-950/20 dark:to-violet-950/10 blur-[90px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1.15, 1, 1.15],
                                x: [0, -30, 0],
                                y: [0, 30, 0],
                            }}
                            transition={{
                                duration: 14,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] max-w-sm rounded-full bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 dark:from-cyan-950/15 dark:to-indigo-950/10 blur-[90px]"
                        />
                    </div>

                    {/* Central Glassmorphism Card */}
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative flex flex-col items-center z-10 px-8 py-10 md:px-12 md:py-12 rounded-3xl bg-white/20 dark:bg-zinc-900/20 border border-white/20 dark:border-zinc-800/30 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] max-w-xs md:max-w-sm w-full mx-4"
                    >
                        {/* Logo Container with Glow */}
                        <div className="relative p-5 rounded-2xl bg-white/30 dark:bg-zinc-800/20 border border-white/30 dark:border-zinc-700/20 shadow-inner group">
                            <motion.div
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(99,102,241,0.15)",
                                        "0 0 35px rgba(99,102,241,0.35)",
                                        "0 0 20px rgba(99,102,241,0.15)"
                                    ]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 rounded-2xl pointer-events-none"
                            />
                            
                            {/* Animated Logo SVG */}
                            <svg
                                width="72"
                                height="72"
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="relative"
                            >
                                {/* Outer V/Vault Shape - Path Drawing */}
                                <motion.path
                                    d="M16 2L4 8L16 28L28 8L16 2Z"
                                    stroke="var(--color-primary, #6366f1)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{
                                        duration: 1.4,
                                        ease: "easeInOut",
                                    }}
                                />
                                <motion.path
                                    d="M16 2L4 8L16 28L28 8L16 2Z"
                                    fill="var(--color-primary, #6366f1)"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.12 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: 1.0,
                                        ease: "easeOut"
                                    }}
                                />

                                {/* Inner V/Vault Shape - Path Drawing */}
                                <motion.path
                                    d="M16 8L8 12L16 24L24 12L16 8Z"
                                    stroke="var(--color-primary, #6366f1)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{
                                        duration: 1.1,
                                        delay: 0.3,
                                        ease: "easeInOut",
                                    }}
                                />
                                <motion.path
                                    d="M16 8L8 12L16 24L24 12L16 8Z"
                                    fill="var(--color-primary, #6366f1)"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.85 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: 1.1,
                                        ease: "easeOut"
                                    }}
                                />

                                {/* Center core circle */}
                                <motion.circle
                                    cx="16"
                                    cy="16"
                                    r="2.2"
                                    fill="#ffffff"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 250,
                                        damping: 12,
                                        delay: 1.25
                                    }}
                                />
                            </svg>
                        </div>

                        {/* Brand Header */}
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                            className="text-2xl font-black tracking-[0.25em] text-zinc-900 dark:text-zinc-100 font-mono mt-6"
                        >
                            VAULTLY
                        </motion.h1>

                        {/* Top Parent Message */}
                        <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 dark:text-zinc-400 mt-6 min-h-[1.5em] flex items-center justify-center">
                            <motion.span
                                key={message}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="font-bold"
                            >
                                {message}
                            </motion.span>
                        </div>

                        {/* Liquid Progress Bar */}
                        <div className="w-56 h-[3px] bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative mt-2 shadow-inner">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 via-[var(--color-primary,#6366f1)] to-cyan-400 absolute left-0 top-0 rounded-full"
                                style={{ 
                                    width: `${progress}%`,
                                    boxShadow: '0 0 8px var(--color-primary, #6366f1)'
                                }}
                                transition={{ ease: "easeOut" }}
                            />
                        </div>

                        {/* Percentage Indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-2 font-bold tracking-widest"
                        >
                            {progress}%
                        </motion.div>

                        {/* Console Technical Logs */}
                        <div className="h-20 mt-6 flex flex-col justify-end font-mono text-[9px] text-zinc-400 dark:text-zinc-500 tracking-wider w-full text-left bg-zinc-950/5 dark:bg-zinc-950/20 border border-zinc-200/20 dark:border-zinc-800/40 rounded-xl p-3 select-none">
                            <div className="absolute top-2 right-3 flex items-center gap-1.5 opacity-60">
                                <Shield className="w-2.5 h-2.5 text-zinc-400" />
                                <span className="text-[8px] font-bold">SECURE_BOOT</span>
                            </div>
                            
                            <div className="space-y-1 overflow-hidden">
                                <AnimatePresence mode="popLayout">
                                    {visibleLogs.map((log) => (
                                        <motion.div
                                            key={log}
                                            initial={{ opacity: 0, x: -10, y: 5 }}
                                            animate={{ opacity: 1, x: 0, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                            className="flex items-center gap-1.5 truncate"
                                        >
                                            <span className="text-emerald-500 font-bold select-none">•</span>
                                            <span className="opacity-90">{log}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingScreen;
