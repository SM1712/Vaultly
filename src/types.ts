export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    isRecurring?: boolean;
    description: string;
    relatedTo?: {
        type: 'credit' | 'project' | 'goal' | 'fund';
        id: string;
    };
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
    milestones?: Milestone[]; // Added for Goal 2.0 milestones support
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
    ledgerTxId?: string; // Optional: Link to a specific transaction in the main ledger
}

export interface ProjectTask {
    id: string;
    projectId: string;
    description: string;
    completed: boolean;
    createdAt: string;
}

export interface ProjectDebt {
    id: string;
    projectId: string;
    name: string;
    creditor: string; // Nickname of the creditor user (e.g. "@sebastian") or "Banco"
    debtor: string; // Nickname of the debtor user (e.g. "@todos", or specific member)
    amount: number; // Current remaining amount
    principal: number; // Initial amount
    status: 'active' | 'paid';
    createdAt: string;
    interestRate?: number; // Annual interest rate (%)
    term?: number; // Term in months
    payments?: {
        id: string;
        date: string;
        amount: number;
        paidBy: string; // Nickname of the payer
        note?: string;
    }[];
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
    members?: ProjectMember[]; // Optional for backward compatibility, but should be populated
    membersIds?: string[]; // Array of member UIDs for rules and queries
    debts?: ProjectDebt[]; // Collaborative debts array
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
    texture?: 'frost' | 'obsidian' | 'neon'; // Optional: texture style
    history: FundTransaction[];
    autoSaveConfig?: {
        enabled: boolean;
        type: 'fixed' | 'percentage';
        amount: number; // For percentage, 0-100. For fixed, currency amount.
        dayOfMonth: number; // 1-31
        lastProcessedDate?: string; // YYYY-MM-DD
    };
}

export interface Payment {
    id: string;
    creditId: string;
    date: string;
    amount: number;
    note?: string;
    isPreExisting?: boolean; // Para deudas importadas con cuotas pagadas previamente
}

export interface CreditAdjustment {
    id: string;
    creditId: string;
    date: string;
    amount: number;
    note?: string;
    type: 'interest' | 'charge'; // Cargo manual o cobro de interés
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
    type?: 'amortized' | 'dynamic'; // amortized (cuota fija) o dynamic (tarjeta/revolvente)
    adjustments?: CreditAdjustment[]; // cargos e intereses adicionales
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
    date?: string;
}

export interface ProjectionsData {
    simulatedTransactions: SimulatedTransaction[];
    categoryBudgets: Record<string, string>;
    simulatedCreditPayments: string[]; // IDs
    simulatedGoalContributions: string[]; // IDs
    simulatedFundTransfers: Record<string, string>;
    excludedIds: string[];
    activeView: 'structure' | 'scenarios' | 'vision';
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
    relicLore?: string;
    pathType?: string;
}

export interface UserTitle {
    id: string;
    label: string;
    minLevel: number;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'saga';
    target: number;
    current: number;
    xpReward: number;
    xpType: 'saving' | 'discipline' | 'growth';
    completed: boolean;
    claimed?: boolean;
    requirementsDescription?: string;
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
    // Sendas de Gamificación
    savingLevel?: number;
    savingXP?: number;
    disciplineLevel?: number;
    disciplineXP?: number;
    growthLevel?: number;
    growthXP?: number;
    // Misiones y Sagas activas
    activeQuests?: Quest[];
    lastQuestRefresh?: string;
    lastUpdated?: number;
}

export interface NotificationSettings {
    enabled: boolean;
    soundEnabled: boolean;
    dailyReminder: boolean;
    reminderTime?: string; // "HH:MM"
}

export interface EmailNotificationSettings {
    enabled: boolean;
    onGoalReached: boolean;
    onBudgetExceeded: boolean;
    onProjectInvitation: boolean;
    onWeeklySummary: boolean;
    onWeeklyBudgetControl?: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
    theme?: 'claro' | 'oscuro' | 'indigo';
}

export interface AccessibilitySettings {
    fontSize: 'small' | 'medium' | 'large';
    spacing: 'compact' | 'cozy' | 'standard';
    highContrast: boolean;
    soundEffects: boolean;
}

export interface CategoryBudgetRule {
    type: 'fixed' | 'percent_global';
    value: number;
}

export interface SpendingLimitsSettings {
    global: {
        enabled: boolean;
        amount: number;
        period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    };
    rules: Record<string, CategoryBudgetRule>;
    categories: Record<string, number>;
}


export interface SimulatedEmail {
    id: string;
    to: string;
    subject: string;
    bodyHtml: string;
    sentAt: string;
    status: 'sent' | 'failed' | 'queued';
    type: 'test' | 'goal_milestone' | 'budget_warning' | 'project_invitation' | 'weekly_summary' | 'weekly_budget_control';
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
