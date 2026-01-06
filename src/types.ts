export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    isRecurring?: boolean;
    description: string;
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    months: number;
    currentAmount: number; // Monto actual ahorrado (total)
    lastContributionDate?: string; // Fecha de la última "cuota" pagada
    isCompletedForMonth?: boolean; // Si ya cumplió este mes (opcional, derivado)
    history?: {
        id: string;
        date: string; // YYYY-MM-DD
        amount: number;
        type: 'deposit' | 'withdrawal';
        note?: string;
    }[];
}

export interface ProjectTransaction {
    id: string;
    projectId: string;
    date: string; // ISO Date
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
    startDate: string;
    deadline?: string;
    targetBudget: number; // Presupuesto Objetivo
    transactions: ProjectTransaction[];
}

export interface FundTransaction {
    id: string;
    fundId: string;
    date: string;
    amount: number;
    type: 'deposit' | 'withdraw';
    note?: string;
}

export interface Fund {
    id: string;
    name: string;
    icon: string; // Identifier for the icon (e.g., 'gift', 'heart')
    currentAmount: number;
    description?: string;
    color?: string; // Optional: custom color for the card/icon
    history: FundTransaction[];
}
