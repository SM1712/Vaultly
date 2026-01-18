import { Download, Monitor, Smartphone, AlertCircle } from 'lucide-react';
// import { useSettings } from '../context/SettingsContext';

const DownloadPage = () => {
    // const { theme } = useSettings(); // Keeping usage if needed for conditional classes

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Descargar Aplicación</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Lleva Vaultly contigo a todos lados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Windows Card */}
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Monitor size={120} className="text-indigo-600 dark:text-indigo-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                            <Monitor size={28} />
                        </div>

                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Windows</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs">
                            Experiencia nativa para escritorio. Rendimiento máximo y actualizaciones automáticas.
                        </p>

                        <div className="space-y-3">
                            <button disabled className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                                <Download size={20} />
                                <span>Descargar .exe</span>
                            </button>
                            <p className="text-xs text-center text-zinc-400">Versión 1.0.0 (Próximamente)</p>
                        </div>
                    </div>
                </div>

                {/* Android Card */}
                <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Smartphone size={120} className="text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                            <Smartphone size={28} />
                        </div>

                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Android</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs">
                            Tu bóveda en tu bolsillo. Accede a tus finanzas, agrega gastos y revisa tus metas.
                        </p>

                        <div className="space-y-3">
                            <div className="w-full py-3 px-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-wait">
                                <AlertCircle size={20} />
                                <span>Próximamente</span>
                            </div>
                            <p className="text-xs text-center text-zinc-400">Estamos cocinando la versión nativa.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg h-fit">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1">¿Por qué usar la versión nativa?</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
                        Aunque Vaultly funciona perfecto en el navegador, las versiones nativas ofrecen mejor integración con el sistema operativo, mayor rendimiento al cargar los datos y acceso offline más robusto.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DownloadPage;
