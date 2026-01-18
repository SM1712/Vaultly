import { useData } from '../context/DataContext';
import type { Transaction, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toCents, fromCents } from '../utils/financialUtils';

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

    const updateTransaction = (id: string, updates: Partial<Transaction>) => {
        const newTransactions = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
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

    // Use cents for precise total calculation
    const totalCents = filteredTransactions.reduce((acc, curr) => acc + toCents(curr.amount), 0);
    const total = fromCents(totalCents);

    const getByCategory = () => {
        const groupedCents = filteredTransactions.reduce((acc, curr) => {
            const categoryName = curr.category || 'Sin Categoría';
            acc[categoryName] = (acc[categoryName] || 0) + toCents(curr.amount);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(groupedCents).map(([name, valueCents]) => ({
            name,
            value: fromCents(valueCents)
        }));
    };

    return {
        transactions: filteredTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        total,
        getByCategory,
        allTransactions: transactions, // For category management if needed
        updateCategory
    };
};
