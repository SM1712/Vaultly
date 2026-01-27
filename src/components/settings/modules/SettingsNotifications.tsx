import { Bell } from 'lucide-react';
import { useLocalNotifications } from '../../../hooks/useLocalNotifications';

export const SettingsNotifications = () => {
    const {
        isEnabled: notificationsEnabled,
        isSoundEnabled,
        toggleNotifications,
        toggleSound,
        requestPermission,
        permission,
        sendTestNotification
    } = useLocalNotifications();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h4 className="text-blue-800 dark:text-blue-400 font-bold mb-2 flex items-center gap-2">
                    <Bell size={18} /> Sistema de Alertas
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-500/80 mb-0 leading-relaxed">
                    Las notificaciones funcionan directamente en tu dispositivo. Asegúrate de conceder permisos si el navegador lo solicita.
                </p>
            </div>

            <div className="space-y-4">
                {/* Master Toggle */}
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <span className="block font-bold text-zinc-900 dark:text-zinc-100">Activar Notificaciones</span>
                        <span className="text-sm text-zinc-500">Recibe alertas sobre logros y recordatorios.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationsEnabled}
                            onChange={(e) => {
                                if (e.target.checked && permission !== 'granted') {
                                    requestPermission();
                                } else {
                                    toggleNotifications(e.target.checked);
                                }
                            }}
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Sound Toggle */}
                <div className={`flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-opacity ${!notificationsEnabled ? 'opacity-50 pointer-events-none' : ''} `}>
                    <div>
                        <span className="block font-bold text-zinc-900 dark:text-zinc-100">Sonidos</span>
                        <span className="text-sm text-zinc-500">Reproducir efectos al desbloquear logros.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isSoundEnabled}
                            onChange={(e) => toggleSound(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Test Button */}
                <button
                    onClick={sendTestNotification}
                    disabled={!notificationsEnabled}
                    className="w-full py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-primary transition-all disabled:opacity-50"
                >
                    Probar Notificación
                </button>

                {permission === 'denied' && (
                    <p className="text-xs text-rose-500 text-center font-bold bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">
                        ⚠️ Has bloqueado las notificaciones en tu navegador. Debes habilitarlas manualmente en la configuración del sitio.
                    </p>
                )}
            </div>
        </div>
    );
};
