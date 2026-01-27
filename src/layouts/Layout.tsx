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
    const { isSidebarCollapsed, toggleSidebarCollapsed, sidebarPosition, sidebarVisibility } = useTheme();

    // Projections needs full width without padding
    const isFullWidthPage = location.pathname === '/projections';

    // Desktop Layout Logic
    const isVertical = sidebarPosition === 'left' || sidebarPosition === 'right';
    const isFloating = sidebarVisibility === 'floating';
    const isAuto = sidebarVisibility === 'auto';
    const isOverlayMode = isFloating || isAuto;

    // Determine the main flex container direction
    const layoutClasses = clsx(
        "flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 animate-enter-app",
        !isOverlayMode && sidebarPosition === 'left' && "flex-col lg:flex-row",
        !isOverlayMode && sidebarPosition === 'right' && "flex-col lg:flex-row-reverse",
        !isOverlayMode && sidebarPosition === 'top' && "flex-col",
        !isOverlayMode && sidebarPosition === 'bottom' && "flex-col-reverse",
        isOverlayMode && "flex-col lg:flex-row"
    );

    // Padding Logic
    const mainStyles: React.CSSProperties = {};
    if (!isOverlayMode) {
        if (sidebarPosition === 'top') mainStyles.paddingTop = '4rem';
        if (sidebarPosition === 'bottom') mainStyles.paddingBottom = '4rem';
    } else if (isFloating) {
        // Add padding for Dock
        mainStyles.paddingBottom = '6rem'; // Enough space for dock + fab
    }

    return (
        <FinanceProvider>
            <SettingsProvider>
                <ProjectsProvider>
                    <AutoDepositManager />
                    <div className={layoutClasses}>
                        {/* Mobile Header */}
                        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shrink-0 z-30">
                            <LogoCombined />
                            <div className="flex gap-2">
                                {!isFloating && (
                                    <button
                                        className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-zinc-900 rounded-lg"
                                        onClick={() => setIsMobileMenuOpen(true)}
                                    >
                                        <Menu size={24} />
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* Mobile Backdrop */}
                        {isMobileMenuOpen && (
                            <div
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        )}

                        {/* Sidebar Wrapper */}
                        <div className={clsx(
                            "z-[60] lg:z-40",
                            isVertical && "lg:h-full", // Only full height for vertical sidebars
                            isMobileMenuOpen ? "fixed inset-0 pointer-events-none" : "",
                            !isFloating && isVertical && "flex-shrink-0"
                        )}>
                            <Sidebar
                                isOpen={isMobileMenuOpen}
                                onClose={() => setIsMobileMenuOpen(false)}
                                onOpenSettings={() => setIsSettingsOpen(true)}
                            />
                        </div>

                        <main
                            className={clsx(
                                "flex-1 overflow-auto w-full relative transition-all duration-300",
                                isFullWidthPage ? "p-0" : "p-4 lg:p-8 max-w-[1600px] mx-auto"
                            )}
                            style={mainStyles}
                        >
                            {/* Desktop Trigger removed - handled internally by Sidebar */}

                            <Outlet />
                        </main>

                        <MobileQuickAdd />
                        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                        <GlobalLevelUpManager />
                        <Toaster position="top-center" />
                    </div>
                </ProjectsProvider>
            </SettingsProvider>
        </FinanceProvider >
    );
};

export default Layout;
