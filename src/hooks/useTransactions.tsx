import useLocalStorage from './useLocalStorage';
import type { Transaction, TransactionType } from '../types';

export const useTransactions = (type?: TransactionType) => {
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('vault_transactions', []);

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = {
            ...transaction,
            id: crypto.randomUUID(),
        };
        setTransactions((prev) => [newTransaction, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
    };

    const filteredTransactions = type
        ? transactions.filter((t) => t.type === type)
        : transactions;

    const total = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    const getByCategory = () => {
        const grouped = filteredTransactions.reduce((acc, curr) => {
            const categoryName = curr.category || 'Sin Categoría';
            acc[categoryName] = (acc[categoryName] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    };

    const updateCategory = (oldCategory: string, newCategory: string) => {
        setTransactions((prev) => prev.map(t => {
            if (t.category === oldCategory) {
                return { ...t, category: newCategory };
            }
            return t;
        }));
    };

    return {
        transactions: filteredTransactions,
        addTransaction,
        deleteTransaction,
        total,
        getByCategory,
        allTransactions: transactions,
        updateCategory
    };
};
