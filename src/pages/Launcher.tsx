import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, ArrowRight, LayoutGrid, Settings, Check, Landmark, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LogoCombined } from '../components/ui/Logo';
import { useTheme } from '../context/ThemeContext';

const Launcher = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [showSettings, setShowSettings] = useState(false);
    const [defaultApp, setDefaultApp] = useState<string | null>(() => localStorage.getItem('vaultly_default_app'));
    const { themeStyle, setThemeStyle } = useTheme();

    const themeStyles: { id: string; name: string; color: string }[] = [
        { id: 'classic', name: 'Clásico', color: 'bg-emerald-500' },
        { id: 'clay', name: 'Clay', color: 'bg-orange-400' },
        { id: 'mist', name: 'Mist', color: 'bg-cyan-500' },
        { id: 'royal', name: 'Royal', color: 'bg-purple-600' },
        { id: 'bloom', name: 'Bloom', color: 'bg-pink-500' },
        { id: 'sage', name: 'Sage', color: 'bg-stone-500' },
        { id: 'nordic', name: 'Nordic', color: 'bg-slate-500' },
    ];

    // Auto Redirect Logic
    useEffect(() => {
        // If default app is set AND we didn't arrive here explicitly from the switcher
        if (defaultApp && location.state?.fromAppSwitcher !== true) {
            navigate(defaultApp, { replace: true });
        }
    }, [defaultApp, location, navigate]);

    const apps = [
        {
            id: 'finance',
            title: 'Vault',
            description: 'Gestión completa de finanzas personales. Gastos, ingresos, metas y proyecciones.',
            icon: Landmark,
            color: 'bg-emerald-500',
            gradient: 'from-emerald-500 to-teal-500',
            path: '/dashboard',
        },
        {
            id: 'planivio',
            title: 'Planivio',
            description: 'Gestión académica para estudiantes. Tareas, cursos, calendario y proyectos.',
            icon: GraduationCap,
            color: 'bg-indigo-500',
            gradient: 'from-indigo-500 to-violet-500',
            path: '/planivio',
        },
        // Future apps can be added here
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden transition-colors duration-300">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/5 to-transparent dark:from-indigo-500/10 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-8 py-6 flex items-center justify-between">
                <LogoCombined />
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                        title="Configurar Inicio"
                    >
                        <Settings size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        <LayoutGrid size={16} />
                        <span>App Hub</span>
                    </div>
                </div>
            </header>

            {/* Settings Modal (Expanded) */}
            {showSettings && (
                <div className="absolute top-20 right-8 z-50 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-in fade-in slide-in-from-top-4 overflow-y-auto max-h-[80vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-zinc-900 dark:text-white">Configuración</h3>
                        <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-900"><div /></button>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">Aplicación por Defecto</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('vaultly_default_app');
                                    setDefaultApp(null);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${!defaultApp ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                            >
                                <span>Mostrar Hub</span>
                                {!defaultApp && <Check size={14} />}
                            </button>
                            {apps.map(app => (
                                <button
                                    key={app.id}
                                    onClick={() => {
                                        localStorage.setItem('vaultly_default_app', app.path);
                                        setDefaultApp(app.path);
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${defaultApp === app.path ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                                >
                                    <span>{app.title}</span>
                                    {defaultApp === app.path && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">Estilo Visual</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {themeStyles.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setThemeStyle(style.id as any)}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${themeStyle === style.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full ${style.color}`} />
                                    <span className="text-sm text-zinc-600 dark:text-zinc-300">{style.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Auto Redirect Logic */}


            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <div className="max-w-4xl w-full space-y-12">

                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Vaultly</span>
                        </h1>
                        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
                            Selecciona una aplicación para comenzar. Tu centro de control para finanzas y más.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {apps.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => navigate(app.path)}
                                className="group relative flex flex-col text-left p-1 rounded-3xl transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                            >
                                {/* Card Border Gradient */}
                                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`} />
                                <div className="absolute inset-0 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group-hover:border-transparent transition-colors duration-300" />

                                {/* Card Content */}
                                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-[22px]">
                                    <div className={`w-14 h-14 rounded-2xl ${app.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <app.icon size={28} />
                                    </div>

                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                        {app.title}
                                    </h3>

                                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed flex-1">
                                        {app.description}
                                    </p>

                                    <div className="flex items-center text-sm font-semibold text-zinc-900 dark:text-white group-hover:translate-x-1 transition-transform duration-300">
                                        Abrir Aplicación
                                        <ArrowRight size={16} className="ml-2 group-hover:ml-3 transition-all" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
                <p>&copy; {new Date().getFullYear()} Vaultly Ecosystem. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default Launcher;
