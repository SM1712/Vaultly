import { useTransactions } from '../hooks/useTransactions';
import { Wallet, TrendingUp, TrendingDown, Target, BookOpen } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import { useFunds } from '../hooks/useFunds'; // IMPORT ADDED
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import MonthSelector from '../components/MonthSelector';
import SavingsListModal from '../components/finance/SavingsListModal';
import LedgerModal from '../components/finance/LedgerModal';
import { useState } from 'react';

const Dashboard = () => {
    const { selectedDate } = useFinance();
    const { transactions, allTransactions } = useTransactions();
    const { goals, getTotalSavingsAtDate, isGoalPaidThisMonth, getMonthlyQuota, getMonthsRemaining } = useGoals();
    const { funds } = useFunds(); // USE FUNDS
    const { currency } = useSettings();

    // Modals state
    const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

    // Filter transactions by selected month
    const currentMonthTransactions = transactions.filter(t => {

        const [year, month] = t.date.split('-').map(Number);
        return month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();
    });

    const totalIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Calcular total ahorrado en metas (Histórico basado en fecha seleccionada)
    const goalsSaved = getTotalSavingsAtDate(selectedDate);
    const fundsSaved = funds.reduce((acc, f) => acc + f.currentAmount, 0);
    const totalSaved = goalsSaved + fundsSaved;

    const getMonthlyStatus = (goal: any) => {
        const isPaid = isGoalPaidThisMonth(goal);
        const monthlyAmount = getMonthlyQuota(goal);

        if (isPaid) {
            return (
                <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full">
                        Pagado
                    </span>
                    <p className="text-xs text-zinc-400 mt-0.5">Mes Completado</p>
                </div>
            );
        }
        return (
            <div className="text-right">
                <p className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300">${monthlyAmount.toFixed(2)}</p>
                <p className="text-[10px] text-rose-500 uppercase tracking-wider font-bold">Pendiente</p>
            </div>
        );
    };



    const globalIncome = allTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const globalExpenses = allTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const availableBalance = (globalIncome - globalExpenses) - totalSaved;

    const cards = [
        {
            label: 'Saldo Disponible',
            amount: availableBalance,
            icon: Wallet,
            color: 'text-zinc-900 dark:text-zinc-100',
            bg: 'bg-white dark:bg-zinc-900',
            border: 'border-zinc-200 dark:border-zinc-800'
        },
        {
            label: 'Ahorro Total',
            amount: totalSaved,
            icon: Target,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-900/30'
        },
        {
            label: 'Ingresos',
            amount: totalIncome,
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            border: 'border-emerald-200 dark:border-emerald-900/30'
        },
        {
            label: 'Gastos',
            amount: totalExpenses,
            icon: TrendingDown,
            color: 'text-rose-500',
            bg: 'bg-rose-50 dark:bg-rose-950/20',
            border: 'border-rose-200 dark:border-rose-900/30'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Panel de Control</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Resumen financiero general</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsLedgerModalOpen(true)}
                        className="p-3 md:p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl md:rounded-lg text-zinc-500 md:hover:text-emerald-600 md:dark:hover:text-emerald-400 md:hover:border-emerald-200 md:dark:hover:border-emerald-900 active:scale-95 transition-all shadow-sm"
                        title="Ver Libro Contable"
                    >
                        <BookOpen size={20} />
                    </button>
                    <MonthSelector />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        onClick={() => {
                            if (card.label === 'Ahorro Total') setIsSavingsModalOpen(true);
                        }}
                        className={`${card.bg} border ${card.border} p-6 rounded-3xl transition-all md:hover:scale-[1.02] md:hover:shadow-lg md:hover:shadow-zinc-200/50 md:dark:hover:shadow-zinc-900/50 active:scale-[0.98] ${card.label === 'Ahorro Total' ? 'cursor-pointer ring-offset-2 md:hover:ring-2 ring-emerald-500/50' : ''
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                                {card.label}
                                {card.label === 'Ahorro Total' && <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold ml-1">GESTIONAR</span>}
                            </h3>
                            <card.icon size={20} className={card.color} />
                        </div>
                        <p className={`text-3xl font-mono font-bold ${card.color}`}>
                            {currency}{card.amount.toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Metas Widget */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm dark:shadow-none">
                <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 mb-6 flex items-center gap-2">
                    <Target size={20} className="text-emerald-500" />
                    Metas en Curso
                </h3>
                {goals.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No tienes metas activas. ¡Crea una para empezar a ahorrar!</p>
                ) : (
                    <div className="space-y-4">
                        {goals.slice(0, 3).map(goal => (
                            <div key={goal.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-900 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{goal.name}</p>
                                        <p className="text-xs text-zinc-500">{getMonthsRemaining(goal)} meses restantes</p>
                                    </div>
                                </div>
                                {getMonthlyStatus(goal)}
                            </div>
                        ))}
                        {goals.length > 3 && (
                            <p className="text-center text-xs text-zinc-500 mt-2">
                                +{goals.length - 3} metas más...
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center">
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-3">Bienvenido a Vaultly</h3>
                <p className="text-zinc-600 dark:text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Gestiona tus finanzas con precisión. Navega a los espacios de
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium"> Ingresos</span> y
                    <span className="text-rose-600 dark:text-rose-400 font-medium"> Gastos</span> para comenzar tu registro.
                </p>
            </div>
            <SavingsListModal
                isOpen={isSavingsModalOpen}
                onClose={() => setIsSavingsModalOpen(false)}
            />

            <LedgerModal
                isOpen={isLedgerModalOpen}
                onClose={() => setIsLedgerModalOpen(false)}
            />
        </div >
    );
};

export default Dashboard;
