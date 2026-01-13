import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

interface NotificationContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
    settings: {
        enabled: boolean;
        soundEnabled: boolean;
    };
    updateSettings: (newSettings: Partial<{ enabled: boolean; soundEnabled: boolean }>) => void;
    notify: (title: string, options?: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'vaultly_notification_settings';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [settings, setSettings] = useState({
        enabled: false,
        soundEnabled: true,
    });

    useEffect(() => {
        if (!('Notification' in window)) return;
        setPermission(Notification.permission);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) { console.error("Error parsing notification settings", e); }
        }
    }, []);

    const saveSettings = (newSettings: typeof settings) => {
        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    };

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error("Tu navegador no soporta notificaciones.");
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            toast.success("Permiso concedido. ¡Ahora recibirás alertas!");
            saveSettings({ ...settings, enabled: true });
        } else {
            toast.error("Permiso denegado. No podremos avisarte.");
            saveSettings({ ...settings, enabled: false });
        }
    };

    const updateSettings = (partial: Partial<typeof settings>) => {
        const next = { ...settings, ...partial };
        saveSettings(next);

        // If enabling, check permission
        if (next.enabled && permission !== 'granted') {
            requestPermission();
        }
    };

    const notify = (title: string, options?: NotificationOptions) => {
        if (!settings.enabled || permission !== 'granted') {
            // Fallback to Sonner toast if notifications are disabled but in-app we want to show it
            // Or maybe just return? Let's log for debug.
            console.log("Notification skipped (disabled/no-permission):", title);
            return;
        }

        try {
            // Optional: Play sound
            if (settings.soundEnabled) {
                // Using a reliable CDN sound for notification pop
                const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.error("Audio play failed (Autoplay policy?):", e));
            }

            // PWA Service Worker notification (best for mobile)
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        icon: '/pwa-192x192.png',
                        badge: '/favicon.svg',
                        vibrate: [200, 100, 200],
                        ...options
                    } as any);
                });
            } else {
                // Desktop regular notification
                new Notification(title, {
                    icon: '/pwa-192x192.png',
                    ...options
                });
            }
        } catch (error) {
            console.error("Notification dispatch error:", error);
        }
    };

    return (
        <NotificationContext.Provider value={{ permission, requestPermission, settings, updateSettings, notify }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
