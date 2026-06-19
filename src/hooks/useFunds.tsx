import { useData } from '../context/DataContext';
import type { Fund, FundTransaction, Transaction } from '../types';
import { safeAdd, safeSub, safePercent, toCents, fromCents } from '../utils/financialUtils';
import { toast } from 'sonner';

// Helper to calculate available balance inline and prevent circular hook dependencies
const getAvailableBalance = (data: any) => {
    const txs = data.transactions || [];
    let balanceCents = 0;
    txs.forEach((t: any) => {
        const isSavingsTransfer = t.relatedTo && (t.relatedTo.type === 'goal' || t.relatedTo.type === 'fund');
        if (!isSavingsTransfer) {
            if (t.type === 'income') balanceCents += toCents(t.amount);
            else balanceCents -= toCents(t.amount);
        }
    });

    const goals = data.goals || [];
    goals.forEach((g: any) => {
        (g.history || []).forEach((h: any) => {
            if (h.type === 'deposit') balanceCents -= toCents(h.amount);
            else balanceCents += toCents(h.amount);
        });
    });

    const funds = data.funds || [];
    funds.forEach((f: any) => {
        (f.history || []).forEach((h: any) => {
            if (h.type === 'deposit') balanceCents -= toCents(h.amount);
            else balanceCents += toCents(h.amount);
        });
    });

    return fromCents(balanceCents);
};

export const useFunds = () => {
    const { data, updateData } = useData();
    const funds: Fund[] = data.funds || [];

    const addFund = (fundData: { name: string; icon: string; description?: string; color?: string; texture?: 'frost' | 'obsidian' | 'neon' }) => {
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
        // Cascade delete: clean up transactions related to this fund
        const newTransactions = (data.transactions || []).filter(t => !(t.relatedTo?.type === 'fund' && t.relatedTo?.id === id));
        updateData({ funds: newFunds, transactions: newTransactions });
        toast.success("Fondo Eliminado", {
            description: "El fondo se ha eliminado y se liberó su saldo correspondiente."
        });
    };

    const addTransaction = (fundId: string, amount: number, type: 'deposit' | 'withdraw', note?: string, skipTransaction: boolean = false) => {
        const fund = funds.find(f => f.id === fundId);
        if (!fund) return;

        // 1. Balance safeguard for manual deposits
        if (type === 'deposit' && !skipTransaction) {
            const balance = getAvailableBalance(data);
            const currency = data.settings?.currency || '$';
            if (amount > balance) {
                toast.error("Fondos Insuficientes", {
                    description: `Solo tienes ${currency}${balance.toLocaleString()} disponible en Wallet.`
                });
                return;
            }
        }

        // Fund withdrawal safeguard
        if (type === 'withdraw' && amount > (fund.currentAmount || 0)) {
            const currency = data.settings?.currency || '$';
            toast.error("Retiro Inválido", {
                description: `No puedes retirar más de lo guardado en este fondo (${currency}${(fund.currentAmount || 0).toLocaleString()}).`
            });
            return;
        }

        const newTxId = crypto.randomUUID();
        const todayStr = new Date().toISOString().split('T')[0];
        const newTx: FundTransaction = {
            id: newTxId,
            fundId,
            date: todayStr, // YYYY-MM-DD
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
        const updates: Partial<typeof data> = { funds: newFunds };

        // 2. Synchronize with main transactions ledger
        if (!skipTransaction) {
            const ledgerTx: Transaction = {
                id: newTxId,
                type: type === 'deposit' ? 'expense' : 'income',
                amount: amount,
                category: 'Ahorro / Fondos',
                date: todayStr,
                description: type === 'deposit'
                    ? `Aporte a Fondo: ${fund.name}${note ? ` (${note})` : ''}`
                    : `Retiro de Fondo: ${fund.name}${note ? ` (${note})` : ''}`,
                relatedTo: {
                    type: 'fund',
                    id: fundId
                }
            };
            updates.transactions = [...(data.transactions || []), ledgerTx];
        }

        updateData(updates);
        if (!skipTransaction) {
            const currency = data.settings?.currency || '$';
            toast.success(type === 'deposit' ? "Aporte Registrado" : "Retiro Registrado", {
                description: type === 'deposit'
                    ? `Se aportaron ${currency}${amount.toLocaleString()} al fondo "${fund.name}".`
                    : `Se retiraron ${currency}${amount.toLocaleString()} desde el fondo "${fund.name}".`
            });
        }
    };

    const checkAutoDeposits = (availableBalance: number) => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentDateStr = today.toISOString().split('T')[0];
        let fundsUpdated = false;
        const newLedgerTxs: Transaction[] = [];

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
                    const txId = crypto.randomUUID();
                    // Create Fund Transaction
                    const newTx: FundTransaction = {
                        id: txId,
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

                    // Create corresponding Wallet Transaction to deduct available balance
                    const ledgerTx: Transaction = {
                        id: txId,
                        type: 'expense',
                        amount: amountToSave,
                        category: 'Ahorro / Fondos',
                        date: currentDateStr,
                        description: `Auto-Ahorro: ${fund.name}`,
                        relatedTo: {
                            type: 'fund',
                            id: fund.id
                        }
                    };
                    newLedgerTxs.push(ledgerTx);

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
            updateData({
                funds: newFunds,
                transactions: [...(data.transactions || []), ...newLedgerTxs]
            });
            toast.success("Ahorro Automático", {
                description: `Se procesaron las transacciones de ahorro automático para ${newLedgerTxs.length} fondos.`
            });
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
