import { useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { EmailService } from '../services/EmailService';
import type { Transaction, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toCents, fromCents } from '../utils/financialUtils';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNotifications } from '../context/NotificationContext';

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

export const useTransactions = (type?: TransactionType) => {
    const { data, updateData } = useData();
    const { user } = useAuth();
    const { notify } = useNotifications();
    const transactions = data.transactions || [];

    const addTransaction = useCallback((transaction: Omit<Transaction, 'id'> & { id?: string }) => {
        // Balance safeguard for manual expense creation
        if (transaction.type === 'expense') {
            const balance = getAvailableBalance(data);
            if (transaction.amount > balance) {
                toast.error(`Fondos insuficientes. Solo tienes $${balance.toLocaleString()} disponibles.`);
                return null;
            }
        }

        const newId = transaction.id || uuidv4();
        const newTransaction: Transaction = {
            ...transaction,
            id: newId
        } as Transaction;
        updateData({ transactions: [...transactions, newTransaction] });

        // Check category budget triggers
        if (transaction.type === 'expense' && transaction.category) {
            const catName = transaction.category;
            const limitStr = data.projections?.categoryBudgets?.[catName];
            if (limitStr) {
                const limitVal = Number(limitStr);
                if (!isNaN(limitVal) && limitVal > 0) {
                    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                    const oldSpent = transactions.reduce((acc, t) => {
                        if (t.type === 'expense' && t.category === catName && t.date.startsWith(thisMonth)) {
                            return acc + t.amount;
                        }
                        return acc;
                    }, 0);
                    const newSpent = oldSpent + transaction.amount;
                    
                    if (oldSpent <= limitVal && newSpent > limitVal) {
                        const currency = data.settings?.currency || '$';
                        
                        // In-app warning toast
                        toast.warning(`Límite Superado: ${catName}`, {
                            description: `Has gastado ${currency}${newSpent.toLocaleString()} de tu límite de ${currency}${limitVal.toLocaleString()} para la categoría "${catName}".`,
                            duration: 7000,
                        });
                        
                        // Local OS notification
                        notify(`⚠️ Límite de "${catName}" superado`, {
                            body: `Has gastado ${currency}${newSpent.toLocaleString()} de un límite de ${currency}${limitVal.toLocaleString()}.`,
                            tag: `budget-exceeded-${catName}`,
                        });

                        if (user?.email) {
                            const emailPrefs = data.settings?.emailNotifications;
                            const userDisplayName = user.displayName || 'Usuario';
                            EmailService.sendBudgetAlertEmail(
                                user.email,
                                catName,
                                newSpent,
                                limitVal,
                                userDisplayName,
                                emailPrefs
                            ).catch(err => console.error("Budget alert email failed", err));
                        }
                    }
                }
            }
        }

        return newId;
    }, [transactions, data, updateData, user]);

    const deleteTransaction = useCallback((id: string) => {
        const txToDelete = transactions.find(t => t.id === id);
        if (!txToDelete) return;

        let updates: Partial<typeof data> = {};

        // Cascade/Relational Reversion
        if (txToDelete.relatedTo) {
            const { type: relType, id: relId } = txToDelete.relatedTo;

            if (relType === 'goal') {
                const updatedGoals = (data.goals || []).map(goal => {
                    if (goal.id === relId) {
                        const historyItem = goal.history?.find((h: any) => h.id === id);
                        if (!historyItem) return goal;

                        const changeCents = toCents(historyItem.amount);
                        const currentCents = toCents(goal.currentAmount || 0);
                        const newCents = historyItem.type === 'deposit'
                            ? Math.max(0, currentCents - changeCents)
                            : currentCents + changeCents;

                        return {
                            ...goal,
                            currentAmount: fromCents(newCents),
                            history: goal.history?.filter((h: any) => h.id !== id) || []
                        };
                    }
                    return goal;
                });
                updates.goals = updatedGoals;
            } else if (relType === 'fund') {
                const updatedFunds = (data.funds || []).map(fund => {
                    if (fund.id === relId) {
                        const historyItem = fund.history?.find((h: any) => h.id === id);
                        if (!historyItem) return fund;

                        const changeCents = toCents(historyItem.amount);
                        const currentCents = toCents(fund.currentAmount || 0);
                        const newCents = historyItem.type === 'deposit'
                            ? Math.max(0, currentCents - changeCents)
                            : currentCents + changeCents;

                        return {
                            ...fund,
                            currentAmount: fromCents(newCents),
                            history: fund.history?.filter((h: any) => h.id !== id) || []
                        };
                    }
                    return fund;
                });
                updates.funds = updatedFunds;
            } else if (relType === 'credit') {
                const updatedCredits = (data.credits || []).map(credit => {
                    if (credit.id === relId) {
                        const updatedPayments = (credit.payments || []).filter((p: any) => p.id !== id);
                        
                        // Recalculate status
                        const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
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
                            quota = denom === 0 ? p / t : (p * monthlyRate * Math.pow(1 + monthlyRate, t)) / denom;
                            totalToPay = quota * t;
                        }
                        const newStatus = totalPaid >= (totalToPay - 1) ? 'paid' : 'active';

                        return {
                            ...credit,
                            payments: updatedPayments,
                            status: newStatus as 'active' | 'paid'
                        };
                    }
                    return credit;
                });
                updates.credits = updatedCredits;
            } else if (relType === 'project') {
                // Async background delete in Firestore
                const projRef = doc(db, 'projects', relId);
                getDoc(projRef).then(docSnap => {
                    if (docSnap.exists()) {
                        const project = docSnap.data();
                        const updatedTxs = (project.transactions || []).filter((pt: any) => pt.ledgerTxId !== id);
                        updateDoc(projRef, { transactions: updatedTxs })
                            .then(() => toast.success("Transacción eliminada del proyecto colaborativo"))
                            .catch(err => console.error("Error updating project transactions", err));
                    }
                }).catch(err => console.error("Error fetching project for deletion sync", err));
            }
        }

        const newTransactions = transactions.filter(t => t.id !== id);
        updates.transactions = newTransactions;
        updateData(updates);
    }, [transactions, data, updateData]);

    const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
        const txToUpdate = transactions.find(t => t.id === id);
        if (!txToUpdate) return;

        let dataUpdates: Partial<typeof data> = {};

        if (txToUpdate.relatedTo) {
            const { type: relType, id: relId } = txToUpdate.relatedTo;

            if (relType === 'goal') {
                const updatedGoals = (data.goals || []).map(goal => {
                    if (goal.id === relId) {
                        const historyItem = goal.history?.find((h: any) => h.id === id);
                        if (!historyItem) return goal;

                        const oldAmt = txToUpdate.amount;
                        const newAmt = updates.amount !== undefined ? updates.amount : oldAmt;
                        const diff = newAmt - oldAmt;

                        const newCurrentAmount = historyItem.type === 'deposit'
                            ? Math.max(0, goal.currentAmount + diff)
                            : Math.max(0, goal.currentAmount - diff);

                        return {
                            ...goal,
                            currentAmount: newCurrentAmount,
                            history: goal.history?.map((h: any) => {
                                if (h.id === id) {
                                    return {
                                        ...h,
                                        amount: newAmt,
                                        note: updates.description !== undefined ? updates.description : h.note
                                    };
                                }
                                return h;
                            }) || []
                        };
                    }
                    return goal;
                });
                dataUpdates.goals = updatedGoals;
            } else if (relType === 'fund') {
                const updatedFunds = (data.funds || []).map(fund => {
                    if (fund.id === relId) {
                        const historyItem = fund.history?.find((h: any) => h.id === id);
                        if (!historyItem) return fund;

                        const oldAmt = txToUpdate.amount;
                        const newAmt = updates.amount !== undefined ? updates.amount : oldAmt;
                        const diff = newAmt - oldAmt;

                        const newCurrentAmount = historyItem.type === 'deposit'
                            ? Math.max(0, fund.currentAmount + diff)
                            : Math.max(0, fund.currentAmount - diff);

                        return {
                            ...fund,
                            currentAmount: newCurrentAmount,
                            history: fund.history?.map((h: any) => {
                                if (h.id === id) {
                                    return {
                                        ...h,
                                        amount: newAmt,
                                        note: updates.description !== undefined ? updates.description : h.note
                                    };
                                }
                                return h;
                            }) || []
                        };
                    }
                    return fund;
                });
                dataUpdates.funds = updatedFunds;
            } else if (relType === 'credit') {
                const updatedCredits = (data.credits || []).map(credit => {
                    if (credit.id === relId) {
                        const oldAmt = txToUpdate.amount;
                        const newAmt = updates.amount !== undefined ? updates.amount : oldAmt;

                        const updatedPayments = (credit.payments || []).map((p: any) => {
                            if (p.id === id) {
                                return {
                                    ...p,
                                    amount: newAmt,
                                    note: updates.description !== undefined ? updates.description : p.note
                                };
                            }
                            return p;
                        });

                        // Recalculate status
                        const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
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
                            quota = denom === 0 ? p / t : (p * monthlyRate * Math.pow(1 + monthlyRate, t)) / denom;
                            totalToPay = quota * t;
                        }
                        const newStatus = totalPaid >= (totalToPay - 1) ? 'paid' : 'active';

                        return {
                            ...credit,
                            payments: updatedPayments,
                            status: newStatus as 'active' | 'paid'
                        };
                    }
                    return credit;
                });
                dataUpdates.credits = updatedCredits;
            } else if (relType === 'project') {
                const projRef = doc(db, 'projects', relId);
                getDoc(projRef).then(docSnap => {
                    if (docSnap.exists()) {
                        const project = docSnap.data();
                        const updatedTxs = (project.transactions || []).map((pt: any) => {
                            if (pt.ledgerTxId === id) {
                                return {
                                    ...pt,
                                    amount: updates.amount !== undefined ? updates.amount : pt.amount,
                                    description: updates.description !== undefined ? updates.description : pt.description,
                                    category: updates.category !== undefined ? updates.category : pt.category,
                                    date: updates.date !== undefined ? updates.date : pt.date
                                };
                            }
                            return pt;
                        });
                        updateDoc(projRef, { transactions: updatedTxs })
                            .then(() => toast.success("Transacción sincronizada con el proyecto colaborativo"))
                            .catch(err => console.error("Error updating project transactions", err));
                    }
                }).catch(err => console.error("Error fetching project for update sync", err));
            }
        }

        const newTransactions = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        dataUpdates.transactions = newTransactions;
        updateData(dataUpdates);
    }, [transactions, data, updateData]);

    const updateCategory = useCallback((categoryName: string, newCategoryName: string) => {
        const newTransactions = transactions.map(t =>
            t.category === categoryName ? { ...t, category: newCategoryName } : t
        );
        updateData({ transactions: newTransactions });
    }, [transactions, updateData]);

    const filteredTransactions = useMemo(() => type
        ? transactions.filter((t) => t.type === type)
        : transactions
        , [transactions, type]);

    // Use cents for precise total calculation
    const total = useMemo(() => {
        const totalCents = filteredTransactions.reduce((acc, curr) => acc + toCents(curr.amount), 0);
        return fromCents(totalCents);
    }, [filteredTransactions]);

    const getByCategory = useCallback(() => {
        const groupedCents = filteredTransactions.reduce((acc, curr) => {
            const categoryName = curr.category || 'Sin Categoría';
            acc[categoryName] = (acc[categoryName] || 0) + toCents(curr.amount);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(groupedCents).map(([name, valueCents]) => ({
            name,
            value: fromCents(valueCents)
        }));
    }, [filteredTransactions]);

    return {
        transactions: filteredTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        total,
        getByCategory,
        allTransactions: transactions, // For category management if needed
        updateCategory
    };
};
