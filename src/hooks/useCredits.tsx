import { useFirestore } from './useFirestore';
import type { Credit, Payment } from '../types';

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

    const addPayment = (creditId: string, amount: number, note?: string) => {
        const credit = credits.find(c => c.id === creditId);
        if (!credit) return;

        const newPayment: Payment = {
            id: crypto.randomUUID(),
            creditId,
            date: new Date().toISOString().split('T')[0],
            amount,
            note
        };

        const payments = credit.payments ? [newPayment, ...credit.payments] : [newPayment];

        // Check if fully paid
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const monthlyRate = credit.interestRate / 100 / 12;
        // Simple calculation for Total To Pay (Principal + Interest over Term)
        // Or if amortized, we might just track balance. 
        // For simple loan tracking, let's assume "Total Expected" is (Monthly Quota * Term)
        const quota = (credit.principal * monthlyRate * Math.pow(1 + monthlyRate, credit.term)) / (Math.pow(1 + monthlyRate, credit.term) - 1);
        const totalToPay = quota * credit.term;

        const newStatus = totalPaid >= (totalToPay - 1) ? 'paid' : 'active'; // Tolerance

        update(creditId, {
            payments,
            status: newStatus
        });
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
