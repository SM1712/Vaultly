import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SyncStatus = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Monitor Network Connectivity
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setStatus('syncing');
            setTimeout(() => setStatus('synced'), 2000); // Simulate check
        };
        const handleOffline = () => {
            setIsOnline(false);
            setStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor Firestore Metadata (if possible, or just imply from network)
    // Firestore doesn't expose a global "syncing" event easily for all collections without wrappers.
    // For now, network status is our best proxy for "Connected to Cloud".

    // We can also check if we are authenticated.
    if (!user) return null;

    if (!isOnline) {
        return (
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full text-xs font-medium border border-yellow-500/20 hover:bg-yellow-500/20 transition-all" title="Sin conexión. Click para recargar.">
                <CloudOff size={14} />
                <span>Modo Local</span>
            </button>
        );
    }

    if (status === 'syncing') {
        return (
            <button disabled className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-500/20 cursor-wait">
                <RefreshCw size={14} className="animate-spin" />
                <span>Sincronizando...</span>
            </button>
        );
    }

    return (
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-all" title="Nube Activa. Click para recargar.">
            <Cloud size={14} />
            <span>Nube Activa</span>
        </button>
    );
};
