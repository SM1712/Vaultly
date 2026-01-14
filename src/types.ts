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
    recoveryStrategy?: 'spread' | 'catch_up';
    calculationMethod?: 'dynamic' | 'static';
    history?: {
        id: string;
        date: string;
        amount: number;
        type: 'deposit' | 'withdrawal';
        note?: string;
    }[];
}

export interface BudgetLine {
    id: string;
    name: string;
    allocatedAmount: number;
    spentAmount: number;
}

export interface Milestone {
    id: string;
    title: string;
    targetDate?: string;
    status: 'pending' | 'completed';
    expectedOutcome?: string;
}

export interface ProjectTransaction {
    id: string;
    projectId: string;
    date: string; // ISO Date
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
    fundingSource?: 'internal' | 'external'; // internal = Wallet/Main Balance, external = Investor/Client
    budgetLineId?: string; // Optional: Link to a specific BudgetLine (Fund)
}

export interface ProjectTask {
    id: string;
    projectId: string;
    description: string;
    completed: boolean;
    createdAt: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
    startDate: string;
    deadline?: string;
    targetBudget: number; // Presupuesto Global o Suma de Partidas
    transactions: ProjectTransaction[];
    tasks: ProjectTask[];
    budgetLines: BudgetLine[];
    milestones: Milestone[];
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

// --- Gamification Types ---

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucide icon name or Emoji
    rarity: AchievementRarity;
    xpReward: number;
    condition?: string; // Human readable condition description
    isHidden?: boolean; // If true, only shows details after unlocking
}

export interface UserTitle {
    id: string;
    label: string;
    minLevel: number;
}

export interface UserProfile {
    level: number;
    currentXP: number;
    nextLevelXP: number; // Calculated helper, might not need to be stored if constant
    currentTitle: string;
    unlockedAchievements: {
        achievementId: string;
        unlockedAt: string; // ISO Date
    }[];
    stats: {
        totalTransactions: number;
        perfectBudgetMonths: number;
        savingsStreak: number;
    };
    avatar?: string; // Base64 or URL
}

export interface NotificationSettings {
    enabled: boolean;
    soundEnabled: boolean;
    dailyReminder: boolean;
    reminderTime?: string; // "HH:MM"
}

// Collaboration Types
export interface PublicProfile {
    uid: string;
    nickname: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
    createdAt: string;
}

export interface ProjectMember {
    uid: string;
    nickname: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: string;
}

export interface ProjectInvitation {
    id: string;
    projectId: string;
    projectName: string;
    fromUid: string;
    fromNickname: string;
    toNickname: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}
