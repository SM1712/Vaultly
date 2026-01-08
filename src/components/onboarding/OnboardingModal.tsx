import { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ChevronRight, Rocket, Shield, Hourglass, Zap, Wallet, Layers } from 'lucide-react';

const OnboardingModal = () => {
    const { hasSeenOnboarding, setHasSeenOnboarding } = useSettings();
    const [step, setStep] = useState(0);
    const [isOpen, setIsOpen] = useState(!hasSeenOnboarding);

    if (hasSeenOnboarding && !isOpen) return null;

    useEffect(() => {
        if (hasSeenOnboarding) {
            setIsOpen(false);
        }
    }, [hasSeenOnboarding]);

    const steps = [
        {
            title: "La Hermandad del Ahorro",
            icon: <Shield size={48} className="text-zinc-500" />,
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        Bienvenido, Iniciado. El Yermo financiero es implacable, pero aquí tienes un refugio seguro para tu capital.
                    </p>
                    <p className="text-sm border-l-2 border-zinc-500 pl-3 italic text-zinc-500">
                        "Ad victoriam, ad parsimonia." (Hacia la victoria, hacia el ahorro).
                    </p>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-bold">Misión:</span> Proteger tus finanzas de la radiación inflacionaria.
                    </div>
                </div>
            )
        },
        {
            title: "El Equilibrio de la Fuerza",
            icon: <Wallet size={48} className="text-emerald-500" />,
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        Para mantener el orden en la galaxia, debes registrar cada crédito.
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            Cómo funciona:
                        </p>
                        <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
                            <li>Usa el botón <span className="font-bold text-emerald-600">+</span> para añadir Ingresos o Gastos.</li>
                            <li>Clasifícalos para ver tus gráficas de poder.</li>
                        </ul>
                    </div>
                    <p className="text-xs text-zinc-400 italic text-center mt-2">
                        "¿Controlar tus gastos? No lo intentes. Hazlo."
                    </p>
                </div>
            )
        },
        {
            title: "Atajos Tácticos",
            icon: <Zap size={48} className="text-yellow-500" />,
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        En el calor de la batalla diaria, no hay tiempo para formularios largos.
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                        <p className="text-sm font-bold text-yellow-700 dark:text-yellow-500 mb-1">Nueva Función: La Botonera</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Configura "Atajos" en Ajustes para tus gastos frecuentes (Café, Transporte, Supermercado). Regístralos con un solo toque desde el móvil.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Silos de Recursos",
            icon: <Layers size={48} className="text-blue-500" />,
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        No mezcles el combustible de la nave con las provisiones de la tripulación.
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            Sección: Fondos
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Crea carpetas separadas para dinero que ya tienes pero no quieres gastar (ej: "Fondo de Emergencia" o "Impuestos"). Este dinero se "oculta" de tu saldo disponible diario.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Relatividad Financiera",
            icon: <Hourglass size={48} className="text-cyan-500" />,
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        Usa las <span className="font-bold">Proyecciones</span> para viajar al futuro y ver cómo terminará tu mes antes de que empiece.
                    </p>
                    <div className="relative overflow-hidden rounded-xl bg-black p-4 text-center">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2072&auto=format&fit=crop')] opacity-40 bg-cover bg-center"></div>
                        <p className="text-white font-bold relative z-10 text-sm italic">
                            "Un pequeño desliz aquí podría costarnos 51 años de intereses."
                        </p>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 text-center">
                        Simula gastos extra y pagos de crédito para evitar agujeros negros.
                    </p>
                </div>
            )
        },
        {
            title: "Protocolo T.A.R.S.",
            icon: <Rocket size={48} className="text-rose-500" />,
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-600 dark:text-zinc-300">
                        <span className="font-bold text-rose-500">T</span>u <span className="font-bold text-rose-500">A</span>sesor de <span className="font-bold text-rose-500">R</span>entabilidad <span className="font-bold text-rose-500">S</span>incera.
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Crea metas con fecha límite. Si te retrasas un mes, TARS recalculará automáticamente tus cuotas futuras. Honestidad al 95%.
                    </p>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded text-xs text-center italic text-zinc-500">
                        "Ahorrar para esa meta no es imposible. Es necesario."
                    </div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setHasSeenOnboarding(true);
        setIsOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative animate-in fade-in zoom-in-95 duration-300">

                {/* Visual Header */}
                <div className="h-32 bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                    <div className="relative z-10 transform transition-all duration-500 ease-out key={step}">
                        {steps[step].icon}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                            {steps[step].title}
                        </h2>
                        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                            {step + 1} / {steps.length}
                        </span>
                    </div>

                    <div className="min-h-[160px]">
                        {steps[step].content}
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={handleClose}
                            className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            Saltar Tutorial
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                        >
                            {step === steps.length - 1 ? "¡Despegar! 🚀" : "Siguiente"}
                            {step < steps.length - 1 && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
