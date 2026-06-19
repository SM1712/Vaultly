import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Wallet, ArrowDownUp, Target, Landmark, Menu as MenuIcon,
    Plus, ChevronDown, Check, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

import { FinanceProvider } from '../context/FinanceContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { ProjectsProvider } from '../context/ProjectsContext';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { usePresets } from '../hooks/usePresets';
import { useLocalNotifications } from '../hooks/useLocalNotifications';

// Managers to auto-run background tasks just like in the desktop layout
import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import LevelUpModal from '../components/gamification/LevelUpModal';
import { useGamification } from '../context/GamificationContext';

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

// Polished Quick Add Bottom Sheet
const QuickAddSheet = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Otros');
    const [description, setDescription] = useState('');

    const { addTransaction } = useTransactions();
    const { categories: expenseCats } = useCategories('expense');
    const { categories: incomeCats } = useCategories('income');
    const { currency } = useSettings();
    const { presets } = usePresets();
    const { isSoundEnabled } = useLocalNotifications();

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate([40]);
        }
    };

    const playSound = () => {
        if (isSoundEnabled) {
            const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
            audio.volume = 0.4;
            audio.play().catch(() => {});
        }
    };

    const handleSubmit = () => {
        const val = Number(amount);
        if (!val || val <= 0) return;

        const txId = addTransaction({
            amount: val,
            type,
            category: category || 'Otros',
            date: new Date().toLocaleDateString('en-CA'),
            description: description || (type === 'expense' ? 'Gasto Móvil' : 'Ingreso Móvil')
        });

        if (txId) {
            triggerHaptic();
            playSound();
            const isExpense = type === 'expense';
            toast(isExpense ? 'Gasto registrado' : 'Ingreso registrado', {
                description: `${currency}${val.toLocaleString()} - ${category || 'Otros'}`,
                icon: isExpense ? <ArrowDownLeft className="text-rose-500" size={18} /> : <ArrowUpRight className="text-emerald-500" size={18} />
            });
            onClose();
            // Reset
            setAmount('');
            setCategory('Otros');
            setDescription('');
            setType('expense');
        }
    };

    const categories = type === 'expense' ? expenseCats : incomeCats;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="w-full bg-white dark:bg-zinc-950 rounded-t-[2.5rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 pb-8 pt-4 px-6 z-10 max-h-[92vh] flex flex-col overflow-y-auto no-scrollbar"
                    >
                        {/* Drag indicator */}
                        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" onClick={onClose} />

                        <div className="flex justify-between items-center mb-6">
                            <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 dark:text-zinc-500 active:scale-95">
                                <ChevronDown size={28} />
                            </button>
                            <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Registrar Transacción</span>
                            <div className="w-10" />
                        </div>

                        {/* Presets Row */}
                        {presets.length > 0 && (
                            <div className="mb-6">
                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Atajos</p>
                                <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 no-scrollbar">
                                    {presets.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                if (!p.amount) return;
                                                const txId = addTransaction({
                                                    amount: p.amount,
                                                    type: p.type,
                                                    category: p.category,
                                                    date: new Date().toLocaleDateString('en-CA'),
                                                    description: p.label
                                                });
                                                if (txId) {
                                                    triggerHaptic();
                                                    playSound();
                                                    toast.success(`Ejecutado: ${p.label}`, {
                                                        description: `${currency}${p.amount}`
                                                    });
                                                    onClose();
                                                }
                                            }}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 active:scale-95 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                                        >
                                            <span className={clsx(
                                                "w-2 h-2 rounded-full",
                                                p.type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'
                                            )} />
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expense / Income Selector */}
                        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-6">
                            <button
                                onClick={() => { setType('expense'); triggerHaptic(); }}
                                className={clsx(
                                    "py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                                    type === 'expense' 
                                        ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-sm" 
                                        : "text-zinc-500 dark:text-zinc-400"
                                )}
                            >
                                <ArrowDownLeft size={16} /> Gasto
                            </button>
                            <button
                                onClick={() => { setType('income'); triggerHaptic(); }}
                                className={clsx(
                                    "py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                                    type === 'income' 
                                        ? "bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm" 
                                        : "text-zinc-500 dark:text-zinc-400"
                                )}
                            >
                                Ingreso <ArrowUpRight size={16} />
                            </button>
                        </div>

                        {/* Super Large Numeric Display */}
                        <div className="flex items-center justify-center mb-6">
                            <span className="text-4xl font-bold text-zinc-400 mr-2">{currency}</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="bg-transparent text-center text-5xl font-black text-zinc-900 dark:text-zinc-100 focus:outline-none w-56 placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                                autoFocus
                            />
                        </div>

                        {/* Category carousels */}
                        <div className="mb-5">
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Categoría</p>
                            <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setCategory(cat); triggerHaptic(); }}
                                        className={clsx(
                                            "flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all",
                                            category === cat
                                                ? "border-primary bg-primary text-white"
                                                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setCategory('Otros'); triggerHaptic(); }}
                                    className={clsx(
                                        "flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all",
                                        category === 'Otros'
                                            ? "border-primary bg-primary text-white"
                                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                                    )}
                                >
                                    Otros
                                </button>
                            </div>
                        </div>

                        {/* Description field */}
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder={type === 'expense' ? "¿En qué gastaste?" : "¿De dónde provino?"}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-4 py-3.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-transparent dark:border-zinc-800 focus:ring-1 focus:ring-primary focus:outline-none text-sm dark:text-zinc-200"
                            />
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!amount}
                            className={clsx(
                                "w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2",
                                amount 
                                    ? "bg-primary text-white shadow-lg shadow-primary/25 active:scale-[0.98]" 
                                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                            )}
                        >
                            <Check size={20} strokeWidth={2.5} />
                            {amount ? 'Confirmar Transacción' : 'Ingresa un monto'}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const MobileLayoutContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    // Dynamic screen size check: Redirect desktop screen sizes back to desktop layout
    useEffect(() => {
        const checkDevice = () => {
            const isDesktop = window.innerWidth >= 768;
            const preference = localStorage.getItem('vaultly_preferred_view');
            if (isDesktop && preference !== 'mobile') {
                navigate('/', { replace: true });
            }
        };
        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, [navigate]);

    // Bottom Navigation configuration
    const navItems = [
        { path: '/m', icon: Wallet, label: 'Inicio' },
        { path: '/m/transactions', icon: ArrowDownUp, label: 'Actividad' },
        { path: 'quickadd', icon: Plus, label: 'Añadir', isActionButton: true },
        { path: '/m/savings', icon: Target, label: 'Ahorros' },
        { path: '/m/settings', icon: MenuIcon, label: 'Menú' }
    ];

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(25);
        }
    };

    return (
        <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-28 text-zinc-900 dark:text-zinc-50 overflow-hidden flex flex-col font-sans select-none">
            <AutoDepositManager />
            <AutoScheduledManager />

            {/* Main Page Area with Route Transitions */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 pt-6 max-w-md mx-auto w-full relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="w-full h-full pb-8"
                    >
                        <Suspense fallback={
                            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-zinc-400 animate-pulse tracking-widest uppercase">Cargando...</span>
                            </div>
                        }>
                            <Outlet />
                        </Suspense>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Nav Bar - Floating Glassmorphism style */}
            <nav className="fixed bottom-5 left-4 right-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] py-2 px-3 z-50 flex justify-between items-center max-w-sm mx-auto">
                {navItems.map((item, idx) => {
                    const isSelected = location.pathname === item.path;

                    if (item.isActionButton) {
                        return (
                            <button
                                key={idx}
                                onClick={() => { triggerHaptic(); setIsQuickAddOpen(true); }}
                                className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 active:bg-primary-dark transition-all transform -translate-y-4 border-4 border-white dark:border-zinc-950"
                            >
                                <Plus size={28} strokeWidth={3} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => { triggerHaptic(); navigate(item.path); }}
                            className="flex flex-col items-center justify-center w-12 py-1 relative active:scale-95 transition-transform"
                        >
                            <item.icon 
                                size={22} 
                                className={clsx(
                                    "transition-colors duration-200",
                                    isSelected ? "text-primary" : "text-zinc-400 dark:text-zinc-500"
                                )} 
                                strokeWidth={isSelected ? 2.5 : 2}
                            />
                            <span className={clsx(
                                "text-[9px] font-bold mt-1 transition-colors duration-200",
                                isSelected ? "text-primary" : "text-zinc-400 dark:text-zinc-500"
                            )}>
                                {item.label}
                            </span>
                            {/* Dot indicator */}
                            {isSelected && (
                                <motion.div 
                                    layoutId="bottom-nav-dot" 
                                    className="absolute -top-1 w-1.5 h-1.5 bg-primary rounded-full" 
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Quick Add Bottom Sheet Modal */}
            <QuickAddSheet isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
            <GlobalLevelUpManager />
        </div>
    );
};

// Wrapper with Providers (Just like Layout.tsx)
const MobileLayout = () => {
    return (
        <FinanceProvider>
            <SettingsProvider>
                <ProjectsProvider>
                    <MobileLayoutContent />
                </ProjectsProvider>
            </SettingsProvider>
        </FinanceProvider>
    );
};

export default MobileLayout;
