import { useData } from '../context/DataContext';
import type { Credit, Payment } from '../types';
import { toast } from 'sonner';

export const useCredits = () => {
    const { data, updateData } = useData();
    const credits: Credit[] = data.credits || [];

    const addCredit = (creditData: Omit<Credit, 'id' | 'payments'>) => {
        const newCredit: Credit = {
            id: crypto.randomUUID(),
            ...creditData,
            payments: []
        };
        updateData({ credits: [...credits, newCredit] });
    };

    const deleteCredit = (id: string) => {
        const newCredits = credits.filter(c => c.id !== id);
        updateData({ credits: newCredits });
    };

    const updateCredit = (id: string, updates: Partial<Credit>) => {
        const newCredits = credits.map(c => c.id === id ? { ...c, ...updates } : c);
        updateData({ credits: newCredits });
    };

    const addPayment = (creditId: string, amount: number, note?: string) => {
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

        // Recalculate full debt logic (simplified for replication)
        const monthlyRate = credit.interestRate / 100 / 12;
        let quota = 0;
        let totalToPay = 0;

        if (credit.interestRate === 0) {
            quota = credit.principal / credit.term;
            totalToPay = credit.principal;
        } else {
            const p = Number(credit.principal);
            const t = Number(credit.term);
            const denom = Math.pow(1 + monthlyRate, t) - 1;
            if (denom === 0) { // Safety
                quota = p / t;
            } else {
                quota = (p * monthlyRate * Math.pow(1 + monthlyRate, t)) / denom;
            }
            totalToPay = quota * t;
        }

        const newStatus = totalPaid >= (totalToPay - 1) ? 'paid' : 'active';

        const updatedCredit = {
            ...credit,
            payments,
            status: newStatus
        };

        const newCredits = credits.map(c => c.id === creditId ? updatedCredit : c);

        try {
            updateData({ credits: newCredits });
            // toast.success("Pago registrado");
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
        updateCredit,
        deleteCredit,
        addPayment,
        getCreditStatus
    };
};
