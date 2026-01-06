import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import TransactionForm from '../components/finance/TransactionForm';
import TransactionList from '../components/finance/TransactionList';
import CategorySummary from '../components/finance/CategorySummary';
import MonthSelector from '../components/MonthSelector';

const Income = () => {
    const { transactions, addTransaction, deleteTransaction } = useTransactions('income');
    const { categories, addCategory } = useCategories('income');
    const { selectedDate } = useFinance();
    const { currency } = useSettings();

    // Filter transactions by month
    const filteredTransactions = transactions.filter(t => {
        const [year, month] = t.date.split('-').map(Number);
        return month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();
    });

    const filteredTotal = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    const getByCategory = () => {
        const grouped = filteredTransactions.reduce((acc, curr) => {
            const categoryName = curr.category || 'Sin Categoría';
            acc[categoryName] = (acc[categoryName] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Gestión de Ingresos</h2>
                    <p className="text-zinc-500 dark:text-zinc-500 text-sm">Registra cada flujo entrante de dinero</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                    <MonthSelector />
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-6 py-3 rounded-xl">
                        <p className="text-emerald-600 dark:text-emerald-200 text-xs uppercase tracking-wider font-semibold">Total Ingresado</p>
                        <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{currency}{filteredTotal.toFixed(2)}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <TransactionForm
                        type="income"
                        onSubmit={addTransaction}
                        categories={categories}
                        onAddCategory={addCategory}
                    />
                    <TransactionList
                        transactions={filteredTransactions}
                        onDelete={deleteTransaction}
                    />
                </div>
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <CategorySummary data={getByCategory()} total={filteredTotal} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Income;
