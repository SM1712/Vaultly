import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { MockDataProvider } from '../context/MockDataProvider';
import { ArrowLeft, CheckCircle2, ChevronRight, MousePointer2 } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useGoals } from '../hooks/useGoals';
import { toast } from 'sonner';

// Tutorial Steps Definition
const getSteps = (isMobile: boolean) => [
    {
        id: 'welcome',
        title: 'Bienvenido al Simulador',
        message: 'Estás en un entorno seguro. Nada de lo que hagas aquí afectará tus datos reales. Vamos a aprender lo básico.',
        target: null,
        action: 'next'
    },
    // INGRESO
    {
        id: 'nav_income',
        title: 'Tu Primer Ingreso',
        message: isMobile
            ? 'Para empezar, necesitamos combustible. Ve a la sección de Ingresos en el menú lateral.'
            : 'Para empezar, necesitamos combustible. Ve a la sección de Ingresos en el menú lateral.',
        target: 'nav-ingresos',
        action: 'detect_view_income'
    },
    {
        id: 'add_income',
        title: 'Añade un Ingreso',
        message: 'Ahora que estás aquí, pulsa el botón "Registrar Transacción" para añadir tu nómina o un ingreso extra ficticio.',
        target: 'new-transaction',
        action: 'detect_income_added'
    },
    // GASTO
    {
        id: 'nav_expense',
        title: 'Registra un Gasto',
        message: '¡Bien! Ahora simulemos un gasto. Ve a la sección de Gastos.',
        target: 'nav-gastos',
        action: 'detect_view_expense'
    },
    {
        id: 'add_expense',
        title: 'Compra algo (Ficticio)',
        message: 'Registra una compra. Puede ser un café o comida. Rellena los datos y pulsa el botón "Registrar Transacción".',
        target: 'new-transaction',
        action: 'detect_expense_added'
    },
    // META
    {
        id: 'nav_goal',
        title: 'Define una Meta',
        message: 'Vamos a la sección de Metas para planificar tu ahorro.',
        target: 'nav-metas',
        action: 'detect_view_goals'
    },
    {
        id: 'create_goal',
        title: 'Crea una Meta',
        message: 'Define un objetivo de ahorro. Rellena el formulario y pulsa el botón "Crear Meta".',
        target: 'goal-form-container',
        action: 'detect_goal_added'
    },
    // PROYECCIONES
    {
        id: 'nav_projections',
        title: 'El Futuro 🔮',
        message: 'Para terminar, mira como tus decisiones afectan el futuro. Ve a la sección de Proyecciones.',
        target: 'nav-proyecciones',
        action: 'detect_view_projections'
    },
    {
        id: 'finish',
        title: '¡Entrenamiento Completo!',
        message: 'Ya conoces los fundamentos. Ahora estás listo para usar Vaultly con datos reales.',
        target: null,
        action: 'finish'
    }
];

const Spotlight = ({ targetId }: { targetId: string | null }) => {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const updateRect = () => {
            if (!targetId) {
                setRect(null);
                return;
            }

            const el = document.getElementById(targetId);
            if (el) {
                setRect(el.getBoundingClientRect());
            } else {
                // IMPORTANT: Clear rect if element is not found, to avoid stuck spotlight
                setRect(null);
            }
        };

        updateRect();
        // Use MutationObserver to detect when elements appear (like navigation changes)
        const observer = new MutationObserver(updateRect);
        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [targetId]);

    if (!targetId || !rect) return null;

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none transition-all duration-500 ease-out">
            {/* The Cutout Effect using SVG masking */}
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={rect.left - 5}
                            y={rect.top - 5}
                            width={rect.width + 10}
                            height={rect.height + 10}
                            rx="12"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Pulse Ring around target */}
            <div
                className="absolute border-2 border-indigo-500 rounded-xl animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                style={{
                    left: rect.left - 5,
                    top: rect.top - 5,
                    width: rect.width + 10,
                    height: rect.height + 10
                }}
            />
        </div>
    );
};

const TutorialOverlay = ({ stepIndex, onNext, onFinish, steps }: { stepIndex: number, onNext: () => void, onFinish: () => void, steps: any[] }) => {
    const step = steps[stepIndex];
    const isLast = stepIndex === steps.length - 1;

    return (
        <>
            <Spotlight targetId={step.target} />
            <div className="fixed bottom-6 right-6 z-[70] w-96 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="bg-zinc-900 border border-zinc-800 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                            {isLast ? <CheckCircle2 size={24} /> : <MousePointer2 size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                {step.message}
                            </p>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-zinc-600">PASO {stepIndex + 1}/{steps.length}</span>

                                {step.action === 'next' || isLast ? (
                                    <button
                                        onClick={isLast ? onFinish : onNext}
                                        className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
                                    >
                                        {isLast ? 'Salir del Simulador' : 'Continuar'} <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <span className="text-xs font-bold text-amber-500 animate-pulse">Esperando acción...</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Logic Wrapper to detect actions
const TutorialLogic = ({ children }: { children: React.ReactNode }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const steps = useMemo(() => getSteps(isMobile), [isMobile]);

    useEffect(() => {
        if (isMobile) {
            toast.error("El modo entrenamiento solo está disponible en PC.");
            navigate('/');
        }
    }, [isMobile, navigate]);

    // Hooks to detect data changes
    const { transactions } = useTransactions();
    const { goals } = useGoals(); // Needs to be inside Goals context ideally, but Layout wraps it? No, Layout wraps providers.
    // Wait, Layout wraps providers inside itself?
    // In original Layout.tsx: FinanceProvider -> SettingsProvider -> ProjectsProvider
    // Goals provider is NOT in Layout.tsx? 
    // Let's check App.tsx again. App.tsx wraps DataProvider. 
    // Where is useGoals defined? It likely uses useData.
    // Let's check useGoals hook.

    // Assuming useGoals uses useData just like useTransactions.

    // Assuming useGoals uses useData just like useTransactions.

    const currentStep = steps[stepIndex];

    useEffect(() => {
        if (!currentStep) return;

        // NAVIGATION DETECTORS
        if (currentStep.action === 'detect_view_income' && location.pathname.includes('/income')) {
            setStepIndex(prev => prev + 1);
        }
        if (currentStep.action === 'detect_view_expense' && location.pathname.includes('/expenses')) {
            setStepIndex(prev => prev + 1);
        }
        if (currentStep.action === 'detect_view_goals' && location.pathname.includes('/goals')) {
            setStepIndex(prev => prev + 1);
        }
        if (currentStep.action === 'detect_view_projections' && location.pathname.includes('/projections')) {
            setStepIndex(prev => prev + 1);
        }

        // DATA ACTION DETECTORS
        if (currentStep.action === 'detect_income_added') {
            const hasIncome = transactions.some(t => t.type === 'income');
            if (hasIncome) {
                toast.success("¡Ingreso detectado!", { icon: '⛽' });
                setStepIndex(prev => prev + 1);
            }
        }

        if (currentStep.action === 'detect_expense_added') {
            const hasExpense = transactions.some(t => t.type === 'expense');
            if (hasExpense) {
                toast.success("¡Gasto registrado!", { icon: '📉' });
                setStepIndex(prev => prev + 1);
            }
        }

        if (currentStep.action === 'detect_goal_added') {
            if (goals && goals.length > 0) {
                toast.success("¡Meta creada!", { icon: '🎯' });
                setStepIndex(prev => prev + 1);
            }
        }

    }, [transactions, goals, currentStep, location.pathname]);

    const handleExit = () => {
        navigate('/');
        toast.info("Has vuelto al mundo real.");
    };

    return (
        <>
            {children}
            <TutorialOverlay
                stepIndex={stepIndex}
                onNext={() => setStepIndex(prev => prev + 1)}
                onFinish={handleExit}
                steps={steps}
            />

            {/* Exit Button Always Available */}
            <button
                onClick={handleExit}
                className="fixed top-4 right-4 z-[90] bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
            >
                <ArrowLeft size={14} /> Salir de Simulación
            </button>

            <div className="fixed top-0 left-0 w-full h-1 bg-indigo-500 z-[100]" />
            <div className="fixed top-1 left-0 w-full bg-indigo-500 text-white text-[10px] font-bold text-center py-0.5 z-[100] tracking-widest uppercase">
                MODO ENTRENAMIENTO • DATOS FICTICIOS
            </div>
        </>
    );
};


export default function OnboardingPage() {
    return (
        <MockDataProvider>
            <TutorialLogic>
                {/* We reuse the main Layout but inside our Mock Provider 
                     The Layout inside Render will see MockDataProvider because it's wrapped here.
                     BUT Layout.tsx inside renders FinanceProvider > SettingsProvider > ...
                     And those providers might use useData? 
                     SettingsContext uses useData? Let's verify.
                     If they use useData, they will pick up our Mock.
                     
                     However, Layout renders <Outlet />.
                     We need to render the Dashboard specifically for the tutorial, or allow navigation?
                     If we render <Layout><Dashboard/></Layout>, we can simulate the Index page.
                     But we want navigation to work (Goals, etc).
                     
                     If we use Layout with Outlet, we need routing. 
                     Since we are at /onboarding route, we can't easily use sub-routes unless we define them in main router.
                     
                     Alternative: Render Layout and handle "Internal Navigation" manually? No that's hard.
                     
                     Better: In App.tsx, define /onboarding/* subroutes?
                     Or just make OnboardingPage render the Dashboard directly for now, and maybe swap components based on state?
                     
                     The prompt asked for interactive onboarding. The user needs to navigate to "Goals".
                     So we definitely need routing inside Onboarding.
                     
                     Solution: OnboardingPage shouldn't implement the Router structure again if we can avoid it.
                     But if we want to reuse `Layout` components (Sidebar, etc) that use `Link` or `useNavigate`, they will try to modify the top level URL.
                     If I am at `/onboarding`, clicking "Metas" in Sidebar will go to `/goals` (Real App!).
                     
                     CRITICAL: The Sidebar links are hardcoded to `/goals`, `/expenses`.
                     If we use the MockProvider at `/onboarding`, clicking a link will take us OUT of `/onboarding` and back to `/goals` (which uses Real DataProvider).
                     
                     We need to TRAP the user in the simulation.
                     
                     This means either:
                     1.  We implement a "Simulation Mode" flag in the global context, so the REAL URL `/goals` shows fake data.
                         - This is invasive to the main app code.
                     2.  We modify Sidebar to accept a "base path" or something.
                     3.  We hijack navigation?
                     
                     Let's go with option 1, but "Softly".
                     If we have a GLOBAL `isSimulation` state in a tiny context that wraps `DataProvider`?
                     
                     Actually, user asked for: "en configuración especificamente en la pestaña de enciclopedia quiero un boton que diga "Onboarding" que te ejecute el onboarding, en un entorno temporal no real."
                     
                     If I make `/onboarding` wrap `MockDataProvider`, I need to make sure links stay in `/onboarding/goals`, `/onboarding/expenses`.
                     I would need to duplicate routes in App.tsx:
                     `/onboarding` -> Layout (Mock) -> Dashboard
                     `/onboarding/goals` -> Layout (Mock) -> Goals
                     
                     This seems cleanest. I will define a nested route structure in App.tsx for `/onboarding`.
                  */}
                <Layout />
            </TutorialLogic>
        </MockDataProvider>
    );
}
