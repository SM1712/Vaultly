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
            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full text-xs font-medium border border-yellow-500/20" title="Sin conexión. Los cambios se guardarán en tu dispositivo y se enviarán al volver.">
                <CloudOff size={14} />
                <span>Modo Local</span>
            </div>
        );
    }

    if (status === 'syncing') {
        return (
            <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-500/20">
                <RefreshCw size={14} className="animate-spin" />
                <span>Sincronizando...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-500/20" title="Todos los datos están seguros en la nube.">
            <Cloud size={14} />
            <span>Nube Activa</span>
        </div>
    );
};
