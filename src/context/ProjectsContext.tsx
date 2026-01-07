import { createContext, useContext, type ReactNode } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import type { Project, ProjectTransaction } from '../types';

interface ProjectsContextType {
    projects: Project[];
    addProject: (projectData: Omit<Project, 'id' | 'transactions' | 'status' | 'startDate'>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    addProjectTransaction: (projectId: string, transaction: Omit<ProjectTransaction, 'id' | 'projectId'>) => void;
    deleteProjectTransaction: (projectId: string, txId: string) => void;
    getProjectStats: (project: Project) => {
        totalIncome: number;
        totalExpenses: number;
        currentBalance: number;
        percentConsumed: number;
    };
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
    const { data: projects, add, remove, update } = useFirestore<Project>('projects');

    const addProject = (projectData: Omit<Project, 'id' | 'transactions' | 'status' | 'startDate'>) => {
        const newProject = {
            ...projectData,
            status: 'planning',
            startDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
            transactions: []
        };
        add(newProject);
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        update(id, updates);
    };

    const deleteProject = (id: string) => {
        remove(id);
    };

    const addProjectTransaction = (projectId: string, transaction: Omit<ProjectTransaction, 'id' | 'projectId'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newTx: ProjectTransaction = {
            ...transaction,
            id: crypto.randomUUID(),
            projectId
        };

        const currentTx = project.transactions || [];
        update(projectId, { transactions: [newTx, ...currentTx] });
    };

    const deleteProjectTransaction = (projectId: string, txId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const currentTx = project.transactions || [];
        const newTx = currentTx.filter(t => t.id !== txId);

        update(projectId, { transactions: newTx });
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
        const percentConsumed = budget > 0 ? (totalExpenses / budget) * 100 : 0;

        return { totalIncome, totalExpenses, currentBalance, percentConsumed };
    };

    return (
        <ProjectsContext.Provider value={{
            projects,
            addProject,
            updateProject,
            deleteProject,
            addProjectTransaction,
            deleteProjectTransaction,
            getProjectStats
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
