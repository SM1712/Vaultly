import { useNotifications } from '../context/NotificationContext';
import { toast } from 'sonner';
import { useCallback } from 'react';

// Simplified hook for components to use
export const useLocalNotifications = () => {
    const { notify, requestPermission, permission, settings, updateSettings } = useNotifications();

    const sendTestNotification = useCallback(() => {
        notify("🔔 Prueba de Sistema", {
            body: "Si lees esto, las notificaciones locales funcionan correctamente.",
            tag: 'test',
        });

        // Always show toast for immediate feedback
        toast("Notificación de prueba enviada");
    }, [notify]);

    const notifyAchievement = useCallback((title: string, xp: number) => {
        notify("🏆 ¡Logro Desbloqueado!", {
            body: `${title} - Has ganado +${xp} XP`,
            tag: 'achievement',
            data: { url: '/profile' }
        });
    }, [notify]);

    const notifyLevelUp = useCallback((newLevel: number, newTitle: string) => {
        notify("🌟 ¡Nivel Arriba!", {
            body: `Ahora eres Nivel ${newLevel}: ${newTitle}`,
            tag: 'levelup',
            requireInteraction: true,
        });
    }, [notify]);

    return {
        permission,
        isEnabled: settings.enabled,
        isSoundEnabled: settings.soundEnabled,
        toggleNotifications: useCallback((enabled: boolean) => updateSettings({ enabled }), [updateSettings]),
        toggleSound: useCallback((soundEnabled: boolean) => updateSettings({ soundEnabled }), [updateSettings]),
        requestPermission,
        sendTestNotification,
        notifyAchievement,
        notifyLevelUp
    };
};
