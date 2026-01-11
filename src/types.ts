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
    currentAmount: number;
    startDate: string; // ISO Date "YYYY-MM-DD"
    deadline: string; // ISO Date "YYYY-MM-DD"
    icon?: string; // Emoji or Icon name
    lastContributionDate?: string;
    isCompletedForMonth?: boolean;
    history?: {
        id: string;
        date: string;
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

export interface Payment {
    id: string;
    creditId: string;
    date: string;
    amount: number;
    note?: string;
}

export interface Credit {
    id: string;
    name: string;
    principal: number; // Monto inicial prestado
    interestRate: number; // % anual
    term: number; // meses
    startDate: string; // YYYY-MM-DD
    status: 'active' | 'paid';
    payments?: Payment[];
}

export interface ScheduledTransaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    dayOfMonth: number; // 1-31
    lastProcessedDate?: string; // YYYY-MM-DD
    active: boolean;
    createdAt: string;
}

export interface Preset {
    id: string;
    label: string; // e.g. "Coca Cola"
    amount?: number; // Optional
    category: string;
    type: 'income' | 'expense';
    icon?: string; // Emoji
}

export interface SimulatedTransaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
}

export interface ProjectionsData {
    simulatedTransactions: SimulatedTransaction[];
    categoryBudgets: Record<string, string>;
    simulatedCreditPayments: string[]; // IDs
    simulatedGoalContributions: string[]; // IDs
    simulatedFundTransfers: Record<string, string>;
    toggles: {
        includeGlobalBalance: boolean;
        includeFundsInBalance: boolean;
        autoIncludeScheduled: boolean;
    };
}
