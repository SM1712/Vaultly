import { useFirestore } from './useFirestore';
import type { Fund, FundTransaction } from '../types';

export const useFunds = () => {
    const { data: funds, add, remove, update } = useFirestore<Fund>('funds');

    const addFund = (fundData: { name: string; icon: string; description?: string; color?: string }) => {
        const newFund = {
            currentAmount: 0,
            history: [],
            ...fundData
        };
        add(newFund);
    };

    const deleteFund = (id: string) => {
        remove(id);
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
            ? fund.currentAmount + amount
            : fund.currentAmount - amount;

        const history = fund.history ? [newTx, ...fund.history] : [newTx];

        update(fundId, {
            currentAmount: Math.max(0, newAmount),
            history
        });
    };

    return {
        funds,
        addFund,
        deleteFund,
        addTransaction
    };
};
