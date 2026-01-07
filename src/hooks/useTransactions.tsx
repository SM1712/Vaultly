import { useFirestore } from './useFirestore';
import type { Transaction, TransactionType } from '../types';

export const useTransactions = (type?: TransactionType) => {
    const { data: transactions, add, remove, update } = useFirestore<Transaction>('transactions');

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        // Firestore creates the ID automatically
        add(transaction);
    };

    const deleteTransaction = (id: string) => {
        remove(id);
    };

    const updateCategory = (categoryName: string, newCategoryName: string) => {
        // Batch update would be better, but for now iterate (or let user do it one by one? Plan says migrate settings... 
        // logic in SettingsMenu called updateCategory.
        // We must find all transactions with this category and update them.
        // This is expensive on client side for many items, but acceptable for MVP.
        const toUpdate = transactions.filter(t => t.category === categoryName);
        toUpdate.forEach(t => {
            update(t.id, { category: newCategoryName });
        });
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
        allTransactions: transactions,
        updateCategory
    };
};
