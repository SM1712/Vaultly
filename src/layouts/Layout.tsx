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

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { processScheduledTransactions } = useScheduledTransactions();

    useEffect(() => {
        // Run checks on mount
        processScheduledTransactions();
    }, [processScheduledTransactions]);


    return (
        <FinanceProvider>
            <SettingsProvider>
                <ProjectsProvider>
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
                            <div className="fixed bottom-2 right-2 text-[10px] text-zinc-500 font-mono opacity-50 pointer-events-none">
                                v1.6 - Smart Goals
                            </div>
                            <Outlet />
                        </main>

                        <MobileQuickAdd />
                        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                        <OnboardingModal />
                        <Toaster position="top-center" />
                    </div>
                </ProjectsProvider>
            </SettingsProvider>
        </FinanceProvider >
    );
};

export default Layout;
