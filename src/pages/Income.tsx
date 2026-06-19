import { useState, useMemo, useCallback } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import type { Transaction } from '../types';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { useGamification } from '../context/GamificationContext';
import { useProjects } from '../hooks/useProjects';
import { useFunds } from '../hooks/useFunds';
import TransactionForm from '../components/finance/TransactionForm';
import TransactionList from '../components/finance/TransactionList';
import CategorySummary from '../components/finance/CategorySummary';
import MonthSelector from '../components/MonthSelector';

const Income = () => {
    const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions('income');
    const { categories, addCategory } = useCategories('income');
    const { projects, addProjectTransaction } = useProjects();
    const { funds, addTransaction: addFundTx } = useFunds();

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const { selectedDate } = useFinance();
    const { currency } = useSettings();

    // Filter transactions by month
    const filteredTransactions = useMemo(() => transactions.filter(t => {
        const [year, month] = t.date.split('-').map(Number);
        return month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();
    }), [transactions, selectedDate]);

    const filteredTotal = useMemo(() => filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0), [filteredTransactions]);

    const getByCategory = useCallback(() => {
        const grouped = filteredTransactions.reduce((acc, curr) => {
            const categoryName = curr.category || 'Sin Categoría';
            acc[categoryName] = (acc[categoryName] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);

    const { checkAchievement, addXp } = useGamification();

    const handleFormSubmit = (data: any) => {
        if (editingTransaction) {
            updateTransaction(editingTransaction.id, data);
            setEditingTransaction(null);
        } else {
            const txId = addTransaction(data);
            if (!txId) return;

            // Relational Hooks processing
            if (data.relatedTo) {
                if (data.relatedTo.type === 'project') {
                    addProjectTransaction(data.relatedTo.id, {
                        amount: data.amount,
                        date: data.date,
                        description: data.description || 'Ingreso desde Bóveda',
                        type: 'income',
                        fundingSource: 'internal',
                        ledgerTxId: txId
                    });
                } else if (data.relatedTo.type === 'fund') {
                    // Si se registra un ingreso hacia un fondo (Ej. retiro del fondo a billetera principal) 
                    // se interpreta como un Retiro del fondo.
                    addFundTx(data.relatedTo.id, data.amount, 'withdraw', data.description || 'Retirado hacia Bóveda', true);
                }
            }

            // Gamification Triggers
            checkAchievement('TRANSACTION_ADDED', data);
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-8 pb-20 md:pb-0">
            {/* Header Section */}
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Gestión de Ingresos</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">Registra y analiza tus flujos de dinero.</p>
                </div>

                {/* Controls & Summary Card */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-white dark:bg-zinc-900/50 p-2 pr-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50">
                    <div className="w-full sm:w-auto">
                        <MonthSelector />
                    </div>
                    <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
                    <div className="flex flex-col px-4 sm:px-0 pb-2 sm:pb-0">
                        <span className="text-xs uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500">Total Ingresado</span>
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">{currency}{filteredTotal.toFixed(2)}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

                {/* Main Column: Form & History */}
                <div className="xl:col-span-2 space-y-8 order-2 xl:order-1">
                    <section id="new-transaction" className="scroll-mt-24">
                        <TransactionForm
                            type="income"
                            onSubmit={handleFormSubmit}
                            categories={categories}
                            onAddCategory={addCategory}
                            initialData={editingTransaction || undefined}
                            projects={projects}
                            funds={funds}
                        />
                    </section>

                    <section className="space-y-4 max-w-full overflow-hidden">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Historial Reciente</h3>
                            <span className="text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{filteredTransactions.length} registros</span>
                        </div>
                        <TransactionList
                            transactions={filteredTransactions}
                            onDelete={deleteTransaction}
                            onEdit={handleEdit}
                        />
                    </section>
                </div>

                {/* Sidebar Column: Stats */}
                <div className="xl:col-span-1 order-1 xl:order-2 space-y-6">
                    <div className="sticky top-6 space-y-6">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6">
                            <h4 className="text-emerald-900 dark:text-emerald-100 font-bold text-lg mb-1">Fuentes de Ingreso</h4>
                            <p className="text-emerald-700 dark:text-emerald-300 text-sm opacity-80 mb-6">Distribución por categoría.</p>
                            <CategorySummary data={getByCategory()} total={filteredTotal} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Income;
