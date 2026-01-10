import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useFunds } from './useFunds';
import { useCredits } from './useCredits';
import { useProjects } from './useProjects';
import type { TransactionType } from '../types';

export interface LedgerEntry {
    id: string;
    originalId: string;
    date: string;
    description: string;
    amount: number;
    type: TransactionType; // 'income' | 'expense' generally, or specific details
    source: 'transaction' | 'fund' | 'credit' | 'project';
    category: string;
    // Metadata for specific sources
    fundName?: string;
    creditName?: string;
    projectName?: string;
    icon?: string;
}

export const useLedger = () => {
    const { allTransactions } = useTransactions();
    const { funds } = useFunds();
    const { credits } = useCredits();
    const { projects } = useProjects();

    const ledgerEntries = useMemo(() => {
        let entries: LedgerEntry[] = [];

        // 1. Regular Transactions
        const txEntries: LedgerEntry[] = allTransactions.map(t => ({
            id: `tx-${t.id}`,
            originalId: t.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            source: 'transaction',
            category: t.category,
            icon: t.category === 'Food' ? 'utensils' : 'dollar' // Placeholder logic, usually handled by UI
        }));
        entries = [...entries, ...txEntries];

        // 2. Fund Transactions (History)
        funds.forEach(fund => {
            if (fund.history) {
                const fundEntries: LedgerEntry[] = fund.history.map(h => ({
                    id: `fund-${h.id}`,
                    originalId: h.id,
                    date: h.date,
                    description: h.type === 'deposit' ? `Ingreso a Fondo: ${fund.name}` : `Retiro de Fondo: ${fund.name}`,
                    amount: h.amount,
                    type: h.type === 'deposit' ? 'expense' : 'income', // From wallet perspective? 
                    // Wait. Ledger is usually "Global Record".
                    // Debit (Money leaving main wallet) -> Deposit to Fund -> Expense?
                    // Credit (Money entering main wallet) -> Withdraw from Fund -> Income?
                    // Let's stick to Flow:
                    // Deposit into Fund = Money used/saved = Expense relative to "Available".
                    // Withdraw from Fund = Money available = Income relative to "Available".
                    // BUT for a Ledger, it might be internal transfer.
                    // However, Vaultly treats Funds as "money set aside".
                    // So Deposit -> Expense (technically Transfer Out).
                    // Withdraw -> Income (technically Transfer In).
                    source: 'fund',
                    category: 'Ahorro / Fondos',
                    fundName: fund.name,
                    icon: fund.icon
                }));
                entries = [...entries, ...fundEntries];
            }
        });

        // 3. Credit Payments
        credits.forEach(credit => {
            if (credit.payments) {
                const creditEntries: LedgerEntry[] = credit.payments.map(p => ({
                    id: `credit-${p.id}`,
                    originalId: p.id,
                    date: p.date,
                    description: `Pago Crédito: ${credit.name}`,
                    amount: p.amount,
                    type: 'expense',
                    source: 'credit',
                    category: 'Deudas / Créditos',
                    creditName: credit.name
                }));
                entries = [...entries, ...creditEntries];
            }
        });

        // 4. Project Transactions
        projects.forEach(project => {
            if (project.transactions) {
                const projectEntries: LedgerEntry[] = project.transactions.map(pt => ({
                    id: `proj-${pt.id}`,
                    originalId: pt.id,
                    date: pt.date,
                    description: `Proyecto [${project.name}]: ${pt.description}`,
                    amount: pt.amount,
                    type: pt.type,
                    source: 'project',
                    category: pt.category || 'Proyecto',
                    projectName: project.name
                }));
                entries = [...entries, ...projectEntries];
            }
        });

        // Sort by Date Descending
        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [allTransactions, funds, credits, projects]);

    return { ledgerEntries };
};
