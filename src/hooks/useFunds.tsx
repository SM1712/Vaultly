import { useData } from '../context/DataContext';
import type { Fund, FundTransaction } from '../types';

export const useFunds = () => {
    const { data, updateData } = useData();
    const funds: Fund[] = data.funds || [];

    const addFund = (fundData: { name: string; icon: string; description?: string; color?: string }) => {
        const newFund: Fund = {
            id: crypto.randomUUID(),
            currentAmount: 0,
            history: [],
            ...fundData
        };
        updateData({ funds: [...funds, newFund] });
    };

    const updateFund = (id: string, updates: Partial<Fund>) => {
        const newFunds = funds.map(f => f.id === id ? { ...f, ...updates } : f);
        updateData({ funds: newFunds });
    };

    const deleteFund = (id: string) => {
        const newFunds = funds.filter(f => f.id !== id);
        updateData({ funds: newFunds });
    };

    const addTransaction = (fundId: string, amount: number, type: 'deposit' | 'withdraw', note?: string) => {
        const fund = funds.find(f => f.id === fundId);
        if (!fund) return;

        const newTx: FundTransaction = {
            id: crypto.randomUUID(),
            fundId,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            amount,
            type,
            note
        };

        const newAmount = type === 'deposit'
            ? (fund.currentAmount || 0) + amount
            : (fund.currentAmount || 0) - amount;

        const history = fund.history ? [newTx, ...fund.history] : [newTx];

        const updatedFund = {
            ...fund,
            currentAmount: Math.max(0, newAmount),
            history
        };

        const newFunds = funds.map(f => f.id === fundId ? updatedFund : f);
        updateData({ funds: newFunds });
    };

    return {
        funds,
        addFund,
        updateFund,
        deleteFund,
        addTransaction
    };
};
