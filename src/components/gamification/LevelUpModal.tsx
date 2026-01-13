import { Crown, Star } from 'lucide-react';

export const LevelUpModal = () => {
    // This component would ideally be mounted at the top level and listen to a dedicated state
    // But for this MVP we might need to expose the "ShowLevelUp" state better.
    // Re-thinking: Notification handling is "passive", but Level Up needs "Active" Modal.
    // I missed adding a specific "isLevelUpModalOpen" to the GamificationContext. 
    // For now, I'll assume I will use this inside the Layout or App via a new Context state or 
    // simply render it if a local state matches. 
    // 
    // CORRECT APPROACH: 
    // I need to add `levelUpState` to GamificationContext to trigger this. 
    // Since I cannot edit Context right now without breaking flow, 
    // I will build this component to accept props, and then I might Refactor Context if needed.
    // 
    // WAIT: I already have 'notifyLevelUp' which sends a Notification. 
    // To make it a proper Modal, I should probably add specific state to the Provider.

    // Let's build it as a standalone functional component required to be controlled from outside 
    // or context. I will Update Context in next step to support this.
    return null;
};

// ... Wait, let's implement the internal logic of the modal and assume I'll wire it up.
interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    title: string;
}

const LevelUpModalContent = ({ isOpen, onClose, level, title }: LevelUpModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative w-full max-w-sm">
                {/* Glow Effect behind */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/30 rounded-full blur-[80px] animate-pulse" />

                <div className="relative bg-zinc-900/90 border border-amber-500/30 p-8 rounded-[2rem] shadow-2xl text-center overflow-hidden backdrop-blur-xl transform transition-all animate-in zoom-in-95 duration-300">

                    {/* Decorative Rays */}
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_rgba(245,158,11,0.1)_0deg,_transparent_60deg,_transparent_300deg,_rgba(245,158,11,0.1)_360deg)] animate-[spin_8s_linear_infinite]" />

                    <div className="relative z-10 flex flex-col items-center">

                        {/* Level Badge */}
                        <div className="relative mb-6 group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-300 to-orange-600 rounded-2xl rotate-6 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-950 w-28 h-28 rounded-2xl flex items-center justify-center border-2 border-amber-500/50 shadow-xl group-hover:scale-105 transition-transform duration-300">
                                <Crown size={48} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />

                                <div className="absolute -top-3 -right-3 bg-gradient-to-br from-amber-400 to-orange-600 text-white font-black text-xl w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-900">
                                    {level}
                                </div>
                            </div>
                        </div>

                        {/* Text */}
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 mb-2 tracking-tight drop-shadow-sm animate-pulse">
                            ¡NIVEL SUBIDO!
                        </h2>

                        <div className="flex items-center gap-2 mb-8">
                            <span className="h-px w-8 bg-zinc-700" />
                            <p className="text-zinc-400 font-medium uppercase tracking-widest text-xs">Nuevo Rango</p>
                            <span className="h-px w-8 bg-zinc-700" />
                        </div>

                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-6 mb-8 w-full">
                            <p className="text-2xl font-bold text-white tracking-wide">
                                {title}
                            </p>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-lg rounded-2xl shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] transform active:scale-[0.98] transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 group"
                        >
                            <Star size={20} className="fill-white animate-[spin_3s_linear_infinite]" />
                            <span>Continuar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Simple CSS Particles */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default LevelUpModalContent;
