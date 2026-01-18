import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../context/SettingsContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Calendar } from 'lucide-react';
import { clsx } from 'clsx';


const Reports = () => {
    const { transactions } = useTransactions();
    const { currency } = useSettings();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- Data Processing ---

    // 1. Get available years from transactions
    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        years.add(new Date().getFullYear()); // Ensure current year is always available
        return Array.from(years).sort((a, b) => b - a); // Descending
    }, [transactions]);

    // 2. Filter transactions by selected year
    const yearTransactions = useMemo(() => {
        return transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
    }, [transactions, selectedYear]);

    // 3. Aggregate Monthly Data (Income vs Expense)
    const monthlyData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(selectedYear, i, 1).toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
            fullMonthName: new Date(selectedYear, i, 1).toLocaleString('es-ES', { month: 'long' }),
            income: 0,
            expense: 0,
            savings: 0,
            monthIndex: i
        }));

        yearTransactions.forEach(t => {
            const month = new Date(t.date + 'T12:00:00').getMonth();
            const amount = t.amount;
            if (t.type === 'income') {
                months[month].income += amount;
            } else {
                months[month].expense += amount;
            }
        });

        // Calc savings per month
        months.forEach(m => {
            m.savings = m.income - m.expense;
        });

        return months;
    }, [yearTransactions, selectedYear]);

    // 4. Aggregate Category Data (Expenses Only)
    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};

        yearTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = t.category || 'Sin Categoría';
                categories[cat] = (categories[cat] || 0) + t.amount;
            });

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Top expenses first
    }, [yearTransactions]);

    // 5. YTD Totals
    const ytdTotals = useMemo(() => {
        const income = monthlyData.reduce((acc, curr) => acc + curr.income, 0);
        const expense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0);
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        return { income, expense, savings, savingsRate };
    }, [monthlyData]);


    // --- Colors for Charts ---
    const COLORS = [
        '#f43f5e', // Rose 500
        '#f97316', // Orange 500
        '#eab308', // Yellow 500
        '#10b981', // Emerald 500
        '#06b6d4', // Cyan 500
        '#3b82f6', // Blue 500
        '#8b5cf6', // Violet 500
        '#d946ef', // Fuchsia 500
        '#64748b', // Slate 500
    ];

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Reportes Anuales</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Análisis detallado de tu año financiero.</p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => {
                            const currentIndex = availableYears.indexOf(selectedYear);
                            if (currentIndex < availableYears.length - 1) setSelectedYear(availableYears[currentIndex + 1]);
                        }}
                        disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={18} className="text-indigo-500" />
                        <span className="text-xl font-black font-mono tracking-tight">{selectedYear}</span>
                    </div>

                    <button
                        onClick={() => {
                            const currentIndex = availableYears.indexOf(selectedYear);
                            if (currentIndex > 0) setSelectedYear(availableYears[currentIndex - 1]);
                        }}
                        disabled={availableYears.indexOf(selectedYear) === 0}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* YTD Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Ingresos Totales</span>
                    </div>
                    <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">{currency}{ytdTotals.income.toLocaleString()}</p>
                </div>

                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">Gastos Totales</span>
                    </div>
                    <p className="text-3xl font-black text-rose-900 dark:text-rose-100">{currency}{ytdTotals.expense.toLocaleString()}</p>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                            <PiggyBank size={20} />
                        </div>
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Ahorro Neto</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <p className={clsx("text-3xl font-black", ytdTotals.savings >= 0 ? "text-indigo-900 dark:text-indigo-100" : "text-rose-600")}>
                            {currency}{ytdTotals.savings.toLocaleString()}
                        </p>
                        <span className={clsx("text-xs font-bold px-2 py-1 rounded-lg mb-1", ytdTotals.savingsRate > 0 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
                            {ytdTotals.savingsRate.toFixed(1)}% Tasa
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Monthly Evolution (Bar Chart) */}
                <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-zinc-400" />
                        Evolución Mensual
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#71717a' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#71717a' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `${currency}${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--tooltip-bg, #fff)',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar
                                    dataKey="income"
                                    name="Ingresos"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Gastos"
                                    fill="#f43f5e"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown (Pie Chart) */}
                <div className="xl:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Desglose de Gastos</h3>
                    <p className="text-xs text-zinc-500 mb-6">Top categorías del año {selectedYear}</p>

                    <div className="flex-1 min-h-[300px] relative">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any, name: any, _props: unknown) => [
                                            `${currency}${(typeof value === 'number' ? value : 0).toLocaleString()}`,
                                            String(name)
                                        ]}
                                        contentStyle={{ borderRadius: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                                Sin datos de gastos
                            </div>
                        )}
                    </div>

                    {/* Custom Legend */}
                    <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {categoryData.slice(0, 8).map((cat, index) => (
                            <div key={cat.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]" title={cat.name}>{cat.name}</span>
                                </div>
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{currency}{cat.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div >
    );
};

export default Reports;
