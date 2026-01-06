import { createContext, useContext, useEffect, type ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
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
    const [projects, setProjects] = useLocalStorage<Project[]>('vault_projects', []);

    // --- Data Migration for Legacy Projects ---
    useEffect(() => {
        let hasChanges = false;
        const migratedProjects = projects.map((p: any) => {
            if (!p.transactions || p.budget !== undefined) {
                hasChanges = true;
                const newProject: Project = {
                    ...p,
                    transactions: p.transactions || [],
                    targetBudget: p.targetBudget ?? p.budget ?? 0,
                    status: p.status === 'hold' ? 'paused' : (p.status || 'active'),
                    startDate: p.startDate || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
                };

                if (p.spent && p.spent > 0 && newProject.transactions.length === 0) {
                    newProject.transactions.push({
                        id: crypto.randomUUID(),
                        projectId: p.id,
                        date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
                        description: 'Saldo inicial (Migración)',
                        amount: p.spent,
                        type: 'expense'
                    });
                }

                delete newProject['budget' as keyof Project];
                delete newProject['spent' as keyof Project];

                return newProject;
            }
            return p;
        });

        if (hasChanges) {
            console.log('Migrating legacy projects...', migratedProjects);
            setProjects(migratedProjects);
        }
    }, [projects, setProjects]);

    const addProject = (projectData: Omit<Project, 'id' | 'transactions' | 'status' | 'startDate'>) => {
        const newProject: Project = {
            ...projectData,
            id: crypto.randomUUID(),
            status: 'planning',
            startDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
            transactions: []
        };
        setProjects([...projects, newProject]);
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects(projects.map(p =>
            p.id === id ? { ...p, ...updates } : p
        ));
    };

    const deleteProject = (id: string) => {
        setProjects(projects.filter(p => p.id !== id));
    };

    const addProjectTransaction = (projectId: string, transaction: Omit<ProjectTransaction, 'id' | 'projectId'>) => {
        setProjects(projects.map(p => {
            if (p.id === projectId) {
                const newTx: ProjectTransaction = {
                    ...transaction,
                    id: crypto.randomUUID(),
                    projectId
                };
                return { ...p, transactions: [newTx, ...p.transactions] };
            }
            return p;
        }));
    };

    const deleteProjectTransaction = (projectId: string, txId: string) => {
        setProjects(projects.map(p => {
            if (p.id === projectId) {
                return { ...p, transactions: p.transactions.filter(t => t.id !== txId) };
            }
            return p;
        }));
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
