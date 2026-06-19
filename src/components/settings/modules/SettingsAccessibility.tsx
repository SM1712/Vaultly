import { useSettings } from '../../../context/SettingsContext';
import { Type, LayoutGrid, Volume2, Eye, CheckCircle2 } from 'lucide-react';

export const SettingsAccessibility = () => {
    const { accessibility, updateAccessibility } = useSettings();

    const fontSizes = [
        { id: 'small', label: 'Chico', desc: 'Para maximizar la cantidad de información visible (14px)' },
        { id: 'medium', label: 'Mediano', desc: 'Tamaño estándar equilibrado para lectura cómoda (16px)' },
        { id: 'large', label: 'Grande', desc: 'Letra más grande y legible para reducir fatiga visual (18px)' }
    ] as const;

    const spacings = [
        { id: 'compact', label: 'Compacto', desc: 'Reduce márgenes y rellenos para pantallas pequeñas' },
        { id: 'standard', label: 'Estándar', desc: 'Distribución espacial equilibrada por defecto' },
        { id: 'cozy', label: 'Cómodo', desc: 'Incrementa el espacio y separación para mayor relax visual' }
    ] as const;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Font Size Configuration */}
            <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Type size={16} /> Tamaño del Texto
                </h3>
                <p className="text-xs text-zinc-500 mb-4">Ajusta el tamaño relativo de las fuentes en toda la interfaz.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {fontSizes.map(({ id, label, desc }) => (
                        <button
                            key={id}
                            onClick={() => updateAccessibility({ fontSize: id })}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                                accessibility.fontSize === id
                                    ? 'bg-primary/5 border-primary shadow-sm'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                            }`}
                        >
                            <div className="flex justify-between items-center w-full mb-1">
                                <span className={`font-bold text-sm ${accessibility.fontSize === id ? 'text-primary' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                    {label}
                                </span>
                                {accessibility.fontSize === id && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                            </div>
                            <span className="text-[10px] text-zinc-500 leading-normal">{desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* UI Spacing Configuration */}
            <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <LayoutGrid size={16} /> Espaciado de Interfaz
                </h3>
                <p className="text-xs text-zinc-500 mb-4">Ajusta la densidad de elementos, tarjetas y menús.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {spacings.map(({ id, label, desc }) => (
                        <button
                            key={id}
                            onClick={() => updateAccessibility({ spacing: id })}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                                accessibility.spacing === id
                                    ? 'bg-primary/5 border-primary shadow-sm'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                            }`}
                        >
                            <div className="flex justify-between items-center w-full mb-1">
                                <span className={`font-bold text-sm ${accessibility.spacing === id ? 'text-primary' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                    {label}
                                </span>
                                {accessibility.spacing === id && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                            </div>
                            <span className="text-[10px] text-zinc-500 leading-normal">{desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Visual & Sound Enhancements */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye size={16} /> Ayudas de Accesibilidad
                </h3>

                {/* High Contrast Switch */}
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-sm">Alto Contraste</span>
                        <span className="text-xs text-zinc-500">Forzar colores planos de alta legibilidad, bordes definidos y deshabilitar transparencias.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={accessibility.highContrast}
                            onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Sound Effects Switch */}
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                            <Volume2 size={16} /> Efectos de Sonido
                        </span>
                        <span className="text-xs text-zinc-500">Habilitar la reproducción de alertas de sonido al agregar transacciones o completar logros.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={accessibility.soundEffects}
                            onChange={(e) => updateAccessibility({ soundEffects: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};
