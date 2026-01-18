import { useData } from '../context/DataContext';
import type { Fund, FundTransaction } from '../types';
import { safeAdd, safeSub, safePercent } from '../utils/financialUtils';

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

        // Precise Math Update
        let newAmount = 0;
        if (type === 'deposit') {
            newAmount = safeAdd(fund.currentAmount || 0, amount);
        } else {
            newAmount = safeSub(fund.currentAmount || 0, amount);
        }

        const history = fund.history ? [newTx, ...fund.history] : [newTx];

        const updatedFund = {
            ...fund,
            currentAmount: Math.max(0, newAmount),
            history
        };

        const newFunds = funds.map(f => f.id === fundId ? updatedFund : f);
        updateData({ funds: newFunds });
    };

    const checkAutoDeposits = (availableBalance: number) => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentDateStr = today.toISOString().split('T')[0];
        let fundsUpdated = false;

        const newFunds = funds.map(fund => {
            if (!fund.autoSaveConfig || !fund.autoSaveConfig.enabled) return fund;

            // Check if already processed this month
            if (fund.autoSaveConfig.lastProcessedDate) {
                const lastDate = new Date(fund.autoSaveConfig.lastProcessedDate);
                if (lastDate.getMonth() === today.getMonth() && lastDate.getFullYear() === today.getFullYear()) {
                    return fund;
                }
            }

            // Check if today is the day (or passed it)
            if (currentDay >= fund.autoSaveConfig.dayOfMonth) {
                let amountToSave = 0;

                if (fund.autoSaveConfig.type === 'fixed') {
                    amountToSave = fund.autoSaveConfig.amount;
                } else if (fund.autoSaveConfig.type === 'percentage') {
                    // Safe percentage calc
                    amountToSave = safePercent(availableBalance, fund.autoSaveConfig.amount);
                }

                if (amountToSave > 0 && availableBalance >= amountToSave) {
                    // Create Transaction
                    const newTx: FundTransaction = {
                        id: crypto.randomUUID(),
                        fundId: fund.id,
                        date: currentDateStr,
                        amount: amountToSave,
                        type: 'deposit',
                        note: 'Auto-Ahorro Mensual'
                    };

                    const newHistory = fund.history ? [newTx, ...fund.history] : [newTx];
                    fundsUpdated = true;

                    // Update Fund Safe Add
                    const newCurrentAmount = safeAdd(fund.currentAmount || 0, amountToSave);

                    return {
                        ...fund,
                        currentAmount: newCurrentAmount,
                        history: newHistory,
                        autoSaveConfig: {
                            ...fund.autoSaveConfig,
                            lastProcessedDate: currentDateStr
                        }
                    };
                }
            }
            return fund;
        });

        if (fundsUpdated) {
            updateData({ funds: newFunds });
        }
    };

    return {
        funds,
        addFund,
        updateFund,
        deleteFund,
        addTransaction,
        checkAutoDeposits
    };
};
