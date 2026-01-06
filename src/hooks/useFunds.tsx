import useLocalStorage from './useLocalStorage';
import type { Fund, FundTransaction } from '../types';

export const useFunds = () => {
    const [funds, setFunds] = useLocalStorage<Fund[]>('vault_funds', []);

    const addFund = (fundData: { name: string; icon: string; description?: string; color?: string }) => {
        const newFund: Fund = {
            id: crypto.randomUUID(),
            currentAmount: 0,
            history: [],
            ...fundData
        };
        setFunds([...funds, newFund]);
    };

    const deleteFund = (id: string) => {
        setFunds(funds.filter(f => f.id !== id));
    };

    const addTransaction = (fundId: string, amount: number, type: 'deposit' | 'withdraw', note?: string) => {
        setFunds(funds.map(f => {
            if (f.id === fundId) {
                const newTx: FundTransaction = {
                    id: crypto.randomUUID(),
                    fundId,
                    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                    amount,
                    type,
                    note
                };

                const newAmount = type === 'deposit'
                    ? f.currentAmount + amount
                    : f.currentAmount - amount;

                return {
                    ...f,
                    currentAmount: Math.max(0, newAmount), // Prevent negative balance
                    history: [newTx, ...f.history]
                };
            }
            return f;
        }));
    };

    return {
        funds,
        addFund,
        deleteFund,
        addTransaction
    };
};
