import { useState, useEffect, Suspense } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import RouteLoader from '../components/ui/RouteLoader';
import Sidebar from '../components/Sidebar';
import SettingsMenu from '../components/settings/SettingsMenu';
import { useTheme } from '../context/ThemeContext';
import MobileQuickAdd from '../components/ui/MobileQuickAdd';
import { LogoCombined } from '../components/ui/Logo';
import { FinanceProvider } from '../context/FinanceContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ProjectsProvider } from '../context/ProjectsContext';
import { Menu, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';
import LevelUpModal from '../components/gamification/LevelUpModal';
import { useGamification } from '../context/GamificationContext';
import { toast } from 'sonner';

import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';

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

const AutoScheduledManager = () => {
    const { processScheduledTransactions } = useScheduledTransactions();

    useEffect(() => {
        if (typeof processScheduledTransactions === 'function') {
            processScheduledTransactions();
        }
    }, [processScheduledTransactions]);

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768);
    const location = useLocation();
    const navigate = useNavigate();
    const {
        sidebarPosition,
        sidebarVisibility,
        isMobileMenuOpen,
        setIsMobileMenuOpen
    } = useTheme();

    const isPreferredDesktop = localStorage.getItem('vaultly_preferred_view') === 'desktop';

    const handleBackToMobile = () => {
        localStorage.setItem('vaultly_preferred_view', 'mobile');
        toast.success('Cambiando a versión móvil...');
        setTimeout(() => {
            navigate('/m', { replace: true });
            window.location.reload();
        }, 300);
    };

    // Responsive Mobile Redirection
    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const isMobile = width < 768;
            setIsMobileScreen(isMobile);
            const preference = localStorage.getItem('vaultly_preferred_view');
            if (isMobile && preference !== 'desktop') {
                navigate('/m', { replace: true });
            }
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, [navigate]);

    // Desktop Layout Logic
    const isVertical = sidebarPosition === 'left' || sidebarPosition === 'right';
    const isFloating = sidebarVisibility === 'floating';
    const isAuto = sidebarVisibility === 'auto';
    const isOverlayMode = isFloating || isAuto;

    // Determine the main flex container direction
    const layoutClasses = clsx(
        "flex h-screen overflow-hidden bg-transparent transition-colors duration-300",
        !isOverlayMode && sidebarPosition === 'left' && "flex-col lg:flex-row",
        !isOverlayMode && sidebarPosition === 'right' && "flex-col lg:flex-row-reverse",
        !isOverlayMode && sidebarPosition === 'top' && "flex-col",
        !isOverlayMode && sidebarPosition === 'bottom' && "flex-col-reverse",
        isOverlayMode && "flex-col lg:flex-row"
    );

    // Padding Logic
    const mainStyles: React.CSSProperties = {};
    if (!isOverlayMode) {
        if (sidebarPosition === 'top') mainStyles.paddingTop = '5.25rem'; // Increased from 4rem to add breathing room below top navbar
        if (sidebarPosition === 'bottom') mainStyles.paddingBottom = '5.25rem'; // Increased from 4rem to add breathing room above bottom navbar
    } else if (isFloating) {
        // Add padding for Dock
        mainStyles.paddingBottom = '7rem'; // Increased from 6rem to prevent dock overlapping content
    }

    return (
        <FinanceProvider>
            <SettingsProvider>
                <ProjectsProvider>
                    <AutoDepositManager />
                    <AutoScheduledManager />
                    {isMobileScreen && isPreferredDesktop && (
                        <div className="bg-amber-500 dark:bg-amber-600 text-white text-[11px] font-bold py-2 px-4 flex items-center justify-between z-[70] shadow-sm relative animate-in slide-in-from-top duration-300 border-b border-amber-600 dark:border-amber-700 shrink-0 w-full">
                            <div className="flex items-center gap-1.5">
                                <Smartphone size={13} className="animate-pulse flex-shrink-0" />
                                <span>Vista de escritorio forzada</span>
                            </div>
                            <button
                                onClick={handleBackToMobile}
                                className="bg-white dark:bg-zinc-950 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-amber-50 dark:hover:bg-zinc-900 active:scale-95 transition-all shadow-sm"
                            >
                                Volver a Vista Móvil
                            </button>
                        </div>
                    )}
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
                            className="flex-1 overflow-auto w-full relative transition-all duration-300 p-4 lg:p-8 max-w-[1600px] mx-auto"
                            style={mainStyles}
                        >
                            <Suspense fallback={<RouteLoader />}>
                                <Outlet />
                            </Suspense>
                        </main>

                        <MobileQuickAdd />
                        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                        <GlobalLevelUpManager />
                    </div>
                </ProjectsProvider>
            </SettingsProvider>
        </FinanceProvider >
    );
};

export default Layout;
