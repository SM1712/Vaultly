import Logo from './Logo';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen = ({ message = 'Iniciando...' }: LoadingScreenProps) => {
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        // Stagger text appearance
        const timer = setTimeout(() => setShowText(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center">
                {/* Animated Logo Container */}
                <div className="animate-in fade-in zoom-in duration-700 ease-out fill-mode-both">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <Logo className="w-20 h-20 md:w-24 md:h-24 pb-4" />
                    </div>
                </div>

                {/* Animated Brand Name */}
                <div className={`mt-6 flex flex-col items-center transition-all duration-700 transform ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h1 className="text-3xl md:text-4xl font-black tracking-[0.2em] text-zinc-900 dark:text-zinc-100 font-mono">
                        VAULTLY
                    </h1>
                    <div className="h-1 w-12 bg-primary mt-4 rounded-full animate-pulse" />
                </div>

                {/* Status Message */}
                <div className="absolute bottom-12 text-zinc-400 font-mono text-xs tracking-widest uppercase animate-pulse">
                    {message}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
