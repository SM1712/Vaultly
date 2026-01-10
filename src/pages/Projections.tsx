import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useBalance } from '../hooks/useBalance';
import { useCredits } from '../hooks/useCredits';
import { useFunds } from '../hooks/useFunds';
import { useGoals } from '../hooks/useGoals';
import { useScheduledTransactions } from '../hooks/useScheduledTransactions';
import { useSettings } from '../context/SettingsContext';
import {
    Calculator, RefreshCw, TrendingUp, TrendingDown, PiggyBank,
    Target, ToggleLeft, ToggleRight, Landmark, Plus, Trash2,
    ShoppingBag
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface SimulatedTransaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
}

const Projections = () => {
    const { transactions } = useTransactions();
    const { credits } = useCredits();
    const { funds } = useFunds();
    const { goals, getMonthlyQuota } = useGoals();
    const { scheduled } = useScheduledTransactions();
    const { currency } = useSettings();

    // 1. Current State (Real Data)
    const currentMonth = new Date();

    // Global Data for "Start Balance"
    const { availableBalance } = useBalance();
    const totalFundsReal = funds.reduce((sum, f) => sum + f.currentAmount, 0);

    // Month Data
    const currentMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date + 'T12:00:00');
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });

    const incomeMonthReal = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenseMonthReal = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Group expenses by category for budgeting
    const expensesByCategory = useMemo(() => {
        const grouped: Record<string, number> = {};
        currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
            grouped[t.category] = (grouped[t.category] || 0) + t.amount;
        });
        return grouped;
    }, [currentMonthTransactions]);

    // 2. Simulation State (The "What If")
    const [simulatedTransactions, setSimulatedTransactions] = useState<SimulatedTransaction[]>([]);

    // New Simulation Input State
    const [simDescription, setSimDescription] = useState('');
    const [simAmount, setSimAmount] = useState('');
    const [simType, setSimType] = useState<'income' | 'expense'>('expense');

    const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
    const [simulatedCreditPayments, setSimulatedCreditPayments] = useState<Set<string>>(new Set());
    const [simulatedGoalContributions, setSimulatedGoalContributions] = useState<Set<string>>(new Set());
    const [simulatedFundTransfers, setSimulatedFundTransfers] = useState<Record<string, string>>({});

    // Toggles
    const [includeGlobalBalance, setIncludeGlobalBalance] = useState(true);
    const [includeFundsInBalance, setIncludeFundsInBalance] = useState(false);
    const [autoIncludeScheduled, setAutoIncludeScheduled] = useState(true);

    // Add Simulated Transaction Handler
    const handleAddSimulation = () => {
        if (!simDescription || !simAmount) return;
        const amount = Number(simAmount);
        if (isNaN(amount) || amount <= 0) return;

        const newItem: SimulatedTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            description: simDescription,
            amount,
            type: simType
        };

        setSimulatedTransactions([...simulatedTransactions, newItem]);
        setSimDescription('');
        setSimAmount('');
        // Keep type same for rapid entry
    };

    const removeSimulation = (id: string) => {
        setSimulatedTransactions(simulatedTransactions.filter(t => t.id !== id));
    };

    // 3. Calculation Logic
    const calculateProjection = () => {
        // A. Starting Balance
        let baseBalance = 0;
        if (includeGlobalBalance) {
            // availableBalance IS the real liquid money (excluding funds/goals)
            baseBalance = availableBalance;

            if (includeFundsInBalance) {
                baseBalance += totalFundsReal;
            }
        } else {
            // If month only, we start with 0 and calculate Month Flow
            baseBalance = 0; // Net Flow mode
        }

        // B. Income (Real Month + Simulated Income + Scheduled Income)
        const simulatedIncomeTotal = simulatedTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        let scheduledIncome = 0;

        if (autoIncludeScheduled) {
            scheduled.filter(s => s.type === 'income' && s.active).forEach(s => {
                const lastProcessed = s.lastProcessedDate ? new Date(s.lastProcessedDate + 'T12:00:00') : null;
                const processedThisMonth = lastProcessed && lastProcessed.getMonth() === currentMonth.getMonth() && lastProcessed.getFullYear() === currentMonth.getFullYear();

                if (!processedThisMonth) {
                    scheduledIncome += s.amount;
                }
            });
        }

        // C. Expenses (Real Month vs Projected + Scheduled + Simulated Expenses)
        let totalProjectedExpenses = 0;
        let scheduledExpenses = 0;

        if (autoIncludeScheduled) {
            scheduled.filter(s => s.type === 'expense' && s.active).forEach(s => {
                const lastProcessed = s.lastProcessedDate ? new Date(s.lastProcessedDate + 'T12:00:00') : null;
                const processedThisMonth = lastProcessed && lastProcessed.getMonth() === currentMonth.getMonth() && lastProcessed.getFullYear() === currentMonth.getFullYear();

                if (!processedThisMonth) {
                    scheduledExpenses += s.amount;
                }
            });
        }

        // Category budgets logic
        const categoryComparisons: { category: string; real: number; projected: number; diff: number }[] = [];
        Object.keys(expensesByCategory).forEach(cat => {
            const real = expensesByCategory[cat];
            const userProjection = categoryBudgets[cat] ? Number(categoryBudgets[cat]) : real;
            const finalProjected = Math.max(real, userProjection);
            totalProjectedExpenses += finalProjected;

            categoryComparisons.push({
                category: cat,
                real,
                projected: userProjection,
                diff: finalProjected - real
            });
        });

        // Granular Simulated Expenses
        const simulatedExpenseTotal = simulatedTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);


        // D. Credit Payments (Simulated)
        let totalCreditSimulated = 0;
        credits.filter(c => c.status === 'active' && simulatedCreditPayments.has(c.id)).forEach(c => {
            const roughPayment = (c.principal * (1 + (c.interestRate / 100))) / c.term;
            totalCreditSimulated += roughPayment;
        });

        // E. Goal Contributions (Simulated)
        let totalGoalSimulated = 0;
        goals.filter(g => simulatedGoalContributions.has(g.id)).forEach(g => {
            const quota = getMonthlyQuota(g);
            totalGoalSimulated += quota;
        });

        // F. Fund Transfers (Simulated)
        let totalFundSimulated = 0;
        Object.values(simulatedFundTransfers).forEach(val => {
            totalFundSimulated += Number(val) || 0;
        });

        // G. Final Balance
        // If Base Balance (Global) is used, it already factors in Real Income and Real Expenses (Current).
        // So we only add/subtract FUTURE/SIMULATED deltas.

        // Income Delta = Simulated Income + Scheduled Income
        // Expense Delta = (Projected Category Expense - Real Category Expense) + Scheduled Expenses + Simulated Expenses + Goals + Funds + Credits

        const additionalCategoryExpense = totalProjectedExpenses - expenseMonthReal;

        const finalBalance = includeGlobalBalance
            ? (baseBalance
                + simulatedIncomeTotal
                + scheduledIncome
                - additionalCategoryExpense
                - scheduledExpenses
                - simulatedExpenseTotal
                - totalCreditSimulated
                - totalGoalSimulated
                - totalFundSimulated)
            : ((incomeMonthReal + simulatedIncomeTotal + scheduledIncome)
                - (expenseMonthReal + additionalCategoryExpense + scheduledExpenses + simulatedExpenseTotal + totalCreditSimulated + totalGoalSimulated + totalFundSimulated));

        return {
            baseBalance,
            incomeMonthReal,
            simulatedIncomeTotal,
            scheduledIncome,
            expenseMonthReal,
            totalProjectedExpenses,
            simulatedExpenseTotal,
            scheduledExpenses,
            totalCreditSimulated,
            totalGoalSimulated,
            totalFundSimulated,
            finalBalance,
            categoryComparisons
        };
    };

    const projection = calculateProjection();

    const toggleCreditSimulation = (id: string) => {
        const newSet = new Set(simulatedCreditPayments);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSimulatedCreditPayments(newSet);
    };

    const toggleGoalSimulation = (id: string) => {
        const newSet = new Set(simulatedGoalContributions);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSimulatedGoalContributions(newSet);
    };

    return (
        <div className="p-6 space-y-8 pb-32">
            <div>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <Calculator size={32} className="text-emerald-500" />
                    Sala de Proyecciones
                </h1>
                <p className="text-zinc-500 mt-2">Simula ingresos y gastos del futuro. Agrega el pan de mañana o la combi de pasado.</p>
            </div>

            {/* 0. CONTROLS */}
            <div className="flex flex-wrap gap-4 bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl md:items-center">
                <button
                    onClick={() => setIncludeGlobalBalance(!includeGlobalBalance)}
                    className={clsx("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all", includeGlobalBalance ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-white text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600")}
                >
                    {includeGlobalBalance ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {includeGlobalBalance ? "Incluyendo Saldo Actual" : "Solo Flujo del Mes"}
                </button>

                <button
                    onClick={() => {
                        if (!includeGlobalBalance) setIncludeGlobalBalance(true);
                        setIncludeFundsInBalance(!includeFundsInBalance);
                    }}
                    className={clsx("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all", includeFundsInBalance ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-white text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600")}
                >
                    {includeFundsInBalance ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    Incluir Ahorros (Fondos)
                </button>

                <button
                    onClick={() => setAutoIncludeScheduled(!autoIncludeScheduled)}
                    className={clsx("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all", autoIncludeScheduled ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-white text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600")}
                >
                    {autoIncludeScheduled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    Auto-sumar Programados
                </button>
            </div>

            {/* 1. TOP CARDS: REAL VS PROJECTED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {includeGlobalBalance ? "Saldo Disponible Real (Hoy)" : "Flujo Real del Mes (Hoy)"}
                    </h2>
                    <div className="flex items-end gap-2">
                        <p className={clsx("text-4xl font-black", projection.baseBalance >= 0 ? "text-zinc-900 dark:text-white" : "text-rose-500")}>
                            {currency}{projection.baseBalance.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className={clsx(
                    "p-6 rounded-3xl shadow-xl border transition-colors",
                    projection.finalBalance >= 0
                        ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800"
                )}>
                    <h2 className={clsx("text-sm font-bold uppercase tracking-wider mb-2", projection.finalBalance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
                        Saldo Final Proyectado
                    </h2>
                    <p className={clsx("text-4xl font-black", projection.finalBalance >= 0 ? "text-emerald-900 dark:text-emerald-100" : "text-rose-900 dark:text-rose-100")}>
                        {currency}{projection.finalBalance.toFixed(2)}
                    </p>
                    <p className="text-xs mt-2 opacity-80">
                        {projection.finalBalance >= 0 ? "¡Superávit estimado al fin de mes!" : "¡Déficit estimado! Revisa tus gastos."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. GRANULAR SIMULATIONS (NEW) */}
                <div className="lg:col-span-1 space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag size={20} className="text-purple-500" /> Simulador de Diario</h3>

                    {/* Add Simulation Form */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">¿Qué quieres simular?</label>
                            <input
                                type="text"
                                placeholder="Ej. Pan, Combi, Cachuelo..."
                                className="w-full bg-zinc-50 dark:bg-zinc-950 px-4 py-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500/20"
                                value={simDescription}
                                onChange={e => setSimDescription(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSimulation()}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase">Monto</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{currency}</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 pl-8 pr-4 py-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500/20"
                                        value={simAmount}
                                        onChange={e => setSimAmount(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSimulation()}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase">Tipo</label>
                                <div className="flex bg-zinc-50 dark:bg-zinc-950 rounded-xl p-1">
                                    <button
                                        onClick={() => setSimType('expense')}
                                        className={clsx("flex-1 rounded-lg text-xs font-bold py-1.5 transition-all text-center", simType === 'expense' ? "bg-rose-500 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                                    >
                                        Gasto
                                    </button>
                                    <button
                                        onClick={() => setSimType('income')}
                                        className={clsx("flex-1 rounded-lg text-xs font-bold py-1.5 transition-all text-center", simType === 'income' ? "bg-emerald-500 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800")}
                                    >
                                        Ingreso
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleAddSimulation}
                            className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Agregar
                        </button>
                    </div>

                    {/* Simulation List */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        {simulatedTransactions.length === 0 ? (
                            <div className="p-8 text-center text-zinc-400 text-sm italic">
                                No has agregado simulaciones aún.
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
                                {simulatedTransactions.map(item => (
                                    <div key={item.id} className="p-3 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", item.type === 'income' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-100 text-rose-600 dark:bg-rose-900/20")}>
                                                {item.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">{item.description}</p>
                                                <p className="text-xs text-zinc-400 capitalize">{item.type === 'income' ? 'Ingreso' : 'Gasto'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={clsx("font-mono font-bold text-sm", item.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                                {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => removeSimulation(item.id)}
                                                className="text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {simulatedTransactions.length > 0 && (
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs font-bold uppercase text-zinc-500">
                                <span>Total Simulado</span>
                                <span className={clsx(
                                    (projection.simulatedIncomeTotal - projection.simulatedExpenseTotal) >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {currency}{(projection.simulatedIncomeTotal - projection.simulatedExpenseTotal).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    <h3 className="font-bold text-lg flex items-center gap-2 mt-8"><PiggyBank size={20} className="text-amber-500" /> Fondos (Simulados)</h3>
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                        {funds.map(fund => (
                            <div key={fund.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 text-xs">
                                    {fund.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">{fund.name}</p>
                                    <p className="text-xs text-zinc-500">Actual: {currency}{fund.currentAmount}</p>
                                </div>
                                <div className="w-24 relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{currency}</span>
                                    <input
                                        type="number"
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 rounded-lg pl-5 pr-2 py-1 text-sm text-right outline-none border border-transparent focus:border-emerald-500"
                                        placeholder="0"
                                        value={simulatedFundTransfers[fund.id] || ''}
                                        onChange={e => setSimulatedFundTransfers({ ...simulatedFundTransfers, [fund.id]: e.target.value })}
                                    />
                                </div>
                            </div>
                        ))}
                        {funds.length === 0 && <p className="text-sm text-zinc-400 italic">No tienes fondos creados.</p>}
                    </div>

                </div>

                {/* 3. EXPENSE BUDGETING column */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2"><TrendingDown size={20} className="text-rose-500" /> Presupuesto y Categorías</h3>

                    {autoIncludeScheduled && projection.scheduledExpenses > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex justify-between items-center px-4">
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Gastos Programados Pendientes (Auto)</span>
                            <span className="font-black text-blue-700 dark:text-blue-300">{currency}{projection.scheduledExpenses}</span>
                        </div>
                    )}

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="grid grid-cols-12 gap-2 p-4 bg-zinc-50 dark:bg-zinc-950/50 text-xs font-bold text-zinc-400 uppercase">
                            <div className="col-span-4">Categoría</div>
                            <div className="col-span-3 text-right">Gastado Real</div>
                            <div className="col-span-3 text-right">Proyección Total</div>
                            <div className="col-span-2 text-right">Disp.</div>
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {projection.categoryComparisons.map((item) => (
                                <div key={item.category} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="col-span-4 font-bold text-sm truncate" title={item.category}>{item.category}</div>
                                    <div className="col-span-3 text-right text-sm text-zinc-500">{currency}{item.real}</div>
                                    <div className="col-span-3 relative">
                                        <input
                                            type="number"
                                            className={clsx(
                                                "w-full text-right bg-transparent border-b border-zinc-200 dark:border-zinc-700 py-1 text-sm font-bold focus:border-emerald-500 outline-none transition-colors",
                                                (Number(categoryBudgets[item.category]) || 0) < item.real && categoryBudgets[item.category] ? "text-rose-500 border-rose-200" : "text-zinc-900 dark:text-white"
                                            )}
                                            placeholder={item.real.toString()}
                                            value={categoryBudgets[item.category] || ''}
                                            onChange={e => setCategoryBudgets({ ...categoryBudgets, [item.category]: e.target.value })}
                                        />
                                    </div>
                                    <div className={clsx("col-span-2 text-right text-xs font-bold", item.diff > 0 ? "text-emerald-500" : "text-zinc-300")}>
                                        {currency}{Math.max(0, item.diff)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VIRTUAL CREDIT & GOALS PAYMENTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-100 dark:bg-zinc-900/50 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                            <h4 className="font-bold text-sm mb-4 text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Landmark size={14} /> Simular Créditos</h4>
                            <div className="flex flex-wrap gap-3">
                                {credits.filter(c => c.status === 'active').map(c => {
                                    const roughPayment = (c.principal * (1 + (c.interestRate / 100))) / c.term;
                                    const isSelected = simulatedCreditPayments.has(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => toggleCreditSimulation(c.id)}
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2",
                                                isSelected
                                                    ? "bg-rose-100 border-rose-500 text-rose-700 dark:bg-rose-900/30 dark:border-rose-500 dark:text-rose-200"
                                                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700"
                                            )}
                                        >
                                            <div className={clsx("w-4 h-4 rounded-full border flex items-center justify-center", isSelected ? "border-rose-600 bg-rose-600" : "border-zinc-400")}>
                                                {isSelected && <CheckIcon size={10} className="text-white" />}
                                            </div>
                                            {c.name} ({currency}{roughPayment.toFixed(0)})
                                        </button>
                                    );
                                })}
                                {credits.filter(c => c.status === 'active').length === 0 && (
                                    <p className="text-sm text-zinc-400">No tienes créditos activos.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-zinc-100 dark:bg-zinc-900/50 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                            <h4 className="font-bold text-sm mb-4 text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Target size={14} /> Simular Metas</h4>
                            <div className="flex flex-wrap gap-3">
                                {goals.map(g => {
                                    // if isGoalPaidThisMonth(g) ... maybe hide? No, let them simulate anyway.
                                    const monthlyQuota = getMonthlyQuota(g);
                                    const isSelected = simulatedGoalContributions.has(g.id);

                                    return (
                                        <button
                                            key={g.id}
                                            onClick={() => toggleGoalSimulation(g.id)}
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2",
                                                isSelected
                                                    ? "bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-500 dark:text-purple-200"
                                                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700"
                                            )}
                                        >
                                            <div className={clsx("w-4 h-4 rounded-full border flex items-center justify-center", isSelected ? "border-purple-600 bg-purple-600" : "border-zinc-400")}>
                                                {isSelected && <CheckIcon size={10} className="text-white" />}
                                            </div>
                                            {g.name} ({currency}{monthlyQuota.toFixed(0)})
                                        </button>
                                    );
                                })}
                                {goals.length === 0 && (
                                    <p className="text-sm text-zinc-400">No tienes metas activas.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button
                    onClick={() => {
                        setSimulatedTransactions([]);
                        setCategoryBudgets({});
                        setSimulatedCreditPayments(new Set());
                        setSimulatedGoalContributions(new Set());
                        setSimulatedFundTransfers({});
                        toast.success('Simulación reiniciada');
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 active:scale-95 transition-all shadow-xl"
                >
                    <RefreshCw size={20} />
                    Reiniciar Simulación
                </button>
            </div>
        </div>
    );
};

// Start Icon helper
const CheckIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default Projections;
