import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SettingsMenu from '../components/settings/SettingsMenu';
import { useTheme } from '../context/ThemeContext';
import MobileQuickAdd from '../components/ui/MobileQuickAdd';
import { LogoCombined } from '../components/ui/Logo';
import { FinanceProvider } from '../context/FinanceContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ProjectsProvider } from '../context/ProjectsContext';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { Toaster } from 'sonner';
import { clsx } from 'clsx';
import LevelUpModal from '../components/gamification/LevelUpModal';
import { useGamification } from '../context/GamificationContext';

import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';

const AutoDepositManager = () => {
    const { checkAutoDeposits } = useFunds();
    const { currentBalance } = useBalance();

    useEffect(() => {
        if (typeof checkAutoDeposits === 'function') {
            checkAutoDeposits(currentBalance);
        }
    }, [checkAutoDeposits, currentBalance]);

    return null;
};

const GlobalLevelUpManager = () => {
    const { levelUpModal } = useGamification();
    return (
        <LevelUpModal
            isOpen={levelUpModal.isOpen}
            onClose={levelUpModal.close}
            level={levelUpModal.level}
            title={levelUpModal.title}
        />
    );
};

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const location = useLocation();
    const { isSidebarCollapsed, toggleSidebarCollapsed } = useTheme();

    // Projections needs full width without padding
    const isFullWidthPage = location.pathname === '/projections';

    // We need to access funds and balance here, but `useFunds` and `useBalance` 
    // must be used inside the providers. We will create a new component `AutoDepositManager`
    // inside the providers to handle this.

    return (
        <FinanceProvider>
            <SettingsProvider>
                <ProjectsProvider>
                    <AutoDepositManager />
                    <div className="flex flex-col lg:flex-row h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 animate-enter-app">
                        {/* Mobile Header - Push content down */}
                        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shrink-0 z-30">
                            <LogoCombined />
                            <div className="flex gap-2">
                                <button
                                    className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-zinc-900 rounded-lg"
                                    onClick={() => setIsMobileMenuOpen(true)}
                                >
                                    <Menu size={24} />
                                </button>
                            </div>
                        </header>

                        {/* Mobile Backdrop */}
                        {isMobileMenuOpen && (
                            <div
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        )}

                        {/* Sidebar */}
                        <div className={clsx(
                            "fixed inset-y-0 left-0 z-[60] transform transition-transform duration-200 ease-in-out",
                            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                            // If NOT collapsed (normal mode), force show on desktop
                            !isSidebarCollapsed && "lg:static lg:translate-x-0"
                        )}>
                            <Sidebar
                                isOpen={isMobileMenuOpen}
                                onClose={() => setIsMobileMenuOpen(false)}
                                onOpenSettings={() => setIsSettingsOpen(true)}
                            />
                        </div>

                        <main className={clsx(
                            "flex-1 overflow-auto w-full relative",
                            isFullWidthPage ? "p-0" : "p-4 lg:p-8 max-w-[1600px] mx-auto"
                        )}>
                            {/* Desktop: Show Trigger when sidebar is collapsed */}
                            {isSidebarCollapsed && (
                                <div className={clsx(
                                    "hidden lg:flex z-40",
                                    isFullWidthPage ? "absolute top-4 left-4" : "mb-4"
                                )}>
                                    <button
                                        onClick={toggleSidebarCollapsed}
                                        className="p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-all"
                                        title="Mostrar menú lateral"
                                    >
                                        <PanelLeftOpen size={20} />
                                    </button>
                                </div>
                            )}

                            <Outlet />
                        </main>

                        <MobileQuickAdd />
                        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                        <GlobalLevelUpManager />
                        {/* <OnboardingModal /> Legacy removed */}
                        <Toaster position="top-center" />
                    </div>
                </ProjectsProvider>
            </SettingsProvider>
        </FinanceProvider >
    );
};

export default Layout;
