import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import type { ScheduledTransaction, Transaction } from '../types';
import { toast } from 'sonner';
import { useNotifications } from '../context/NotificationContext';

export const useScheduledTransactions = () => {
    const { data, updateData } = useData();
    const { notify } = useNotifications();
    const scheduled = data.scheduledTransactions || [];
    const transactions = data.transactions || [];

    const addScheduled = (scheduledData: Omit<ScheduledTransaction, 'id' | 'createdAt' | 'active'>) => {
        const today = new Date();
        const currentDay = today.getDate();
        const todayStr = today.toISOString().split('T')[0];

        const newItem: ScheduledTransaction = {
            id: crypto.randomUUID(),
            ...scheduledData,
            active: true,
            createdAt: today.toISOString(),
            lastProcessedDate: scheduledData.dayOfMonth <= currentDay ? todayStr : undefined
        };
        updateData({ scheduledTransactions: [...scheduled, newItem] });
        toast.success("Transacción Programada", {
            description: `Se ha programado la transacción "${newItem.description}" correctamente.`
        });
    };

    const deleteScheduled = (id: string) => {
        const itemToDelete = scheduled.find(i => i.id === id);
        const newScheduled = scheduled.filter(i => i.id !== id);
        updateData({ scheduledTransactions: newScheduled });
        toast.success("Programación Eliminada", {
            description: itemToDelete ? `La transacción programada "${itemToDelete.description}" fue removida.` : "La transacción programada fue removida."
        });
    };

    const updateScheduled = (id: string, updates: Partial<ScheduledTransaction>) => {
        const newScheduled = scheduled.map(i => i.id === id ? { ...i, ...updates } : i);
        updateData({ scheduledTransactions: newScheduled });
        toast.success("Programación Actualizada", {
            description: "Los cambios en la regla de recurrencia han sido guardados."
        });
    };

    const toggleActive = (id: string, currentState: boolean) => {
        const newScheduled = scheduled.map(i => i.id === id ? { ...i, active: !currentState } : i);
        updateData({ scheduledTransactions: newScheduled });
        toast.success(currentState ? "Programación Pausada" : "Programación Reactivada", {
            description: currentState 
                ? "La transacción recurrente ha sido desactivada temporalmente."
                : "La transacción recurrente ha sido reactivada correctamente."
        });
    };

    const processScheduledTransactions = useCallback(() => {
        const today = new Date();
        const currentDay = today.getDate();
        let transactionsCreated = 0;
        const newTransactions: Transaction[] = [];

        const updatedScheduled = scheduled.map(item => {
            if (!item.active) return item;

            const lastProcessed = item.lastProcessedDate ? new Date(item.lastProcessedDate + 'T12:00:00') : null;
            const alreadyProcessedThisMonth = lastProcessed &&
                lastProcessed.getMonth() === today.getMonth() &&
                lastProcessed.getFullYear() === today.getFullYear();

            // Also check if today is matching the day of month, or if we passed it and didn't process
            if (currentDay >= item.dayOfMonth && !alreadyProcessedThisMonth) {
                const newTx: Transaction = {
                    id: crypto.randomUUID(),
                    type: item.type,
                    amount: item.amount,
                    category: item.category,
                    date: today.toISOString().split('T')[0],
                    description: `(Recurrente) ${item.description}`
                };
                newTransactions.push(newTx);
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
            toast.success("Pagos Automáticos Procesados", {
                description: `Se han procesado ${transactionsCreated} transacciones recurrentes agendadas para el día de hoy.`,
                duration: 10000,
                icon: '🔄'
            });
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
