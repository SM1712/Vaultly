import { useData } from '../context/DataContext';
import type { Credit, Payment, Transaction, CreditAdjustment } from '../types';
import { toast } from 'sonner';
import { toCents, fromCents } from '../utils/financialUtils';
import { addMonths } from 'date-fns';

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

export const useCredits = () => {
    const { data, updateData } = useData();
    const credits: Credit[] = data.credits || [];

    // Helper for timezone-safe local date string
    const getLocalDateString = () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const addCredit = (
        creditData: Omit<Credit, 'id' | 'payments' | 'adjustments'> & { type?: 'amortized' | 'dynamic', adjustments?: CreditAdjustment[] }, 
        installmentsPaidToDate: number = 0
    ) => {
        const newCreditId = crypto.randomUUID();
        const type = creditData.type || 'amortized';
        const payments: Payment[] = [];

        // Pre-populate historical payments if they already paid some installments
        if (type === 'amortized' && installmentsPaidToDate > 0) {
            const r = creditData.interestRate;
            const p = creditData.principal;
            const n = creditData.term;
            let quota = 0;
            if (r === 0) {
                quota = p / n;
            } else {
                const monthlyRate = r / 100 / 12;
                quota = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
            }

            const [startY, startM, startD] = creditData.startDate.split('-').map(Number);
            const baseDate = new Date(startY, startM - 1, startD, 12, 0, 0);
            for (let i = 0; i < installmentsPaidToDate; i++) {
                const paymentDate = addMonths(baseDate, i);
                const y = paymentDate.getFullYear();
                const m = String(paymentDate.getMonth() + 1).padStart(2, '0');
                const d = String(paymentDate.getDate()).padStart(2, '0');
                payments.push({
                    id: crypto.randomUUID(),
                    creditId: newCreditId,
                    date: `${y}-${m}-${d}`,
                    amount: Number(quota.toFixed(2)),
                    note: `[Histórico] Cuota ${i + 1} de ${n} pagada previamente`,
                    isPreExisting: true
                });
            }
        }

        const newCredit: Credit = {
            id: newCreditId,
            ...creditData,
            type,
            payments,
            adjustments: creditData.adjustments || [],
            status: 'active'
        };

        // If prepopulated payments settle the entire debt, mark as paid immediately
        const status = getCreditStatus(newCredit);
        if (status.remainingBalance <= 0.05) {
            newCredit.status = 'paid';
        }

        updateData({ credits: [...credits, newCredit] });
    };

    const deleteCredit = (id: string) => {
        const newCredits = credits.filter(c => c.id !== id);
        // Cascade delete: clean up transactions related to this credit
        const newTransactions = (data.transactions || []).filter(t => !(t.relatedTo?.type === 'credit' && t.relatedTo?.id === id));
        updateData({ credits: newCredits, transactions: newTransactions });
        toast.success("Crédito Eliminado", {
            description: "El crédito ha sido eliminado de tu historial y se liberó el saldo correspondiente."
        });
    };

    const updateCredit = (id: string, updates: Partial<Credit>) => {
        const newCredits = credits.map(c => c.id === id ? { ...c, ...updates } : c);
        updateData({ credits: newCredits });
    };

    const addPayment = (
        creditId: string, 
        amount: number, 
        note?: string, 
        skipTransaction: boolean = false, 
        isPreExisting: boolean = false, 
        customDate?: string
    ) => {
        const credit = credits.find(c => c.id === creditId);
        if (!credit) {
            toast.error("Crédito no Encontrado", {
                description: "El crédito especificado no existe o no pudo ser cargado."
            });
            return;
        }

        // 1. Balance safeguard for manual active payments
        if (!skipTransaction && !isPreExisting) {
            const balance = getAvailableBalance(data);
            const currency = data.settings?.currency || '$';
            if (amount > balance) {
                toast.error("Fondos Insuficientes", {
                    description: `Solo tienes ${currency}${balance.toLocaleString()} disponible en Wallet.`
                });
                return;
            }
        }

        const newPaymentId = crypto.randomUUID();
        const todayStr = customDate || getLocalDateString();
        const newPayment: Payment = {
            id: newPaymentId,
            creditId,
            date: todayStr,
            amount: Number(amount),
            note: note || '',
            isPreExisting
        };

        const payments = credit.payments ? [newPayment, ...credit.payments] : [newPayment];

        // Temp credit object to evaluate new status
        const tempCreditForStatus = {
            ...credit,
            payments
        };
        const status = getCreditStatus(tempCreditForStatus);
        const newStatus = status.remainingBalance <= 0.05 ? 'paid' : 'active';

        const updatedCredit = {
            ...credit,
            payments,
            status: newStatus
        };

        const newCredits = credits.map(c => c.id === creditId ? updatedCredit : c);
        const updates: Partial<typeof data> = { credits: newCredits };

        // 2. Synchronize with main transactions ledger (skip if historical/pre-existing)
        if (!skipTransaction && !isPreExisting) {
            const ledgerTx: Transaction = {
                id: newPaymentId,
                type: 'expense',
                amount: amount,
                category: 'Deudas / Créditos',
                date: todayStr,
                description: `Pago Crédito: ${credit.name}${note ? ` (${note})` : ''}`,
                relatedTo: {
                    type: 'credit',
                    id: creditId
                }
            };
            updates.transactions = [...(data.transactions || []), ledgerTx];
        }

        try {
            updateData(updates);
            if (!skipTransaction && !isPreExisting) {
                const currency = data.settings?.currency || '$';
                toast.success("Pago Registrado", {
                    description: `Se registró un pago de ${currency}${amount.toLocaleString()} para el crédito "${credit.name}".`
                });
            }
        } catch (e) {
            console.error("Failed to update credit payment", e);
            toast.error("Error al Registrar", {
                description: "Ocurrió un problema al intentar actualizar el historial de pagos del crédito."
            });
        }
    };

    const addAdjustment = (
        creditId: string, 
        amount: number, 
        type: 'interest' | 'charge', 
        note?: string, 
        customDate?: string
    ) => {
        const credit = credits.find(c => c.id === creditId);
        if (!credit) {
            toast.error("Crédito no Encontrado");
            return;
        }

        const newAdjustment: CreditAdjustment = {
            id: crypto.randomUUID(),
            creditId,
            date: customDate || getLocalDateString(),
            amount: Number(amount),
            type,
            note: note || ''
        };

        const adjustments = credit.adjustments ? [...credit.adjustments, newAdjustment] : [newAdjustment];

        // Evaluate updated balance and status
        const tempCreditForStatus = {
            ...credit,
            adjustments
        };
        const status = getCreditStatus(tempCreditForStatus);
        const newStatus = status.remainingBalance <= 0.05 ? 'paid' : 'active';

        const updatedCredit = {
            ...credit,
            adjustments,
            status: newStatus
        };

        const newCredits = credits.map(c => c.id === creditId ? updatedCredit : c);
        updateData({ credits: newCredits });

        const currency = data.settings?.currency || '$';
        toast.success(type === 'interest' ? "Interés Cargado" : "Cargo Registrado", {
            description: `Se registró un ${type === 'interest' ? 'cobro de interés' : 'cargo adicional'} de ${currency}${amount.toLocaleString()} en la deuda "${credit.name}".`
        });
    };

    const getCreditStatus = (credit: Credit, referenceDate?: Date | string) => {
        const payments = credit.payments || [];
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const type = credit.type || 'amortized';

        if (type === 'dynamic') {
            const adjustments = credit.adjustments || [];
            const totalAdjustments = adjustments.reduce((sum, a) => sum + a.amount, 0);

            const totalToPay = credit.principal + totalAdjustments;
            const remainingBalance = Math.max(0, totalToPay - totalPaid);

            // Suggested minimum payment (e.g. 5% of remaining balance, minimum 10 units, or 0 if fully paid)
            const quota = remainingBalance > 0 ? Math.max(10, remainingBalance * 0.05) : 0;
            const progress = totalToPay > 0 ? (totalPaid / totalToPay) * 100 : 0;

            return {
                totalPaid,
                totalToPay,
                remainingBalance,
                quota,
                progress
            };
        } else {
            // Amortized
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
                if (denom === 0) {
                    quota = p / t;
                } else {
                    quota = (p * monthlyRate * Math.pow(1 + monthlyRate, t)) / denom;
                }
                totalToPay = quota * t;
            }

            const remainingBalance = Math.max(0, totalToPay - totalPaid);
            const progress = totalToPay > 0 ? (totalPaid / totalToPay) * 100 : 0;

            return {
                totalPaid,
                totalToPay,
                remainingBalance,
                quota,
                progress
            };
        }
    };

    return {
        credits,
        addCredit,
        updateCredit,
        deleteCredit,
        addPayment,
        addAdjustment,
        getCreditStatus
    };
};
