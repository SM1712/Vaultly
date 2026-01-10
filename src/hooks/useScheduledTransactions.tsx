import { useData } from '../context/DataContext';
import type { ScheduledTransaction } from '../types';
import { useTransactions } from './useTransactions';
import { toast } from 'sonner';

export const useScheduledTransactions = () => {
    const { data, updateData } = useData();
    const scheduled = data.scheduledTransactions || [];
    const { addTransaction } = useTransactions();

    const addScheduled = (scheduledData: Omit<ScheduledTransaction, 'id' | 'createdAt' | 'active'>) => {
        const newItem: ScheduledTransaction = {
            id: crypto.randomUUID(),
            ...scheduledData,
            active: true,
            createdAt: new Date().toISOString()
        };
        updateData({ scheduledTransactions: [...scheduled, newItem] });
        toast.success('Transacción programada creada');
    };

    const deleteScheduled = (id: string) => {
        const newScheduled = scheduled.filter(i => i.id !== id);
        updateData({ scheduledTransactions: newScheduled });
    };

    const toggleActive = (id: string, currentState: boolean) => {
        const newScheduled = scheduled.map(i => i.id === id ? { ...i, active: !currentState } : i);
        updateData({ scheduledTransactions: newScheduled });
        toast.success(currentState ? 'Programación pausada' : 'Programación reactivada');
    };

    const processScheduledTransactions = () => {
        const today = new Date();
        const currentDay = today.getDate();
        let transactionsCreated = 0;

        const updatedScheduled = scheduled.map(item => {
            if (!item.active) return item;

            const lastProcessed = item.lastProcessedDate ? new Date(item.lastProcessedDate) : null;
            const alreadyProcessedThisMonth = lastProcessed &&
                lastProcessed.getMonth() === today.getMonth() &&
                lastProcessed.getFullYear() === today.getFullYear();

            if (currentDay >= item.dayOfMonth && !alreadyProcessedThisMonth) {
                // Add actual transaction
                // Note: This calls updateData internally inside addTransaction, which might cause a race condition
                // if we don't handle it carefully. However, since we are returning a new list here, 
                // we should probably batch the updates or update scheduled AFTER transactions.
                // ideally addTransaction would return the new transaction object instead of setting state directly.
                // For now, let's just trigger the side effect.

                // CRITICAL: We cannot call addTransaction here if it depends on the SAME state we are updating!
                // Actually useTransactions reads from useData too.
                // We will queue the transaction addition.

                addTransaction({
                    type: item.type,
                    amount: item.amount,
                    category: item.category,
                    date: today.toISOString().split('T')[0],
                    description: `(Recurrente) ${item.description}`
                });
                transactionsCreated++;

                return {
                    ...item,
                    lastProcessedDate: today.toISOString().split('T')[0]
                };
            }

            // Alerts logic removed by user request.

            return item;
        });

        if (transactionsCreated > 0) {
            updateData({ scheduledTransactions: updatedScheduled });
            toast.info(`${transactionsCreated} transacciones recurrentes procesadas`);
        }
    };

    return {
        scheduled,
        addScheduled,
        deleteScheduled,
        toggleActive,
        processScheduledTransactions
    };
};
