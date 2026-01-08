import { useData } from '../context/DataContext';
import type { Transaction, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useTransactions = (type?: TransactionType) => {
    const { data, updateData } = useData();
    const transactions = data.transactions || [];

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction: Transaction = {
            id: uuidv4(),
            ...transaction
        };
        updateData({ transactions: [...transactions, newTransaction] });
    };

    const deleteTransaction = (id: string) => {
        const newTransactions = transactions.filter(t => t.id !== id);
        updateData({ transactions: newTransactions });
    };

    const updateCategory = (categoryName: string, newCategoryName: string) => {
        const newTransactions = transactions.map(t =>
            t.category === categoryName ? { ...t, category: newCategoryName } : t
        );
        updateData({ transactions: newTransactions });
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

    return {
        transactions: filteredTransactions,
        addTransaction,
        deleteTransaction,
        total,
        getByCategory,
        allTransactions: transactions, // For category management if needed
        updateCategory
    };
};
