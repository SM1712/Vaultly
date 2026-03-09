import { Loader2 } from 'lucide-react';

const RouteLoader = () => {
    return (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-primary/80 dark:bg-primary w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
            <style>{`
                @keyframes slide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default RouteLoader;
