import { createContext, useContext, type ReactNode } from 'react';
import { useData } from './DataContext';
import type { Project, ProjectTransaction, ProjectTask, BudgetLine, Milestone } from '../types';

interface ProjectsContextType {
    projects: Project[];
    addProject: (projectData: Omit<Project, 'id' | 'transactions' | 'status' | 'startDate'>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    addProjectTransaction: (projectId: string, transaction: Omit<ProjectTransaction, 'id' | 'projectId'>) => void;
    updateProjectTransaction: (projectId: string, txId: string, updates: Partial<ProjectTransaction>) => void;
    deleteProjectTransaction: (projectId: string, txId: string) => void;
    getProjectStats: (project: Project) => {
        totalIncome: number;
        totalExpenses: number;
        currentBalance: number;
        budgetRemaining: number;
        percentConsumed: number;
        percentFunded: number;
    };
    addProjectTask: (projectId: string, description: string) => void;
    toggleProjectTask: (projectId: string, taskId: string) => void;
    deleteProjectTask: (projectId: string, taskId: string) => void;
    // New Methods for Project 2.0
    addBudgetLine: (projectId: string, line: Omit<BudgetLine, 'id'>) => void;
    deleteBudgetLine: (projectId: string, lineId: string) => void;
    addMilestone: (projectId: string, milestone: Omit<Milestone, 'id' | 'status'>) => void;
    toggleMilestone: (projectId: string, milestoneId: string) => void;
    deleteMilestone: (projectId: string, milestoneId: string) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
    const { data, updateData } = useData();
    const projects = data.projects || [];

    const addProject = (projectData: Omit<Project, 'id' | 'transactions' | 'status' | 'startDate' | 'tasks' | 'budgetLines' | 'milestones'>) => {
        const newProject: Project = {
            id: crypto.randomUUID(),
            ...projectData,
            status: 'planning',
            startDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
            transactions: [],
            targetBudget: projectData.targetBudget || 0,
            tasks: [],
            budgetLines: [],
            milestones: []
        };
        updateData({ projects: [newProject, ...projects] });
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        const newProjects = projects.map(p => p.id === id ? { ...p, ...updates } : p);
        updateData({ projects: newProjects });
    };

    const deleteProject = (id: string) => {
        const newProjects = projects.filter(p => p.id !== id);
        updateData({ projects: newProjects });
    };

    const addProjectTransaction = (projectId: string, transaction: Omit<ProjectTransaction, 'id' | 'projectId'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newTx: ProjectTransaction = {
            id: crypto.randomUUID(),
            projectId,
            ...transaction
        };

        let updatedBudgetLines = project.budgetLines;
        // If expense is linked to a BudgetLine (Fund), update spentAmount
        if (transaction.type === 'expense' && transaction.budgetLineId) {
            updatedBudgetLines = (project.budgetLines || []).map(line =>
                line.id === transaction.budgetLineId
                    ? { ...line, spentAmount: (line.spentAmount || 0) + transaction.amount }
                    : line
            );
        }

        const updatedProject = {
            ...project,
            budgetLines: updatedBudgetLines,
            transactions: [newTx, ...(project.transactions || [])]
        };

        updateProject(projectId, updatedProject);
    };

    const updateProjectTransaction = (projectId: string, txId: string, updates: Partial<ProjectTransaction>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedProject = {
            ...project,
            transactions: (project.transactions || []).map(t => t.id === txId ? { ...t, ...updates } : t)
        };

        updateProject(projectId, updatedProject);
    };

    const deleteProjectTransaction = (projectId: string, txId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const txToDelete = project.transactions.find(t => t.id === txId);

        let updatedBudgetLines = project.budgetLines;
        if (txToDelete && txToDelete.type === 'expense' && txToDelete.budgetLineId) {
            updatedBudgetLines = (project.budgetLines || []).map(line =>
                line.id === txToDelete.budgetLineId
                    ? { ...line, spentAmount: Math.max(0, (line.spentAmount || 0) - txToDelete.amount) }
                    : line
            );
        }

        const updatedProject = {
            ...project,
            budgetLines: updatedBudgetLines,
            transactions: (project.transactions || []).filter(t => t.id !== txId)
        };

        updateProject(projectId, updatedProject);
    };

    const getProjectStats = (project: Project) => {
        const txs = project.transactions || [];
        const totalIncome = txs
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const totalExpenses = txs
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        const currentBalance = totalIncome - totalExpenses;
        const budget = project.targetBudget || (project as any).budget || 0;
        const budgetRemaining = budget - totalExpenses;
        const percentConsumed = budget > 0 ? (totalExpenses / budget) * 100 : 0;
        const percentFunded = budget > 0 ? (currentBalance / budget) * 100 : 0;

        return { totalIncome, totalExpenses, currentBalance, budgetRemaining, percentConsumed, percentFunded };
    };

    const addProjectTask = (projectId: string, description: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newTask: ProjectTask = {
            id: crypto.randomUUID(),
            projectId,
            description,
            completed: false,
            createdAt: new Date().toISOString()
        };

        updateProject(projectId, { tasks: [...(project.tasks || []), newTask] });
    };

    const toggleProjectTask = (projectId: string, taskId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedTasks = (project.tasks || []).map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        updateProject(projectId, { tasks: updatedTasks });
    };

    const deleteProjectTask = (projectId: string, taskId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedTasks = (project.tasks || []).filter(t => t.id !== taskId);
        updateProject(projectId, { tasks: updatedTasks });
    };

    // --- Implementation of New Methods ---

    const addBudgetLine = (projectId: string, line: Omit<BudgetLine, 'id'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newLine: BudgetLine = {
            id: crypto.randomUUID(),
            ...line
        };
        const updatedLines = [...(project.budgetLines || []), newLine];
        // Optional: Update targetBudget automatically if it matches sum? keeping it manual for now or updating it.
        // User asked for flexible budgets. Let's update targetBudget to match sum of lines if lines exist.
        const newTargetBudget = updatedLines.reduce((acc, l) => acc + l.allocatedAmount, 0);

        updateProject(projectId, {
            budgetLines: updatedLines,
            targetBudget: newTargetBudget
        });
    };

    const deleteBudgetLine = (projectId: string, lineId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedLines = (project.budgetLines || []).filter(l => l.id !== lineId);
        const newTargetBudget = updatedLines.reduce((acc, l) => acc + l.allocatedAmount, 0);

        updateProject(projectId, {
            budgetLines: updatedLines,
            targetBudget: newTargetBudget
        });
    };

    const addMilestone = (projectId: string, milestone: Omit<Milestone, 'id' | 'status'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newMilestone: Milestone = {
            id: crypto.randomUUID(),
            status: 'pending',
            ...milestone
        };

        updateProject(projectId, { milestones: [...(project.milestones || []), newMilestone] });
    };

    const toggleMilestone = (projectId: string, milestoneId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedMilestones = (project.milestones || []).map(m =>
            m.id === milestoneId ? { ...m, status: m.status === 'completed' ? 'pending' : 'completed' } : m
        ) as Milestone[]; // cast to avoiding type inference issues with string literal

        updateProject(projectId, { milestones: updatedMilestones });
    };

    const deleteMilestone = (projectId: string, milestoneId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedMilestones = (project.milestones || []).filter(m => m.id !== milestoneId);
        updateProject(projectId, { milestones: updatedMilestones });
    };

    return (
        <ProjectsContext.Provider value={{
            projects,
            addProject,
            updateProject,
            deleteProject,
            addProjectTransaction,
            updateProjectTransaction,
            deleteProjectTransaction,
            getProjectStats,
            addProjectTask,
            toggleProjectTask,
            deleteProjectTask,
            addBudgetLine,
            deleteBudgetLine,
            addMilestone,
            toggleMilestone,
            deleteMilestone
        }}>
            {children}
        </ProjectsContext.Provider>
    );
};

export const useProjects = () => {
    const context = useContext(ProjectsContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectsProvider');
    }
    return context;
};
