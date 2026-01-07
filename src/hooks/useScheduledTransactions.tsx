import { useFirestore } from './useFirestore';
import type { ScheduledTransaction } from '../types';
import { useTransactions } from './useTransactions';
import { toast } from 'sonner';

export const useScheduledTransactions = () => {
    const { data: scheduled, add, remove, update } = useFirestore<ScheduledTransaction>('scheduled_transactions');
    const { addTransaction } = useTransactions();

    const addScheduled = (data: Omit<ScheduledTransaction, 'id' | 'createdAt' | 'active'>) => {
        add({
            ...data,
            active: true,
            createdAt: new Date().toISOString()
        });
        toast.success('Transacción programada creada');
    };

    const toggleActive = (id: string, currentState: boolean) => {
        update(id, { active: !currentState });
        toast.success(currentState ? 'Programación pausada' : 'Programación reactivada');
    };

    const processScheduledTransactions = () => {
        const today = new Date();
        const currentDay = today.getDate();

        scheduled.forEach(item => {
            if (!item.active) return;

            // Check if due today or past due in current month
            // Simple logic: If day matches and not processed this month

            // Check last processed
            const lastProcessed = item.lastProcessedDate ? new Date(item.lastProcessedDate) : null;
            const alreadyProcessedThisMonth = lastProcessed &&
                lastProcessed.getMonth() === today.getMonth() &&
                lastProcessed.getFullYear() === today.getFullYear();

            // Logic: Process if today >= scheduledDay AND hasn't been processed this month
            if (currentDay >= item.dayOfMonth && !alreadyProcessedThisMonth) {

                // Add actual transaction
                addTransaction({
                    type: item.type,
                    amount: item.amount,
                    category: item.category,
                    date: today.toISOString().split('T')[0], // Use today's date for the record
                    description: `(Recurrente) ${item.description}`
                });

                // Update last processed
                update(item.id, {
                    lastProcessedDate: today.toISOString().split('T')[0]
                });

                toast.info(`Transacción recurrente procesada: ${item.description}`);
            }

            // Alert for upcoming (2 days before)
            // If day is 15, alert on 13, 14
            // Only alert if NOT processed yet
            if (!alreadyProcessedThisMonth) {
                const daysUntilDue = item.dayOfMonth - currentDay;
                if (daysUntilDue > 0 && daysUntilDue <= 2) {
                    toast.warning(`Próximo vencimiento: ${item.description} ($${item.amount})`, {
                        description: `Vence el día ${item.dayOfMonth}`,
                        duration: 5000,
                    });
                }
            }
        });
    };

    return {
        scheduled,
        addScheduled,
        deleteScheduled: remove,
        toggleActive,
        processScheduledTransactions
    };
};
