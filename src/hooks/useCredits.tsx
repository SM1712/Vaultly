import { useFirestore } from './useFirestore';
import type { Credit, Payment } from '../types';
import { toast } from 'sonner';

export const useCredits = () => {
    const { data: credits, add, remove, update } = useFirestore<Credit>('credits');

    const addCredit = (creditData: Omit<Credit, 'id' | 'payments'>) => {
        add({
            ...creditData,
            payments: []
        });
    };

    const deleteCredit = (id: string) => {
        remove(id);
    };

    const addPayment = async (creditId: string, amount: number, note?: string) => {
        const credit = credits.find(c => c.id === creditId);
        if (!credit) {
            toast.error("Error: Crédito no encontrado");
            return;
        }

        const newPayment: Payment = {
            id: crypto.randomUUID(),
            creditId,
            date: new Date().toISOString().split('T')[0],
            amount: Number(amount),
            note: note || ''
        };

        const payments = credit.payments ? [newPayment, ...credit.payments] : [newPayment];

        // Check if fully paid
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        // Recalculate full debt to be safe
        const monthlyRate = credit.interestRate / 100 / 12;
        let quota = 0;
        let totalToPay = 0;

        if (credit.interestRate === 0) {
            quota = credit.principal / credit.term;
            totalToPay = credit.principal;
        } else {
            // Avoid NaN if term or principal are weird
            const p = Number(credit.principal);
            const t = Number(credit.term);
            quota = (p * monthlyRate * Math.pow(1 + monthlyRate, t)) / (Math.pow(1 + monthlyRate, t) - 1);
            totalToPay = quota * t;
        }

        const newStatus = totalPaid >= (totalToPay - 1) ? 'paid' : 'active'; // Tolerance

        try {
            await update(creditId, {
                payments,
                status: newStatus
            });
            // toast.success("Pago registrado en historial"); 
        } catch (e) {
            console.error("Failed to update credit payment", e);
            toast.error("Error al guardar el historial del pago");
        }
    };

    const getCreditStatus = (credit: Credit) => {
        const payments = credit.payments || [];
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        // Calculate Total Debt (Principal + Interest)
        // Using French Amortization formula for fixed quota
        const monthlyRate = credit.interestRate / 100 / 12;
        let quota = 0;
        let totalToPay = 0;

        if (credit.interestRate === 0) {
            quota = credit.principal / credit.term;
            totalToPay = credit.principal;
        } else {
            quota = (credit.principal * monthlyRate * Math.pow(1 + monthlyRate, credit.term)) / (Math.pow(1 + monthlyRate, credit.term) - 1);
            totalToPay = quota * credit.term;
        }

        const remainingBalance = Math.max(0, totalToPay - totalPaid);

        return {
            totalPaid,
            totalToPay,
            remainingBalance,
            quota,
            progress: (totalPaid / totalToPay) * 100
        };
    };

    return {
        credits,
        addCredit,
        deleteCredit,
        addPayment,
        getCreditStatus
    };
};
