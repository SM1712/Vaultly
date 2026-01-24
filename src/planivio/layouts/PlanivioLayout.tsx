import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, Home, CheckSquare, Calendar as CalendarIcon, BookOpen, Folder, FileText, Menu, X, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import PlanivioSettingsModal from '../components/PlanivioSettingsModal';
import PlanivioLogo from '../components/PlanivioLogo';

const PlanivioSidebar = ({ onClose, onOpenSettings }: { onClose: () => void; onOpenSettings: () => void }) => {
    const navigate = useNavigate();

    const links = [
        { to: '/planivio', end: true, icon: Home, label: 'Dashboard' },
        { to: '/planivio/tasks', icon: CheckSquare, label: 'Tareas' },
        { to: '/planivio/calendar', icon: CalendarIcon, label: 'Calendario' },
        { to: '/planivio/courses', icon: BookOpen, label: 'Cursos' },
        { to: '/planivio/projects', icon: Folder, label: 'Proyectos' },
        { to: '/planivio/notes', icon: FileText, label: 'Notas' },
    ];

    return (
        <aside className="h-full flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="h-20 flex items-center px-6 mb-2">
                <PlanivioLogo className="w-8 h-8" textClassName="text-xl hidden lg:block" />
                <button onClick={onClose} className="lg:hidden text-slate-400 ml-auto hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 hidden lg:block">Menu</p>
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            onClick={() => window.innerWidth < 1024 && onClose()}
                            className={({ isActive }) => clsx(
                                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                                isActive
                                    ? "bg-primary/20 text-white border border-primary/20 shadow-lg shadow-primary/10"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/5 border border-transparent"
                            )}
                        >
                            <link.icon size={20} className={clsx("transition-transform duration-300", "group-hover:scale-110", "relative z-10")} />
                            <span className="font-medium hidden lg:block relative z-10">{link.label}</span>

                            {/* Glow Effect on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Footer Navigation */}
            <div className="p-4 space-y-2">
                <button
                    onClick={() => {
                        window.innerWidth < 1024 && onClose();
                        onOpenSettings();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/5 border border-transparent transition-all group relative overflow-hidden"
                >
                    <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500 relative z-10" />
                    <span className="font-medium hidden lg:block relative z-10">Configuración</span>
                </button>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                <button
                    onClick={() => navigate('/', { state: { fromAppSwitcher: true } })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all font-medium text-sm group border border-transparent hover:border-white/5"
                >
                    <LayoutGrid size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="hidden lg:block">Volver al Hub</span>
                </button>
            </div>
        </aside>
    );
};

const PlanivioLayout = () => {
    // State for Mobile Sidebar (Sheet)
    const [isMobileOpen, setMobileOpen] = useState(false);
    // State for Desktop Sidebar (Collapsible)
    const [isDesktopVisible, setDesktopVisible] = useState(true);
    // State for Settings Modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0a0b14] text-slate-900 dark:text-slate-200 overflow-hidden font-sans selection:bg-violet-500/30 transition-colors duration-500">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Light Mode Gradients (Happy/Bright/Cheerier) */}
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-sky-200/40 dark:opacity-0 rounded-full blur-[100px] mix-blend-multiply" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-200/40 dark:opacity-0 rounded-full blur-[100px] mix-blend-multiply" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-fuchsia-100/60 dark:opacity-0 rounded-full blur-[80px] mix-blend-multiply" />

                {/* Dark Mode Gradients (Deep Space) */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-900/20 rounded-full blur-[120px] opacity-0 dark:opacity-100" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-900/15 rounded-full blur-[120px] opacity-0 dark:opacity-100" />
            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Custom Settings Modal */}
            <PlanivioSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Desktop Sidebar (Collapsible) */}
            <div className={clsx(
                "hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out border-r border-white/5 bg-[#0f111a]/95 backdrop-blur-xl overflow-hidden shadow-2xl",
                isDesktopVisible ? "w-64 opacity-100" : "w-0 opacity-0 border-r-0 pointer-events-none"
            )}>
                <div className="w-64 h-full">
                    <PlanivioSidebar onClose={() => setDesktopVisible(false)} onOpenSettings={() => setIsSettingsOpen(true)} />
                </div>
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <div className={clsx(
                "lg:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 w-72 bg-[#0f111a] shadow-2xl border-r border-white/5",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <PlanivioSidebar onClose={() => setMobileOpen(false)} onOpenSettings={() => { setMobileOpen(false); setIsSettingsOpen(true); }} />
            </div>


            <div className={clsx("flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-300", isDesktopVisible ? "lg:ml-64" : "lg:ml-0")}>
                {/* Header (Desktop Toggle + Mobile Menu) */}
                <header className="flex items-center justify-between p-4 lg:px-8 mt-2 h-16 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 lg:hidden hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <Menu size={20} />
                        </button>

                        {/* Desktop Toggle (Show/Hide) */}
                        <button
                            onClick={() => setDesktopVisible(!isDesktopVisible)}
                            className="hidden lg:flex p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all"
                            title={isDesktopVisible ? "Ocultar Menú" : "Mostrar Menú"}
                        >
                            {isDesktopVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>

                        {/* Title (Only visible when sidebar is hidden on desktop) */}
                        <div className={clsx(
                            "font-bold text-slate-700 dark:text-white flex items-center gap-3 transition-all duration-300 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 dark:border-white/5",
                            isDesktopVisible ? "lg:opacity-0 lg:-translate-x-4 pointer-events-none" : "lg:opacity-100 lg:translate-x-0"
                        )}>
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center text-xs shadow-md shadow-violet-500/20">P</div>
                            <span className="text-sm tracking-tight">Planivio</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 lg:p-8 scroll-smooth overflow-x-hidden">
                    <div className="max-w-7xl mx-auto pb-20">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PlanivioLayout;

