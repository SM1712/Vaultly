import { useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { NAV_SECTIONS } from '../../constants/navigation';
import { clsx } from 'clsx';
import { LayoutDashboard, Receipt, Tag, Users, Wallet, Target, Settings, LogOut, ChevronRight, Calculator, CheckCircle2, Box, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileMoreMenu() {
    const { isMobileMenuOpen, setIsMobileMenuOpen, setMobileNavStyle, mobileNavStyle, setIsSettingsOpen } = useTheme();
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate(); // Added navigate

    // Close on navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname, setIsMobileMenuOpen]);

    // Add missing option to prevent typescript overlap failure
    if (!isMobileMenuOpen || (mobileNavStyle as 'dock' | 'drawer' | 'sidebar') === 'sidebar') return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col pointer-events-none lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Bottom Sheet */}
            <div className="absolute bottom-0 inset-x-0 bg-zinc-50 dark:bg-zinc-950 rounded-t-[2rem] shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">

                {/* Header-Handle */}
                <div className="relative pt-4 pb-2 shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
                    <div className="flex items-center justify-between px-6 mb-2">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Menú</h2>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 bg-zinc-200 dark:bg-zinc-900 rounded-full text-zinc-500"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6 pt-0 no-scrollbar">

                    {/* Navigation Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {NAV_SECTIONS.flatMap(section => section.items).map((item) => (
                            <NavLink
                                key={item.id}
                                to={item.to}
                                className={({ isActive }) => clsx(
                                    "flex flex-col items-center gap-2 p-2 rounded-2xl active:scale-95 transition-transform",
                                    isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={clsx(
                                            "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-sm text-2xl mb-1",
                                            isActive
                                                ? "bg-primary text-white shadow-primary/30"
                                                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800"
                                        )}>
                                            <item.icon size={26} strokeWidth={1.5} />
                                        </div>
                                        <span className={clsx(
                                            "text-[11px] font-medium text-center leading-tight",
                                            isActive ? "text-primary dark:text-primary" : "text-zinc-600 dark:text-zinc-300"
                                        )}>
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* Quick Access / Utils Section */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 border border-zinc-100 dark:border-zinc-800/50 mb-6">
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                if (setIsSettingsOpen) setIsSettingsOpen(true);
                            }}
                            className="flex items-center justify-between w-full p-4 mb-2 bg-white rounded-xl active:scale-[0.98] transition-all shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700/50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Settings size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Configuración</p>
                                    <p className="text-xs text-zinc-500">Ajustes de cuenta y app</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-zinc-400" />
                        </button>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>

                    <div className="h-8" /> {/* Safe padding */}
                </div>
            </div>
        </div>
    );
};
