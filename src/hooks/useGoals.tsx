import { useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { EmailService } from '../services/EmailService';
import type { Goal, Transaction } from '../types';
import { toCents, fromCents, safeAdd, safeSub } from '../utils/financialUtils';
import { isBefore, isEqual, endOfDay, parseISO } from 'date-fns';
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

export const useGoals = () => {
    const { data, updateData } = useData();
    const { user } = useAuth();
    const { notify } = useNotifications();
    const goals: Goal[] = data.goals || [];

    // --- Helpers defined first to avoid ReferenceError ---
    const getattrContributionsThisMonth = useCallback((goal: Goal, date: Date) => {
        if (!goal.history) return 0;
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();

        let totalCents = 0;
        goal.history.forEach(item => {
            const [y, m] = item.date.split('-').map(Number);
            if (y === targetYear && (m - 1) === targetMonth) {
                if (item.type === 'deposit') totalCents += toCents(item.amount);
                else totalCents -= toCents(item.amount);
            }
        });
        return fromCents(totalCents);
    }, []);

    // --- Actions ---

    const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'currentAmount' | 'history'>) => {
        const newGoal: Goal = {
            id: crypto.randomUUID(),
            ...goalData,
            currentAmount: 0,
            recoveryStrategy: 'spread',
            history: []
        };
        updateData({ goals: [...goals, newGoal] });
    }, [goals, updateData]);

    const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
        const newGoals = goals.map(g => g.id === id ? { ...g, ...updates } : g);
        updateData({ goals: newGoals });
    }, [goals, updateData]);

    const deleteGoal = useCallback((id: string) => {
        const newGoals = goals.filter(g => g.id !== id);
        // Cascade delete: clean up transactions related to this goal
        const newTransactions = (data.transactions || []).filter(t => !(t.relatedTo?.type === 'goal' && t.relatedTo?.id === id));
        updateData({ goals: newGoals, transactions: newTransactions });
        toast.success("Meta Eliminada", {
            description: "La meta de ahorro ha sido eliminada y se liberó su saldo correspondiente."
        });
    }, [goals, data.transactions, updateData]);

    const addContribution = useCallback((id: string, amount: number, note?: string, skipTransaction: boolean = false) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        // 1. Balance safeguard (if not skipped, e.g. manual saving directly from Goals page)
        if (!skipTransaction) {
            const balance = getAvailableBalance(data);
            const currency = data.settings?.currency || '$';
            if (amount > balance) {
                toast.error("Fondos Insuficientes", {
                    description: `Solo tienes ${currency}${balance.toLocaleString()} disponible en Wallet.`
                });
                return;
            }
        }

        const today = new Date().toISOString().split('T')[0];
        const newTxId = crypto.randomUUID();
        const newHistoryItem = {
            id: newTxId,
            date: today,
            amount: amount,
            type: 'deposit' as const,
            note: note || 'Contribución manual'
        };

        const history = goal.history ? [...goal.history, newHistoryItem] : [newHistoryItem];

        // Safe Add
        const newAmount = safeAdd(goal.currentAmount || 0, amount);

        const updatedGoal = {
            ...goal,
            currentAmount: newAmount,
            lastContributionDate: today,
            history
        };

        const newGoals = goals.map(g => g.id === id ? updatedGoal : g);
        const updates: Partial<typeof data> = { goals: newGoals };

        // 2. Synchronize with main transactions ledger
        if (!skipTransaction) {
            const newTx: Transaction = {
                id: newTxId,
                type: 'expense',
                amount: amount,
                category: 'Ahorro / Metas',
                date: today,
                description: `Aporte a Meta: ${goal.name}${note ? ` (${note})` : ''}`,
                relatedTo: {
                    type: 'goal',
                    id: id
                }
            };
            updates.transactions = [...(data.transactions || []), newTx];
        }

        updateData(updates);
        if (!skipTransaction) {
            const currency = data.settings?.currency || '$';
            toast.success("Aporte Registrado", {
                description: `Se aportaron ${currency}${amount.toLocaleString()} a tu meta "${goal.name}".`
            });
        }

        // Check triggers for milestones
        const targetAmount = goal.targetAmount;
        if (targetAmount > 0) {
            const oldPercent = ((goal.currentAmount || 0) / targetAmount) * 100;
            const newPercent = (newAmount / targetAmount) * 100;
            const currency = data.settings?.currency || '$';
            
            // Trigger 50% Milestone
            if (oldPercent < 50 && newPercent >= 50 && newPercent < 100) {
                toast.info("🎯 Meta a Mitad de Camino", {
                    description: `Has alcanzado el 50% (${currency}${newAmount.toLocaleString()} de ${currency}${targetAmount.toLocaleString()}) de tu meta "${goal.name}".`,
                    duration: 6000,
                });

                notify("🎯 Meta al 50%", {
                    body: `Has alcanzado la mitad de tu meta "${goal.name}".`,
                    tag: `goal-milestone-50-${goal.id}`,
                });

                if (user?.email) {
                    const emailPrefs = data.settings?.emailNotifications;
                    const userDisplayName = user.displayName || 'Usuario';
                    EmailService.sendGoalMilestoneEmail(
                        user.email,
                        goal.name,
                        50,
                        newAmount,
                        targetAmount,
                        userDisplayName,
                        emailPrefs
                    ).catch(err => console.error("Milestone email failed", err));
                }
            }
            // Trigger 100% Complete
            else if (oldPercent < 100 && newPercent >= 100) {
                toast.success("🏆 ¡Meta Cumplida!", {
                    description: `¡Felicidades! Has completado el 100% (${currency}${newAmount.toLocaleString()} de ${currency}${targetAmount.toLocaleString()}) de tu meta "${goal.name}".`,
                    duration: 8000,
                });

                notify("🏆 ¡Meta Completada!", {
                    body: `¡Felicidades! Has completado el 100% de tu meta "${goal.name}".`,
                    tag: `goal-milestone-100-${goal.id}`,
                });

                if (user?.email) {
                    const emailPrefs = data.settings?.emailNotifications;
                    const userDisplayName = user.displayName || 'Usuario';
                    EmailService.sendGoalMilestoneEmail(
                        user.email,
                        goal.name,
                        100,
                        newAmount,
                        targetAmount,
                        userDisplayName,
                        emailPrefs
                    ).catch(err => console.error("Goal complete email failed", err));
                }
            }
        }
    }, [goals, data, updateData, user]);

    const withdraw = useCallback((id: string, amount: number, note?: string, recoveryStrategy?: 'spread' | 'catch_up', skipTransaction: boolean = false) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        if (amount > (goal.currentAmount || 0)) {
            const currency = data.settings?.currency || '$';
            toast.error("Retiro Inválido", {
                description: `No puedes retirar más de lo guardado en esta meta (${currency}${(goal.currentAmount || 0).toLocaleString()}).`
            });
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const newTxId = crypto.randomUUID();
        const newHistoryItem = {
            id: newTxId,
            date: today,
            amount: amount,
            type: 'withdrawal' as const,
            note: note || 'Retiro de fondos'
        };

        const history = goal.history ? [...goal.history, newHistoryItem] : [newHistoryItem];

        // Safe Sub
        const newAmount = Math.max(0, safeSub(goal.currentAmount || 0, amount));

        const updatedGoal = {
            ...goal,
            currentAmount: newAmount,
            recoveryStrategy: recoveryStrategy || goal.recoveryStrategy,
            history
        };

        const newGoals = goals.map(g => g.id === id ? updatedGoal : g);
        const updates: Partial<typeof data> = { goals: newGoals };

        // Synchronize withdrawal as main wallet income
        if (!skipTransaction) {
            const newTx: Transaction = {
                id: newTxId,
                type: 'income',
                amount: amount,
                category: 'Ahorro / Metas',
                date: today,
                description: `Retiro de Meta: ${goal.name}${note ? ` (${note})` : ''}`,
                relatedTo: {
                    type: 'goal',
                    id: id
                }
            };
            updates.transactions = [...(data.transactions || []), newTx];
        }

        updateData(updates);
        if (!skipTransaction) {
            const currency = data.settings?.currency || '$';
            toast.success("Retiro Registrado", {
                description: `Se retiraron ${currency}${amount.toLocaleString()} desde tu meta "${goal.name}".`
            });
        }
    }, [goals, data, updateData]);

    const contributeToGoal = useCallback((id: string, amount: number) => {
        addContribution(id, amount, 'Cuota Mensual');
    }, [addContribution]);

    // --- Deterministic Random Helper ---
    const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const getGoalMonthlyWeights = useCallback((goal: Goal): number[] => {
        const start = new Date(goal.startDate);
        const end = new Date(goal.deadline);
        const totalMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);

        // Generate a seed from goal.id
        const seedBase = goal.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const weights = [];
        for (let i = 0; i < totalMonths; i++) {
            const r = pseudoRandom(seedBase + i);
            const weight = 0.8 + (r * 0.6); // Range [0.8, 1.4]
            weights.push(weight);
        }
        return weights;
    }, []);

    // Calculate dynamic monthly quota based on Strategy
    const getMonthlyQuota = useCallback((goal: Goal, referenceDate: Date = new Date(), simulatedAdditionalAmount: number = 0): number => {
        if (!goal.deadline) return 0;

        const dateRef = new Date(referenceDate);
        const deadlineDate = new Date(goal.deadline);
        const startDate = new Date(goal.startDate);

        const currentAmount = safeAdd(goal.currentAmount || 0, simulatedAdditionalAmount);
        const remainingAmount = Math.max(0, safeSub(goal.targetAmount, currentAmount));

        if (remainingAmount <= 0) return 0;

        // LINEAR / LEGACY LOGIC
        const yearsDiff = deadlineDate.getFullYear() - dateRef.getFullYear();
        const monthsDiff = deadlineDate.getMonth() - dateRef.getMonth();
        const monthsRemaining = Math.max(1, (yearsDiff * 12) + monthsDiff);

        // STRATEGY: SPREAD (Default)
        if (goal.recoveryStrategy === 'spread' || !goal.recoveryStrategy) {
            const isCurrentMonth = dateRef.getMonth() === new Date().getMonth() && dateRef.getFullYear() === new Date().getFullYear();
            const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, dateRef) : 0;
            const startOfMonthRemaining = safeAdd(remainingAmount, contributionsThisMonth);

            const amount = startOfMonthRemaining / monthsRemaining;
            return Math.ceil(amount * 100) / 100;
        }

        // STRATEGY: CATCH UP
        const totalMonths = Math.max(1, (deadlineDate.getFullYear() - startDate.getFullYear()) * 12 + (deadlineDate.getMonth() - startDate.getMonth()) + 1);
        const monthsPassed = Math.max(0, (dateRef.getFullYear() - startDate.getFullYear()) * 12 + (dateRef.getMonth() - startDate.getMonth()));

        const idealPerMonth = goal.targetAmount / totalMonths;
        const idealCumulative = idealPerMonth * monthsPassed;

        const isCurrentMonth = dateRef.getMonth() === new Date().getMonth() && dateRef.getFullYear() === new Date().getFullYear();
        const contributionsThisMonth = isCurrentMonth ? getattrContributionsThisMonth(goal, dateRef) : 0;
        const startOfMonthCurrent = safeSub(currentAmount, contributionsThisMonth);

        const deficit = Math.max(0, idealCumulative - startOfMonthCurrent);
        const amount = idealPerMonth + deficit;

        return Math.ceil(amount * 100) / 100;
    }, [getattrContributionsThisMonth]);

    const isGoalPaidThisMonth = useCallback((goal: Goal) => {
        const nav = new Date();
        const contributionsThisMonth = getattrContributionsThisMonth(goal, nav);
        const required = getMonthlyQuota(goal);
        return contributionsThisMonth >= (required * 0.95);
    }, [getattrContributionsThisMonth, getMonthlyQuota]);

    const getTotalSavingsAtDate = useCallback((date: Date) => {
        // Robust End of Period
        const endOfPeriod = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));

        const totalCents = goals.reduce((accCents, goal) => {
            if (!goal.history || goal.history.length === 0) return accCents;

            let gTotalCents = 0;
            goal.history.forEach(item => {
                const iDate = parseISO(item.date);
                if (isBefore(iDate, endOfPeriod) || isEqual(iDate, endOfPeriod)) {
                    if (item.type === 'deposit') gTotalCents += toCents(item.amount);
                    else gTotalCents -= toCents(item.amount);
                }
            });
            return accCents + Math.max(0, gTotalCents);
        }, 0);

        return fromCents(totalCents);
    }, [goals]);

    const getMonthsRemaining = useCallback((goal: Goal) => {
        if (!goal.deadline) return 0;
        const today = new Date();
        const deadlineDate = new Date(goal.deadline);
        const yearsDiff = deadlineDate.getFullYear() - today.getFullYear();
        const monthsDiff = deadlineDate.getMonth() - today.getMonth();
        return Math.max(0, (yearsDiff * 12) + monthsDiff);
    }, []);

    return {
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        addContribution,
        withdraw,
        getMonthlyQuota,
        isGoalPaidThisMonth,
        getTotalSavingsAtDate,
        getMonthsRemaining
    };
};
