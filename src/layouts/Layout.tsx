import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SettingsMenu from '../components/settings/SettingsMenu';
import MobileQuickAdd from '../components/ui/MobileQuickAdd';
import { FinanceProvider } from '../context/FinanceContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ProjectsProvider } from '../context/ProjectsContext';
import { Menu, X } from 'lucide-react';
import { Toaster } from 'sonner';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);


    return (
        <FinanceProvider>
            <SettingsProvider>
                <ProjectsProvider>
                    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg shadow-lg"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Sidebar */}
                        <div className={`fixed lg:static inset-y-0 left-0 z-40 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
                            <Sidebar
                                isOpen={isMobileMenuOpen}
                                onClose={() => setIsMobileMenuOpen(false)}
                                onOpenSettings={() => setIsSettingsOpen(true)}
                            />
                        </div>

                        {/* Overlay for mobile */}
                        {isMobileMenuOpen && (
                            <div
                                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                        )}

                        <main className="flex-1 overflow-auto p-4 lg:p-8 w-full max-w-[1600px] mx-auto relative">
                            <Outlet />
                        </main>

                        <MobileQuickAdd />
                        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                        <Toaster position="top-center" />
                    </div>
                </ProjectsProvider>
            </SettingsProvider>
        </FinanceProvider>
    );
};

export default Layout;
