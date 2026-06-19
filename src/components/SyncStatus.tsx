import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const SyncStatus = () => {
    const { user } = useAuth();
    const { isSaving, isOfflineMode } = useData();

    if (!user) return null;

    if (isOfflineMode) {
        return (
            <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-500/20 hover:bg-amber-500/20 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.05)] animate-pulse"
                title="Modo local (sin conexión o cambios pendientes de guardar). Haz clic para recargar."
            >
                <CloudOff size={14} className="animate-[bounce_2s_infinite]" />
                <span>Modo Local</span>
            </button>
        );
    }

    if (isSaving) {
        return (
            <button
                disabled
                className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-500/20 cursor-wait shadow-[0_0_10px_rgba(99,102,241,0.05)]"
            >
                <RefreshCw size={14} className="animate-spin" />
                <span>Guardando...</span>
            </button>
        );
    }

    // Fully synced premium feedback
    return (
        <div
            className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)] transition-all duration-300"
            title="Tus datos están a salvo en la nube."
        >
            <Cloud size={14} className="animate-[pulse_3s_infinite]" />
            <span>Sincronizado</span>
        </div>
    );
};
