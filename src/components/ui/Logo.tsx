
interface LogoProps {
    className?: string;
    size?: number;
    color?: string; // Optional override
}

const Logo = ({ className = "", size = 32, color }: LogoProps) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Minimalist "V" / Vault Shape 
                Concept: An abstract monoline form representing balance and structure.
                Not a bank, not a coin. Just stability.
             */}
            <path
                d="M16 2L4 8L16 28L28 8L16 2Z"
                className="fill-current opacity-20"
            />
            <path
                d="M16 8L8 12L16 24L24 12L16 8Z"
                fill={color || "currentColor"}
                className={color ? "" : "text-primary"}
            />
            <circle cx="16" cy="16" r="2" className="fill-white" />
        </svg>
    );
};

export const LogoCombined = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <Logo size={28} />
            <div className="flex flex-col">
                <span className="font-mono font-bold text-lg tracking-wider leading-none text-zinc-900 dark:text-zinc-100">
                    VAULTLY
                </span>
                <span className="text-[9px] font-medium tracking-widest text-zinc-400 uppercase">
                    Finance
                </span>
            </div>
        </div>
    )
}

export default Logo;
