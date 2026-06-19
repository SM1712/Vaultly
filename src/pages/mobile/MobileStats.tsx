import { useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, TrendingDown, Sparkles, AlertTriangle, 
    DollarSign, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useProjections } from '../../hooks/useProjections';
import { useBalance } from '../../hooks/useBalance';
import { useSettings } from '../../context/SettingsContext';
import { useFinance } from '../../context/FinanceContext';
import { clsx } from 'clsx';
import { ArtNumber } from '../../components/ui/ArtNumber';

const MobileStats = () => {
    const { transactions } = useTransactions();
    const { projections } = useProjections();
    const { availableBalance, getBalanceAtDate } = useBalance();
    const { currency, spendingLimits } = useSettings();
    const { selectedDate } = useFinance();

    // Current Month Metrics
    const currentMonthData = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;

        const currentMonthTxs = transactions.filter(t => {
            const [y, m] = t.date.split('-').map(Number);
            return y === year && m === month;
        });

        const income = currentMonthTxs
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = currentMonthTxs
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const savings = Math.max(0, income - expenses);

        // Group by category for expenses
        const categoryMap: Record<string, number> = {};
        currentMonthTxs
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = t.category || 'Otros';
                categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
            });

        const sortedCategories = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return {
            income,
            expenses,
            savings,
            categories: sortedCategories,
            totalTxs: currentMonthTxs.length
        };
    }, [transactions, selectedDate]);

    // Trend Data for Last 6 Months
    const trendData = useMemo(() => {
        const list = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const y = date.getFullYear();
            const m = date.getMonth() + 1;

            const monthTxs = transactions.filter(t => {
                const [txY, txM] = t.date.split('-').map(Number);
                return txY === y && txM === m;
            });

            const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

            list.push({
                name: date.toLocaleString('es-ES', { month: 'short' }),
                Ingresos: income,
                Gastos: expenses
            });
        }
        return list;
    }, [transactions]);

    // Category Budgets vs Current Spending
    const activeBudgets = useMemo(() => {
        const categoriesLimits = spendingLimits?.categories || {};
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;

        const monthlyExpenses = transactions.filter(t => {
            const [y, m] = t.date.split('-').map(Number);
            return y === year && m === month && t.type === 'expense';
        });

        return Object.entries(categoriesLimits).map(([category, limit]) => {
            const spent = monthlyExpenses
                .filter(t => t.category === category)
                .reduce((sum, t) => sum + t.amount, 0);

            const percent = limit > 0 ? (spent / limit) * 100 : 0;

            return {
                category,
                limit,
                spent,
                percent
            };
        }).filter(b => b.limit > 0);
    }, [spendingLimits, transactions, selectedDate]);

    // Simple Savings Projection (1, 3, 6 months)
    const projectionsSummary = useMemo(() => {
        // Calculate average savings rate over the last 3 months
        const today = new Date();
        let totalMonthlySavings = 0;
        let monthsWithData = 0;

        for (let i = 0; i < 3; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;

            const mTxs = transactions.filter(t => {
                const [txY, txM] = t.date.split('-').map(Number);
                return txY === y && txM === m;
            });

            if (mTxs.length > 0) {
                const inc = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const exp = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                totalMonthlySavings += (inc - exp);
                monthsWithData++;
            }
        }

        const averageSavings = monthsWithData > 0 ? totalMonthlySavings / monthsWithData : 200; // Default to $200 if new user

        return {
            averageSavings,
            proj1m: availableBalance + averageSavings,
            proj3m: availableBalance + (averageSavings * 3),
            proj6m: availableBalance + (averageSavings * 6)
        };
    }, [transactions, availableBalance]);

    const totalExpenseSum = currentMonthData.expenses || 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Reporte Visual</span>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Estadísticas 📈</h1>
            </div>

            {/* Current Month Summary Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase">
                        <TrendingUp size={14} /> Ingresos
                    </div>
                    <p className="text-xl font-black text-zinc-800 dark:text-zinc-200">
                        <ArtNumber value={currentMonthData.income} symbol={currency} />
                    </p>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase">
                        <TrendingDown size={14} /> Gastos
                    </div>
                    <p className="text-xl font-black text-zinc-800 dark:text-zinc-200">
                        <ArtNumber value={currentMonthData.expenses} symbol={currency} />
                    </p>
                </div>
            </div>

            {/* Income vs Expense Graph */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-3">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tendencia (Últimos 6 meses)</h3>
                <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                            <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Progress Bars */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-3">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Distribución de Gastos</h3>
                {currentMonthData.categories.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4">No hay gastos registrados este mes.</p>
                ) : (
                    <div className="space-y-3">
                        {currentMonthData.categories.slice(0, 5).map(cat => {
                            const percent = (cat.value / totalExpenseSum) * 100;
                            return (
                                <div key={cat.name} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        <span>{cat.name}</span>
                                        <span><ArtNumber value={cat.value} symbol={currency} /> ({percent.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary rounded-full" 
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Budget Limits Check */}
            {activeBudgets.length > 0 && (
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Límites de Presupuestos</h3>
                    <div className="space-y-3">
                        {activeBudgets.map(b => (
                            <div key={b.category} className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-zinc-700 dark:text-zinc-300">{b.category}</span>
                                    <span className="text-[11px] text-zinc-500">
                                        <ArtNumber value={b.spent} symbol={currency} /> / <ArtNumber value={b.limit} symbol={currency} />
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className={clsx(
                                            "h-full rounded-full",
                                            b.percent >= 100 ? "bg-rose-500 animate-pulse" : b.percent >= 80 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${Math.min(100, b.percent)}%` }}
                                    />
                                </div>
                                {b.percent >= 100 && (
                                    <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1">
                                        <AlertTriangle size={10} /> Presupuesto excedido
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Interactive Projections Cards */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-sm space-y-4">
                <div>
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Proyección de Patrimonio</h3>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Basado en tu ahorro mensual promedio de <ArtNumber value={projectionsSummary.averageSavings} symbol={currency} maximumFractionDigits={0} /></p>
                </div>

                <div className="space-y-2.5">
                    {[
                        { time: 'En 1 Mes', val: projectionsSummary.proj1m, text: 'Corto plazo estable' },
                        { time: 'En 3 Meses', val: projectionsSummary.proj3m, text: 'Consolidación de ahorros' },
                        { time: 'En 6 Meses', val: projectionsSummary.proj6m, text: 'Salto patrimonial' }
                    ].map((proj, i) => (
                        <div 
                            key={i}
                            className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-850 rounded-2xl"
                        >
                            <div>
                                <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 block">{proj.time}</span>
                                <span className="text-[9px] text-zinc-400 font-bold">{proj.text}</span>
                            </div>
                            <div className="text-right flex items-center gap-1">
                                <span className="text-xs font-black text-primary">
                                    <ArtNumber value={proj.val} symbol={currency} maximumFractionDigits={0} />
                                </span>
                                <ChevronRight size={12} className="text-zinc-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileStats;
