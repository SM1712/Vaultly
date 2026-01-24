
const PlanivioLogo = ({ className = "w-8 h-8", textClassName = "text-xl" }: { className?: string, textClassName?: string }) => {

    return (
        <div className="flex items-center gap-3">
            <div className={`relative ${className} flex items-center justify-center`}>
                {/* Geometric Logo: Abstract Hexagon/Cube structure */}
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary drop-shadow-md">
                    <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        fill="currentColor"
                        fillOpacity="0.8"
                    />
                    <path
                        d="M2 17L12 22L22 17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M2 7V17L12 22V12L2 7Z"
                        fill="currentColor"
                        fillOpacity="0.4"
                    />
                    <path
                        d="M22 7V17L12 22V12L22 7Z"
                        fill="currentColor"
                        fillOpacity="0.6"
                    />
                </svg>
            </div>
            <span className={`font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-white/70 ${textClassName}`}>
                Planivio
            </span>
        </div>
    );
};

export default PlanivioLogo;
