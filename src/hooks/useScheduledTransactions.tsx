import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import type { ScheduledTransaction } from '../types';
import { toast } from 'sonner';
import { useNotifications } from '../context/NotificationContext';

export const useScheduledTransactions = () => {
    const { data, updateData } = useData();
    const { notify } = useNotifications();
    const scheduled = data.scheduledTransactions || [];
    const transactions = data.transactions || [];

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

    const updateScheduled = (id: string, updates: Partial<ScheduledTransaction>) => {
        const newScheduled = scheduled.map(i => i.id === id ? { ...i, ...updates } : i);
        updateData({ scheduledTransactions: newScheduled });
        toast.success('Regla recurrente actualizada');
    };

    const toggleActive = (id: string, currentState: boolean) => {
        const newScheduled = scheduled.map(i => i.id === id ? { ...i, active: !currentState } : i);
        updateData({ scheduledTransactions: newScheduled });
        toast.success(currentState ? 'Programación pausada' : 'Programación reactivada');
    };

    const processScheduledTransactions = useCallback(() => {
        const today = new Date();
        const currentDay = today.getDate();
        let transactionsCreated = 0;
        const newTransactions: any[] = []; // We will accumulate them here

        // Use crypto.randomUUID for IDs since we removed uuid dependency here to simplify
        // In case crypto isn't available, we could use a fallback, but in modern browsers it is.
        // Actually uuid is imported in useTransactions. Let's just use crypto.randomUUID().

        const updatedScheduled = scheduled.map(item => {
            if (!item.active) return item;

            const lastProcessed = item.lastProcessedDate ? new Date(item.lastProcessedDate + 'T12:00:00') : null;
            const alreadyProcessedThisMonth = lastProcessed &&
                lastProcessed.getMonth() === today.getMonth() &&
                lastProcessed.getFullYear() === today.getFullYear();

            // Also check if today is matching the day of month, or if we passed it and didn't process
            if (currentDay >= item.dayOfMonth && !alreadyProcessedThisMonth) {

                newTransactions.push({
                    id: crypto.randomUUID(),
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

            return item;
        });

        if (transactionsCreated > 0) {
            updateData({
                scheduledTransactions: updatedScheduled,
                transactions: [...transactions, ...newTransactions]
            });
            toast.success(`${transactionsCreated} transacciones recurrentes procesadas`, { duration: 10000, icon: '🔄' });
            notify('Vaultly: Pagos Automáticos', {
                body: `Se han procesado ${transactionsCreated} transacciones recurrentes.`,
                tag: 'recurring_tx',
            });
        }
    }, [scheduled, transactions, updateData, notify]);

    return {
        scheduled,
        addScheduled,
        deleteScheduled,
        updateScheduled,
        toggleActive,
        processScheduledTransactions
    };
};
