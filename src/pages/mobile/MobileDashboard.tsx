import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Clock, AlertTriangle, Sparkles, 
    ChevronRight, ArrowDownLeft, ArrowUpRight, Compass, Zap,
    Landmark, Award
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useScheduledTransactions } from '../../hooks/useScheduledTransactions';
import { useGoals } from '../../hooks/useGoals';
import { useFunds } from '../../hooks/useFunds';
import { useCredits } from '../../hooks/useCredits';
import { useBalance } from '../../hooks/useBalance';
import { useSettings } from '../../context/SettingsContext';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { useCollaboration } from '../../context/CollaborationContext';
import { clsx } from 'clsx';
import { ArtNumber } from '../../components/ui/ArtNumber';

// Local helper to calculate days until the next credit payment
const getDaysToNextPayment = (startDateStr: string) => {
    try {
        const parts = startDateStr.split('-');
        if (parts.length !== 3) return 30;
        const payDay = parseInt(parts[2], 10);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let nextPayDate = new Date(today.getFullYear(), today.getMonth(), payDay);
        if (nextPayDate < today) {
            nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
        }
        
        const diffTime = nextPayDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch (e) {
        return 30;
    }
};

// Front Card Component (Frosted pearlescent style with dynamic contrast)
const CardFront = ({ currency, netWorth, collabProfile, user }: any) => {
    return (
        <>
            {/* Aurora Accent Elements for the pearlescent feel */}
            <div 
                className="absolute -top-16 -right-16 w-44 h-44 rounded-full pointer-events-none opacity-30 dark:opacity-40" 
                style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)' }} 
            />
            <div 
                className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full pointer-events-none opacity-30 dark:opacity-45"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)' }} 
            />

            <div className="flex justify-between items-start z-10 w-full">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-zinc-500 dark:text-zinc-400">
                        Patrimonio Neto
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                        <ArtNumber value={netWorth} symbol={currency} />
                    </h2>
                </div>
                <Sparkles size={20} className="text-primary dark:text-indigo-400 animate-pulse" />
            </div>

            <div className="flex justify-between items-end z-10 w-full">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Titular
                    </p>
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                        {collabProfile?.nickname || user?.displayName || 'Vaultly User'}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-wider block text-zinc-400 dark:text-zinc-500">Ver Detalle</span>
                    <span className="text-xs font-bold bg-zinc-900/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-900/5 dark:border-white/5 px-2.5 py-0.5 rounded-full">Tap ↺</span>
                </div>
            </div>
        </>
    );
};

// Back Card Component (Frosted style with custom contrast text colors)
const CardBack = ({ currency, availableBalance, totalSavings, totalDebts }: any) => {
    return (
        <>
            <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-zinc-850 pb-2 w-full z-10">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Desglose de Fondos</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">Tap para Volver</span>
            </div>

            <div className="space-y-2.5 my-auto w-full z-10">
                {/* Available Balance */}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-650 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Disponible
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-450">
                        <ArtNumber value={availableBalance} symbol={currency} />
                    </span>
                </div>

                {/* Savings */}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-650 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Ahorros + Fondos
                    </span>
                    <span className="text-sm font-black text-sky-600 dark:text-sky-450">
                        <ArtNumber value={totalSavings} symbol={currency} />
                    </span>
                </div>

                {/* Debts */}
                <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-650 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Deudas Activas
                    </span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-450">
                        <ArtNumber value={-totalDebts} symbol={currency} />
                    </span>
                </div>
            </div>

            <div className="text-[9px] text-zinc-450 dark:text-zinc-600 text-center font-bold w-full z-10">
                Vaultly Secure Asset Ledger
            </div>
        </>
    );
};

const MobileDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile: collabProfile } = useCollaboration();
    const { currency, spendingLimits } = useSettings();
    const { availableBalance } = useBalance();
    
    const { transactions } = useTransactions();
    const { goals, getTotalSavingsAtDate } = useGoals();
    const { funds } = useFunds();
    const { scheduled } = useScheduledTransactions();
    const { credits, getCreditStatus } = useCredits();
    const { profile: gameProfile } = useGamification();

    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // Dynamic Greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Buenos días!';
        if (hour < 18) return '¡Buenas tardes!';
        return '¡Buenas noches!';
    }, []);

    // Total Savings
    const totalSavings = useMemo(() => {
        const goalsSaved = getTotalSavingsAtDate(new Date());
        const fundsSaved = funds.reduce((acc, f) => acc + f.currentAmount, 0);
        return goalsSaved + fundsSaved;
    }, [getTotalSavingsAtDate, funds]);

    // Active Debts
    const totalDebts = useMemo(() => {
        const activeCredits = credits.filter(c => c.status === 'active');
        return activeCredits.reduce((acc, c) => {
            const status = getCreditStatus(c, new Date());
            return acc + status.remainingBalance;
        }, 0);
    }, [credits, getCreditStatus]);

    // Net Worth = Balance + Savings - Debts
    const netWorth = useMemo(() => {
        return availableBalance + totalSavings - totalDebts;
    }, [availableBalance, totalSavings, totalDebts]);

    // Recent Transactions (Last 5)
    const recentTransactions = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [transactions]);

    // Alerts Center
    const activeAlerts = useMemo(() => {
        const list = [];
        
        // 1. Check active scheduled transactions that haven't been processed this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        scheduled.filter(s => s.active).forEach(s => {
            const lastProcessed = s.lastProcessedDate ? new Date(s.lastProcessedDate + 'T12:00:00') : null;
            const processedThisMonth = lastProcessed && lastProcessed.getMonth() === currentMonth && lastProcessed.getFullYear() === currentYear;

            if (!processedThisMonth) {
                list.push({
                    id: `sched-${s.id}`,
                    type: 'warning',
                    text: `Pago programado: ${s.description}`,
                    desc: `${currency}${s.amount} - Día ${s.dayOfMonth} de cada mes`
                });
            }
        });

        // 2. Check low balance
        if (availableBalance < 50) {
            list.push({
                id: 'low-balance',
                type: 'danger',
                text: 'Balance disponible muy bajo',
                desc: `Solo tienes ${currency}${availableBalance.toLocaleString()} en tu billetera.`
            });
        }

        // 3. Credits upcoming
        credits.filter(c => c.status === 'active').forEach(c => {
            const status = getCreditStatus(c, new Date());
            const daysToPayment = getDaysToNextPayment(c.startDate);
            if (daysToPayment <= 3) {
                list.push({
                    id: `cred-${c.id}`,
                    type: 'info',
                    text: `Próximo pago: ${c.name}`,
                    desc: `Vence en ${daysToPayment} días (${currency}${status.quota.toFixed(0)})`
                });
            }
        });

        // 4. Budget limits exceeded
        Object.entries(spendingLimits?.categories || {}).forEach(([cat, limit]) => {
            const monthlyExpenses = transactions.filter(t => {
                const [y, m] = t.date.split('-').map(Number);
                return y === currentYear && m === (currentMonth + 1) && t.type === 'expense' && t.category === cat;
            });
            const spent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
            if (limit > 0 && spent > limit) {
                list.push({
                    id: `limit-${cat}`,
                    type: 'danger',
                    text: `Límite Excedido: ${cat}`,
                    desc: `Gastado: ${currency}${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / Límite: ${currency}${limit.toLocaleString()}`
                });
            }
        });

        return list.slice(0, 2); // Limit to top 2 for mobile layout cleanliness
    }, [scheduled, credits, getCreditStatus, availableBalance, currency, spendingLimits, transactions]);

    // Level percent for progress bar
    const levelPercent = useMemo(() => {
        if (!gameProfile?.nextLevelXP) return 0;
        return Math.min(100, (gameProfile.currentXP / gameProfile.nextLevelXP) * 100);
    }, [gameProfile]);

    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                        {greeting}
                    </span>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 bg-clip-text text-transparent">
                        {collabProfile?.nickname || user?.displayName || 'Financista'} 👋
                    </h1>
                </div>
                {/* Level Tag */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black">
                    <Zap size={14} className="fill-current" />
                    <span>NV. {gameProfile?.level || 1}</span>
                </div>
            </div>

            {/* Pearlescent Card with AnimatePresence to ensure pixel-perfect text resolution */}
            <div className="w-full h-48">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isCardFlipped ? 'back' : 'front'}
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className={clsx(
                            "w-full h-full rounded-3xl p-6 flex flex-col justify-between shadow-xl border relative overflow-hidden select-none cursor-pointer",
                            "bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border-zinc-200/50 dark:border-white/5"
                        )}
                        style={{
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            transformStyle: 'flat'
                        }}
                        onClick={() => { triggerHaptic(); setIsCardFlipped(!isCardFlipped); }}
                    >
                        {isCardFlipped ? (
                            <CardBack 
                                currency={currency} 
                                availableBalance={availableBalance} 
                                totalSavings={totalSavings} 
                                totalDebts={totalDebts} 
                            />
                        ) : (
                            <CardFront 
                                currency={currency} 
                                netWorth={netWorth} 
                                collabProfile={collabProfile} 
                                user={user} 
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Quick Actions Shortcuts Grid */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Historial', icon: TrendingUp, path: '/m/transactions', color: 'bg-emerald-500/10 text-emerald-500' },
                    { label: 'Ahorros', icon: Sparkles, path: '/m/savings', color: 'bg-sky-500/10 text-sky-500' },
                    { label: 'Créditos', icon: Landmark, path: '/m/credits', color: 'bg-indigo-500/10 text-indigo-500' },
                    { label: 'Ajustes', icon: Award, path: '/m/settings', color: 'bg-purple-500/10 text-purple-500' }
                ].map((act, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(act.path)}
                        className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl shadow-sm active:scale-95 transition-transform"
                    >
                        <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center", act.color)}>
                            <act.icon size={18} />
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 truncate w-full text-center">
                            {act.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Alert Center */}
            {activeAlerts.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Notificaciones Críticas</p>
                    {activeAlerts.map(alert => (
                        <div 
                            key={alert.id}
                            className={clsx(
                                "flex items-start gap-3 p-3.5 rounded-2xl border shadow-sm",
                                alert.type === 'danger' && "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-400",
                                alert.type === 'warning' && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-400",
                                alert.type === 'info' && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-400"
                            )}
                        >
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-black leading-none mb-1">{alert.text}</h4>
                                <p className="text-[10px] opacity-80 leading-normal">{alert.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Activity List */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Actividad Reciente</p>
                    <button 
                        onClick={() => navigate('/m/transactions')}
                        className="text-xs font-bold text-primary flex items-center gap-0.5 active:opacity-75"
                    >
                        Ver todo <ChevronRight size={14} />
                    </button>
                </div>

                <div className="space-y-2">
                    {recentTransactions.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                            No hay transacciones registradas este mes.
                        </div>
                    ) : (
                        recentTransactions.map(tx => {
                            const isExpense = tx.type === 'expense';
                            return (
                                <div
                                    key={tx.id}
                                    className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900/40 rounded-2xl shadow-sm"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={clsx(
                                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                                            isExpense ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500"
                                        )}>
                                            {isExpense ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate pr-2">
                                                {tx.description}
                                            </h4>
                                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                {tx.category} • {tx.date}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        "text-xs font-black shrink-0",
                                        isExpense ? "text-rose-500" : "text-emerald-500"
                                    )}>
                                        {!isExpense && <span className="mr-0.5 font-bold">+</span>}
                                        <ArtNumber value={isExpense ? -tx.amount : tx.amount} symbol={currency} />
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Gamification Senda Card */}
            <div 
                onClick={() => { triggerHaptic(); navigate('/m/gamification'); }}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full filter blur-md" />
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                            <Compass size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black">La Senda Financiera</h4>
                            <p className="text-[9px] text-zinc-400">Ver Bóveda Celestial y Misiones</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 text-primary text-[10px] font-black">
                        LVL {gameProfile?.level || 1}
                    </div>
                </div>

                {/* Sub levels dots indicators */}
                <div className="grid grid-cols-3 gap-2 pt-1.5 relative z-10">
                    {/* Saving (emerald) */}
                    <div className="flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-2 py-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[8px] font-black text-zinc-650 dark:text-zinc-400 uppercase">AH: Lvl {gameProfile?.savingLevel || 1}</span>
                    </div>
                    {/* Discipline (indigo) */}
                    <div className="flex items-center gap-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-2 py-1">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        <span className="text-[8px] font-black text-zinc-650 dark:text-zinc-400 uppercase">DI: Lvl {gameProfile?.disciplineLevel || 1}</span>
                    </div>
                    {/* Growth (amber) */}
                    <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl px-2 py-1">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        <span className="text-[8px] font-black text-zinc-650 dark:text-zinc-400 uppercase">CR: Lvl {gameProfile?.growthLevel || 1}</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="relative w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${levelPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute top-0 bottom-0 left-0 bg-primary rounded-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default MobileDashboard;
