import { useState } from 'react';
import { clsx } from 'clsx';
import Modal from '../ui/Modal';
import { SettingsSidebar } from './SettingsSidebar';
import { LayoutGrid, Bell, Palette, List, CalendarClock, Zap, Database, BookOpen, Sparkles, User, ShieldAlert, Eye, Coins } from 'lucide-react';

// Modules
import { SettingsProfile } from './modules/SettingsProfile';
import { SettingsPreferences } from './modules/SettingsPreferences';
import { SettingsNotifications } from './modules/SettingsNotifications';
import { SettingsAppearance } from './modules/SettingsAppearance';
import { SettingsCategories } from './modules/SettingsCategories';
import { SettingsScheduled } from './modules/SettingsScheduled';
import { SettingsPresets } from './modules/SettingsPresets';
import { SettingsData } from './modules/SettingsData';
import { SettingsAbout, SettingsHelp } from './modules/SettingsAbout';
import { SettingsLimits } from './modules/SettingsLimits';
import { SettingsAccessibility } from './modules/SettingsAccessibility';

interface SettingsLayoutProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsLayout = ({ isOpen, onClose }: SettingsLayoutProps) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

    // Group Definitions
    const menuGroups = [
        {
            title: 'Perfil & Comunidad',
            items: [
                { id: 'profile', label: 'Mi Perfil & Nivel', icon: User },
            ]
        },
        {
            title: 'Control Financiero',
            items: [
                { id: 'limits', label: 'Límites de Gastos', icon: ShieldAlert },
                { id: 'categories', label: 'Categorías', icon: List },
                { id: 'scheduled', label: 'Programados', icon: CalendarClock },
                { id: 'presets', label: 'Atajos Rápidos', icon: Zap },
            ]
        },
        {
            title: 'Preferencias & Interfaz',
            items: [
                { id: 'preferences', label: 'Ajustes Generales', icon: LayoutGrid },
                { id: 'notifications', label: 'Pulsos (Alertas)', icon: Bell },
                { id: 'accessibility', label: 'Accesibilidad', icon: Eye },
                { id: 'appearance', label: 'Diseño & Temas', icon: Palette },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { id: 'data', label: 'Zona de Datos & Peligro', icon: Database },
                { id: 'help', label: 'Ayuda & Tutoriales', icon: BookOpen },
                { id: 'changelog', label: 'Historial de Versiones', icon: Sparkles },
            ]
        }
    ];

    const getActiveLabel = () => {
        for (const group of menuGroups) {
            const item = group.items.find(i => i.id === activeTab);
            if (item) return item.label;
        }
        return 'Configuración';
    };

    const handleTabSelect = (id: string) => {
        setActiveTab(id);
        setIsMobileDetailOpen(true);
    };

    const handleClose = () => {
        setIsMobileDetailOpen(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={isMobileDetailOpen ? getActiveLabel() : 'Configuración'} maxWidth="max-w-5xl" className="h-[100dvh] md:h-[700px] w-full" noPadding={true}>
            <div className="flex h-full w-full overflow-hidden relative">

                {/* Sidebar - Hidden on mobile if detail is open */}
                <div className={clsx(
                    "h-full flex-shrink-0 transition-transform duration-300 absolute md:static z-10 bg-white dark:bg-zinc-950 w-full md:w-auto",
                    isMobileDetailOpen ? "-translate-x-full md:translate-x-0" : "translate-x-0"
                )}>
                    <SettingsSidebar
                        menuGroups={menuGroups}
                        activeTab={activeTab}
                        onSelectTab={handleTabSelect}
                    />
                </div>

                {/* Content Area */}
                <div className={clsx(
                    "flex-1 bg-white dark:bg-zinc-950 w-full h-full absolute md:static transition-transform duration-300 overflow-y-auto",
                    isMobileDetailOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
                )}>
                    {/* Mobile Header with Back Button */}
                    <div className="md:hidden sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileDetailOpen(false)}
                            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {getActiveLabel()}
                        </h2>
                    </div>

                    <div className={clsx("p-4 md:p-8 md:max-w-3xl mx-auto pb-20 md:pb-8", activeTab === 'help' && "h-full")}>
                        {activeTab === 'profile' && <SettingsProfile onClose={handleClose} />}
                        {activeTab === 'limits' && <SettingsLimits />}
                        {activeTab === 'categories' && <SettingsCategories />}
                        {activeTab === 'scheduled' && <SettingsScheduled />}
                        {activeTab === 'presets' && <SettingsPresets />}

                        {activeTab === 'preferences' && <SettingsPreferences />}
                        {activeTab === 'notifications' && <SettingsNotifications />}
                        {activeTab === 'accessibility' && <SettingsAccessibility />}
                        {activeTab === 'appearance' && <SettingsAppearance />}

                        {activeTab === 'data' && <SettingsData />}
                        {activeTab === 'help' && <SettingsHelp onClose={handleClose} />}
                        {activeTab === 'changelog' && <SettingsAbout />} {/* Reusing About for Changelog */}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
