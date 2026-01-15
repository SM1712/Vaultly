// Trigger deployment update (Correct API Key)
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SettingsMenu from '../components/settings/SettingsMenu';
import MobileQuickAdd from '../components/ui/MobileQuickAdd';
import { LogoCombined } from '../components/ui/Logo';
import { FinanceProvider } from '../context/FinanceContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ProjectsProvider } from '../context/ProjectsContext';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { Menu } from 'lucide-react';
import { Toaster } from 'sonner';
import OnboardingModal from '../components/onboarding/OnboardingModal';
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
    const { processScheduledTransactions } = useScheduledTransactions();
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
                            <button
                                className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-zinc-900 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                        </header>

                        {/* Mobile Backdrop */}
                        {isMobileMenuOpen && (
                            <div
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        )}

                        {/* Sidebar */}
                        <div className={`fixed lg:static inset-y-0 left-0 z-[60] transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
                            <Sidebar
                                isOpen={isMobileMenuOpen}
                                onClose={() => setIsMobileMenuOpen(false)}
                                onOpenSettings={() => setIsSettingsOpen(true)}
                            />
                        </div>

                        <main className="flex-1 overflow-auto p-4 lg:p-8 w-full max-w-[1600px] mx-auto relative">

                            <Outlet />
                        </main>

                        <MobileQuickAdd />
                        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                        <GlobalLevelUpManager />
                        <OnboardingModal />
                        <Toaster position="top-center" />
                    </div>
                </ProjectsProvider>
            </SettingsProvider>
        </FinanceProvider >
    );
};

export default Layout;
