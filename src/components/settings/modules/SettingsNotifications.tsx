import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Mail, Trash2, Eye, Info, Clock, Check, Sparkles, ShieldAlert, Target, Users, Calendar, Activity } from 'lucide-react';
import { useLocalNotifications } from '../../../hooks/useLocalNotifications';
import { useSettings } from '../../../context/SettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { EmailService, EMAIL_SENT_EVENT } from '../../../services/EmailService';
import type { SimulatedEmail } from '../../../types';
import { toast } from 'sonner';
import Modal from '../../ui/Modal';

export const SettingsNotifications = () => {
    // 1. Local Device Notifications Hooks
    const {
        isEnabled: notificationsEnabled,
        isSoundEnabled,
        toggleNotifications,
        toggleSound,
        requestPermission,
        permission,
        sendTestNotification
    } = useLocalNotifications();

    // 2. Email Notifications Hooks
    const { user } = useAuth();
    const { data } = useData();
    const { currency, spendingLimits, emailNotifications, updateEmailNotifications } = useSettings();
    const [sendingTest, setSendingTest] = useState(false);
    const [sendingWeeklyTest, setSendingWeeklyTest] = useState(false);

    // 3. Email Outbox Simulator States
    const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Fetch simulated outbox log
    const loadOutbox = useCallback(() => {
        setSimulatedEmails(EmailService.getSimulatedEmails());
    }, []);

    // Set up real-time listener for generated emails
    useEffect(() => {
        loadOutbox();
        const handleEmailSent = () => {
            loadOutbox();
        };
        window.addEventListener(EMAIL_SENT_EVENT, handleEmailSent);
        return () => {
            window.removeEventListener(EMAIL_SENT_EVENT, handleEmailSent);
        };
    }, [loadOutbox]);

    // Send Test Email
    const handleSendTestEmail = async () => {
        if (!user?.email) {
            toast.error("Correo no Encontrado", {
                description: "No se encontró dirección de correo asociada a la cuenta."
            });
            return;
        }
        setSendingTest(true);
        try {
            const success = await EmailService.sendTestEmail(
                user.email,
                user.displayName || 'Usuario',
                emailNotifications
            );
            if (success) {
                toast.success("Correo de Prueba Inyectado", {
                    description: "El correo de prueba ha sido generado e inyectado correctamente en el simulador."
                });
            } else {
                toast.error("Envío Fallido", {
                    description: "No se pudo inyectar. Verifica que las notificaciones de correo estén activas."
                });
            }
        } catch (e) {
            console.error(e);
            toast.error("Error del Simulador", {
                description: "Ocurrió un error inesperado al generar el correo de prueba."
            });
        } finally {
            setSendingTest(false);
        }
    };

    // Send Weekly Budget Control Email
    const handleSendWeeklyBudgetReport = async () => {
        if (!user?.email) {
            toast.error("Correo no Encontrado", {
                description: "No se encontró dirección de correo asociada a la cuenta."
            });
            return;
        }
        setSendingWeeklyTest(true);
        try {
            // Get category spending map
            const now = new Date();
            const currentMonthStr = now.toISOString().slice(0, 7);
            const categorySpentMap = (data.transactions || [])
                .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
                .reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                }, {} as Record<string, number>);

            const totalSpentThisMonth = Object.values(categorySpentMap).reduce((sum, val) => sum + val, 0);

            // Compile categories with limits
            let catsData = Object.entries(spendingLimits.categories).map(([name, limit]) => {
                const spent = categorySpentMap[name] || 0;
                const percent = limit > 0 ? (spent / limit) * 100 : 0;
                return { name, spent, limit, percent };
            });

            // If empty, generate some mockup data so they can see it
            if (catsData.length === 0) {
                catsData = [
                    { name: 'Comida', spent: 180, limit: 300, percent: 60 },
                    { name: 'Transporte', spent: 85, limit: 100, percent: 85 },
                    { name: 'Entretenimiento', spent: 150, limit: 120, percent: 125 }
                ];
            }

            const globalLimit = {
                enabled: spendingLimits.global.enabled || true,
                amount: spendingLimits.global.enabled ? spendingLimits.global.amount : 500,
                spent: spendingLimits.global.enabled ? totalSpentThisMonth : 415,
                percent: spendingLimits.global.enabled 
                    ? (spendingLimits.global.amount > 0 ? (totalSpentThisMonth / spendingLimits.global.amount) * 100 : 0)
                    : 83
            };

            const success = await EmailService.sendWeeklyBudgetControlEmail(
                user.email,
                user.displayName || 'Usuario',
                currency,
                catsData,
                globalLimit,
                emailNotifications
            );

            if (success) {
                toast.success("Control Semanal Inyectado", {
                    description: "El reporte de control semanal de gastos se inyectó con éxito en la bandeja simulada."
                });
            } else {
                toast.error("Envío Fallido", {
                    description: "No se pudo inyectar. Asegúrate de que las notificaciones de correo estén habilitadas."
                });
            }
        } catch (e) {
            console.error(e);
            toast.error("Error del Simulador", {
                description: "Ocurrió un error al compilar o enviar el reporte de control semanal."
            });
        } finally {
            setSendingWeeklyTest(false);
        }
    };

    const handleClearOutbox = () => {
        if (window.confirm("¿Deseas vaciar el historial de la bandeja de salida simulada?")) {
            EmailService.clearHistory();
            toast.success("Historial Vaciado", {
                description: "Se han eliminado permanentemente todos los registros del simulador."
            });
        }
    };

    const getEmailTypeLabel = (type: SimulatedEmail['type']) => {
        switch (type) {
            case 'test': return 'Prueba de Conexión';
            case 'goal_milestone': return 'Hito de Ahorro';
            case 'budget_warning': return 'Alerta de Gasto';
            case 'project_invitation': return 'Invitación Compartida';
            case 'weekly_summary': return 'Resumen Salud';
            case 'weekly_budget_control': return 'Control Semanal';
            default: return 'Alerta General';
        }
    };

    const getEmailTypeColor = (type: SimulatedEmail['type']) => {
        switch (type) {
            case 'test': return 'bg-zinc-55 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
            case 'goal_milestone': return 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20';
            case 'budget_warning': return 'bg-rose-500/10 text-rose-650 dark:text-rose-400 border-rose-500/20';
            case 'project_invitation': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
            case 'weekly_summary': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'weekly_budget_control': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        }
    };

    const activeTheme = emailNotifications.theme || 'oscuro';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Local Device Notifications Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Bell size={16} /> Pulsos locales (Alertas en Navegador)
                </h3>
                
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                            <Info size={18} />
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Latidos del Navegador</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">
                                Los pulsos locales se disparan de forma nativa en la barra de notificaciones del sistema. Otorga los permisos necesarios en tu navegador para alertas críticas en tiempo real.
                            </p>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                        <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-xs">Pulsos de Navegador</span>
                            <span className="text-[10px] text-zinc-500">Recibe recordatorios de metas y límites locales.</span>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer select-none">
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
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {notificationsEnabled && (
                        <button
                            onClick={sendTestNotification}
                            className="w-full py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-350 text-[11px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-primary transition-all shadow-sm active:scale-[0.98]"
                        >
                            Disparar Pulso de Prueba en Navegador
                        </button>
                    )}
                </div>

                {permission === 'denied' && (
                    <p className="text-[10px] text-rose-500 text-center font-bold bg-rose-50 dark:bg-rose-900/10 p-2.5 rounded-xl border border-rose-500/10">
                        ⚠️ Alertas bloqueadas. Debes habilitar los permisos en el candado de la URL de tu navegador.
                    </p>
                )}
            </div>

            {/* Email Notifications Section */}
            <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-900">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Mail size={16} /> Pulsos de Correo Electrónico
                </h3>

                {/* Master Switch Card */}
                <div className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="pr-4">
                        <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-sm">Habilitar Pulsos por Correo</span>
                        <span className="text-xs text-zinc-500 mt-0.5 block leading-normal">
                            Enviar reportes y alertas a tu dirección registrada: <strong className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">{user?.email || 'tu correo'}</strong>
                        </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={emailNotifications.enabled}
                            onChange={(e) => updateEmailNotifications({ enabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Preferences Grid */}
                {emailNotifications.enabled && (
                    <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                        
                        {/* Channel preferences container */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-6">
                            
                            {/* Category 1: Real-time Alerts */}
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                                    Alertas Inmediatas (Pulsos en Tiempo Real)
                                </h4>
                                
                                <div className="space-y-4">
                                    {/* Budget Exceeded alert */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                                                <ShieldAlert size={15} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-xs">Presupuestos Excedidos</span>
                                                <span className="text-[10px] text-zinc-500">Notificar inmediatamente si un gasto supera el límite mensual de su categoría.</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={emailNotifications.onBudgetExceeded}
                                                onChange={(e) => updateEmailNotifications({ onBudgetExceeded: e.target.checked })}
                                            />
                                            <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-650 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    {/* Goals alert */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                                                <Target size={15} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-xs">Hitos de Ahorro</span>
                                                <span className="text-[10px] text-zinc-500">Notificar de inmediato cuando alcances marcas de progreso en tus metas (50% y 100%).</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={emailNotifications.onGoalReached}
                                                onChange={(e) => updateEmailNotifications({ onGoalReached: e.target.checked })}
                                            />
                                            <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-650 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    {/* Project Invites alert */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                                                <Users size={15} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-xs">Invitaciones Colaborativas</span>
                                                <span className="text-[10px] text-zinc-500">Alertar inmediatamente si un colega te invita a unirte a un proyecto compartido.</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={emailNotifications.onProjectInvitation}
                                                onChange={(e) => updateEmailNotifications({ onProjectInvitation: e.target.checked })}
                                            />
                                            <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-650 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Category 2: Periodic Reports */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                                    Informes y Resúmenes Programados (Boletines)
                                </h4>
                                
                                <div className="space-y-4">
                                    {/* Weekly budget control report */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                                                <Calendar size={15} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-xs">Control Semanal de Gastos</span>
                                                <span className="text-[10px] text-zinc-500">Reporte enviado los domingos con la progresión de consumo de tus límites por categoría.</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={emailNotifications.onWeeklyBudgetControl !== false}
                                                onChange={(e) => updateEmailNotifications({ onWeeklyBudgetControl: e.target.checked })}
                                            />
                                            <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-650 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    {/* Weekly health report */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                                                <Activity size={15} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-zinc-800 dark:text-zinc-200 text-xs">Resumen de Salud Financiera</span>
                                                <span className="text-[10px] text-zinc-500">Un reporte consolidado con tu puntaje de salud, balances globales y análisis de tendencias.</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={emailNotifications.onWeeklySummary}
                                                onChange={(e) => updateEmailNotifications({ onWeeklySummary: e.target.checked })}
                                            />
                                            <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-650 peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Email template themes selector */}
                        <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl space-y-4">
                            <div>
                                <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-500" /> Plantilla de Correo (Diseño de Tema)
                                </span>
                                <span className="text-[10px] text-zinc-500 block mt-0.5">Escoge el estilo visual con el que se enviarán las alertas e informes de Vaultly.</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Light Theme Card */}
                                <button
                                    type="button"
                                    onClick={() => updateEmailNotifications({ theme: 'claro' })}
                                    className={`group text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                                        activeTheme === 'claro'
                                            ? 'bg-white border-primary shadow-md dark:bg-zinc-900'
                                            : 'bg-zinc-100/40 border-zinc-200 dark:bg-zinc-950/20 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Plan Claro</span>
                                        {activeTheme === 'claro' && (
                                            <span className="p-0.5 rounded-full bg-primary text-white text-[8px] flex items-center justify-center">
                                                <Check size={10} strokeWidth={3} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2 bg-zinc-200/40 dark:bg-zinc-800/60 p-2 rounded-lg w-full">
                                        <div className="w-3.5 h-3.5 rounded bg-[#f4f4f5] border border-zinc-300 shrink-0"></div>
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                            <div className="h-1 bg-zinc-500 rounded w-10"></div>
                                            <div className="h-1 bg-zinc-455 rounded w-14"></div>
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0"></div>
                                    </div>
                                </button>

                                {/* Dark Theme Card */}
                                <button
                                    type="button"
                                    onClick={() => updateEmailNotifications({ theme: 'oscuro' })}
                                    className={`group text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                                        activeTheme === 'oscuro'
                                            ? 'bg-white border-primary shadow-md dark:bg-zinc-900'
                                            : 'bg-zinc-100/40 border-zinc-200 dark:bg-zinc-950/20 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Plan Oscuro</span>
                                        {activeTheme === 'oscuro' && (
                                            <span className="p-0.5 rounded-full bg-primary text-white text-[8px] flex items-center justify-center">
                                                <Check size={10} strokeWidth={3} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2 bg-zinc-900/60 dark:bg-zinc-950/60 p-2 rounded-lg w-full">
                                        <div className="w-3.5 h-3.5 rounded bg-[#09090b] border border-zinc-855 shrink-0"></div>
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                            <div className="h-1 bg-zinc-650 rounded w-8"></div>
                                            <div className="h-1 bg-zinc-750 rounded w-12"></div>
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0"></div>
                                    </div>
                                </button>

                                {/* Indigo Theme Card */}
                                <button
                                    type="button"
                                    onClick={() => updateEmailNotifications({ theme: 'indigo' })}
                                    className={`group text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                                        activeTheme === 'indigo'
                                            ? 'bg-white border-primary shadow-md dark:bg-zinc-900'
                                            : 'bg-zinc-100/40 border-zinc-200 dark:bg-zinc-950/20 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Plan Indigo</span>
                                        {activeTheme === 'indigo' && (
                                            <span className="p-0.5 rounded-full bg-primary text-white text-[8px] flex items-center justify-center">
                                                <Check size={10} strokeWidth={3} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2 bg-indigo-950/30 p-2 rounded-lg w-full">
                                        <div className="w-3.5 h-3.5 rounded bg-[#0a0b10] border border-indigo-950 shrink-0"></div>
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                            <div className="h-1 bg-indigo-300 rounded w-11"></div>
                                            <div className="h-1 bg-indigo-500/50 rounded w-7"></div>
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded bg-indigo-500 shrink-0"></div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Test buttons triggers (Sandbox) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <button
                                onClick={handleSendTestEmail}
                                disabled={sendingTest}
                                className="w-full py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-primary transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                            >
                                <Mail size={14} />
                                {sendingTest ? 'Generando...' : 'Emitir Pulso de Prueba básico'}
                            </button>
                            <button
                                onClick={handleSendWeeklyBudgetReport}
                                disabled={sendingWeeklyTest || emailNotifications.onWeeklyBudgetControl === false}
                                className="w-full py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-primary transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                            >
                                <Clock size={14} />
                                {sendingWeeklyTest ? 'Generando...' : 'Emitir Control Semanal (Demo)'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Email Outbox Simulator Section */}
            <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} className="text-zinc-500" /> Historial de Pulsos (Sandbox)
                        </h3>
                        <span className="text-[10px] text-zinc-500 block">Monitorea y previsualiza los correos disparados en esta sesión.</span>
                    </div>
                    {simulatedEmails.length > 0 && (
                        <button
                            onClick={handleClearOutbox}
                            className="text-[10px] text-zinc-500 hover:text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                        >
                            <Trash2 size={12} /> Limpiar
                        </button>
                    )}
                </div>

                {/* List of Simulated Emails */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {simulatedEmails.length === 0 ? (
                        <div className="text-center py-8 bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <Mail size={24} className="mx-auto mb-2 text-zinc-650 opacity-40 animate-pulse" />
                            <p className="text-xs text-zinc-500 italic">No hay pulsos registrados aún en esta sesión.</p>
                            <p className="text-[10px] text-zinc-650 mt-1 max-w-[280px] mx-auto">Prueba disparando un pulso de prueba o de control semanal arriba.</p>
                        </div>
                    ) : (
                        simulatedEmails.map((email) => (
                            <div
                                key={email.id}
                                className="flex justify-between items-center p-3.5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-850 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors"
                            >
                                <div className="min-w-0 flex-1 pr-3">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${getEmailTypeColor(email.type)}`}>
                                            {getEmailTypeLabel(email.type)}
                                        </span>
                                        <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
                                            email.status === 'sent' 
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
                                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                                        }`}>
                                            {email.status === 'sent' ? 'Emitido (Firestore)' : 'Encolado'}
                                        </span>
                                        <span className="text-[9px] text-zinc-500">
                                            {new Date(email.sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">{email.subject}</h4>
                                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Destinatario: <span className="font-mono text-[9px]">{email.to}</span></p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedEmail(email);
                                        setIsPreviewOpen(true);
                                    }}
                                    className="p-2 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary hover:border-primary/30 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1 text-[10px] font-bold"
                                >
                                    <Eye size={14} /> Ver
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Email Preview Modal */}
            {isPreviewOpen && selectedEmail && createPortal(
                <Modal
                    isOpen={isPreviewOpen && !!selectedEmail}
                    onClose={() => {
                        setIsPreviewOpen(false);
                        setSelectedEmail(null);
                    }}
                    title={selectedEmail ? getEmailTypeLabel(selectedEmail.type) : 'Previsualización del Pulso'}
                    maxWidth="max-w-xl"
                    className="h-[80vh] flex flex-col overflow-hidden"
                    noPadding={true}
                    headerActions={selectedEmail && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {selectedEmail.to}
                        </span>
                    )}
                >
                    <div className="flex-1 flex flex-col h-full bg-zinc-950/20 relative overflow-hidden">
                        {/* Simulation Bar */}
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] text-zinc-500">Renderizando plantilla HTML premium</span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Sandbox Preview</span>
                        </div>
                        {/* Sandboxed Iframe */}
                        <div className="flex-1 w-full bg-zinc-950 p-4 overflow-y-auto">
                            <iframe
                                title="Email HTML Preview"
                                srcDoc={selectedEmail.bodyHtml}
                                className="w-full h-full min-h-[500px] border-0 rounded-xl bg-[#09090b]"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        </div>
                    </div>
                </Modal>,
                document.body
            )}
        </div>
    );
};
