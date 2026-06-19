import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Project, ProjectTransaction, ProjectTask, BudgetLine, Milestone, ProjectDebt } from '../types';
import { db } from '../lib/firebase';
import {
    collection, doc, setDoc, deleteDoc, onSnapshot, query, where
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { useData } from './DataContext';

interface ProjectsContextType {
    projects: Project[];
    addProject: (projectData: Omit<Project, 'id' | 'transactions' | 'status' | 'startDate' | 'tasks' | 'budgetLines' | 'milestones' | 'members'>) => Promise<boolean>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>;
    deleteProject: (id: string) => Promise<void>;
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
    // Collaborative Debt Methods
    addProjectDebt: (projectId: string, debt: Omit<ProjectDebt, 'id' | 'status' | 'createdAt' | 'payments' | 'amount' | 'projectId'>) => void;
    payProjectDebt: (projectId: string, debtId: string, amount: number, paidBy: string, note?: string) => void;
    deleteProjectDebt: (projectId: string, debtId: string) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { data: appData, updateData } = useData();
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        if (!user) {
            setProjects([]);
            return;
        }

        const q = query(
            collection(db, 'projects'),
            where('membersIds', 'array-contains', user.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const loadedProjects: Project[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                loadedProjects.push({
                    ...data,
                    id: doc.id,
                    transactions: data.transactions || [],
                    tasks: data.tasks || [],
                    budgetLines: data.budgetLines || [],
                    milestones: data.milestones || [],
                    members: data.members || [],
                    membersIds: data.membersIds || [],
                    debts: data.debts || []
                } as unknown as Project);
            });
            // Sort by createdAt or name? Let's just keep them as is or sort by name
            loadedProjects.sort((a, b) => a.name.localeCompare(b.name));
            setProjects(loadedProjects);
        }, (error) => {
            console.error("Error fetching projects:", error);
            setProjects([]);
            // toast.error("Error cargando proyectos colaborativos");
        });

        return () => unsub();
    }, [user]);

    const addProject = async (projectData: Omit<Project, 'id' | 'transactions' | 'status' | 'startDate' | 'tasks' | 'budgetLines' | 'milestones' | 'members'>): Promise<boolean> => {
        if (!user) return false;
        const newRef = doc(collection(db, 'projects'));
        const newProject: Project = {
            id: newRef.id,
            ...projectData,
            status: 'planning',
            startDate: new Date().toISOString().split('T')[0],
            transactions: [],
            targetBudget: projectData.targetBudget || 0,
            tasks: [],
            budgetLines: [],
            milestones: [],
            members: [{
                uid: user.uid,
                nickname: user.displayName || 'Usuario', // Fallback, implies we should really fetch the profile
                role: 'owner',
                joinedAt: new Date().toISOString()
            }],
            // Helper for querying
            // @ts-ignore
            membersIds: [user.uid]
        };

        try {
            await setDoc(newRef, newProject);
            toast.success("Proyecto Creado", {
                description: `El proyecto colaborativo "${newProject.name}" se creó con éxito.`
            });
            return true;
        } catch (e: any) {
            console.error(e);
            toast.error("Error al Crear Proyecto", {
                description: e.message || String(e)
            });
            return false;
        }
    };

    const updateProject = async (id: string, updates: Partial<Project>): Promise<boolean> => {
        if (!user) return false;
        try {
            await setDoc(doc(db, 'projects', id), updates, { merge: true });
            return true;
        } catch (e) {
            console.error(e);
            toast.error("Error al Actualizar", {
                description: "No se pudieron guardar los cambios en el proyecto."
            });
            return false;
        }
    };

    const deleteProject = async (id: string) => {
        if (!user) return;

        try {
            await deleteDoc(doc(db, 'projects', id));
            toast.success("Proyecto Eliminado", {
                description: "El proyecto colaborativo ha sido removido con éxito."
            });
        } catch (e) {
            console.error(e);
            toast.error("Error al Eliminar", {
                description: "Ocurrió un problema al intentar borrar el proyecto."
            });
        }
    };

    // --- Sub-collections vs Arrays ---
    // For simplicity in this "Lite" version, we are keeping transactions inside the project document arrays.
    // In a massive app, these should be subcollections 'projects/{id}/transactions'.
    // Given the prompt "que se agregue al proyecto", we assume the existing structure (Arrays) is preferred to avoid massive refactor of UI.

    const addProjectTransaction = async (projectId: string, transaction: Omit<ProjectTransaction, 'id' | 'projectId'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newTx: ProjectTransaction = {
            id: crypto.randomUUID(),
            projectId,
            ...transaction
        };

        let updatedBudgetLines = project.budgetLines;
        if (transaction.type === 'expense' && transaction.budgetLineId) {
            updatedBudgetLines = (project.budgetLines || []).map(line =>
                line.id === transaction.budgetLineId
                    ? { ...line, spentAmount: (line.spentAmount || 0) + transaction.amount }
                    : line
            );
        }

        // Firestore update
        await updateProject(projectId, {
            budgetLines: updatedBudgetLines,
            transactions: [newTx, ...(project.transactions || [])]
        });
    };

    const updateProjectTransaction = async (projectId: string, txId: string, updates: Partial<ProjectTransaction>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedTxs = (project.transactions || []).map(t => t.id === txId ? { ...t, ...updates } : t);
        await updateProject(projectId, { transactions: updatedTxs });
    };

    const deleteProjectTransaction = async (projectId: string, txId: string) => {
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

        const updatedTxs = (project.transactions || []).filter(t => t.id !== txId);
        await updateProject(projectId, {
            transactions: updatedTxs,
            budgetLines: updatedBudgetLines
        });

        // Delete counterpart transaction in main ledger if linked
        if (txToDelete && txToDelete.ledgerTxId) {
            const updatedTransactions = (appData.transactions || []).filter(t => t.id !== txToDelete.ledgerTxId);
            updateData({ transactions: updatedTransactions });
        }
    };

    const getProjectStats = (project: Project) => {
        const txs = project.transactions || [];
        const totalIncome = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const totalExpenses = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const currentBalance = totalIncome - totalExpenses;
        const budget = project.targetBudget || 0;
        const budgetRemaining = budget - totalExpenses;
        const percentConsumed = budget > 0 ? (totalExpenses / budget) * 100 : 0;
        const percentFunded = budget > 0 ? (currentBalance / budget) * 100 : 0;
        return { totalIncome, totalExpenses, currentBalance, budgetRemaining, percentConsumed, percentFunded };
    };

    const addProjectTask = async (projectId: string, description: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const newTask: ProjectTask = {
            id: crypto.randomUUID(),
            projectId,
            description,
            completed: false,
            createdAt: new Date().toISOString()
        };
        await updateProject(projectId, { tasks: [...(project.tasks || []), newTask] });
    };

    const toggleProjectTask = async (projectId: string, taskId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const updatedTasks = (project.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        await updateProject(projectId, { tasks: updatedTasks });
    };

    const deleteProjectTask = async (projectId: string, taskId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const updatedTasks = (project.tasks || []).filter(t => t.id !== taskId);
        await updateProject(projectId, { tasks: updatedTasks });
    };

    const addBudgetLine = async (projectId: string, line: Omit<BudgetLine, 'id'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const newLine = { id: crypto.randomUUID(), ...line };
        const updatedLines = [...(project.budgetLines || []), newLine];
        const newTargetBudget = updatedLines.reduce((acc, l) => acc + l.allocatedAmount, 0);
        await updateProject(projectId, { budgetLines: updatedLines, targetBudget: newTargetBudget });
    };

    const deleteBudgetLine = async (projectId: string, lineId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const updatedLines = (project.budgetLines || []).filter(l => l.id !== lineId);
        const newTargetBudget = updatedLines.reduce((acc, l) => acc + l.allocatedAmount, 0);
        await updateProject(projectId, { budgetLines: updatedLines, targetBudget: newTargetBudget });
    };

    const addMilestone = async (projectId: string, milestone: Omit<Milestone, 'id' | 'status'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const newMilestone = { id: crypto.randomUUID(), status: 'pending' as const, ...milestone };
        await updateProject(projectId, { milestones: [...(project.milestones || []), newMilestone] });
    };

    const toggleMilestone = async (projectId: string, milestoneId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const updatedMilestones = (project.milestones || []).map(m =>
            m.id === milestoneId ? { ...m, status: m.status === 'completed' ? 'pending' : 'completed' } : m
        );
        await updateProject(projectId, { milestones: updatedMilestones as Milestone[] });
    };

    const deleteMilestone = async (projectId: string, milestoneId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const updatedMilestones = (project.milestones || []).filter(m => m.id !== milestoneId);
        await updateProject(projectId, { milestones: updatedMilestones });
    };

    // Collaborative Debt Implementations
    const addProjectDebt = async (projectId: string, debtData: Omit<ProjectDebt, 'id' | 'status' | 'createdAt' | 'payments' | 'amount' | 'projectId'>) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const newDebt: ProjectDebt = {
            id: crypto.randomUUID(),
            projectId,
            ...debtData,
            amount: debtData.principal,
            status: 'active',
            createdAt: new Date().toISOString(),
            payments: []
        };
        await updateProject(projectId, { debts: [...(project.debts || []), newDebt] });
        toast.success("Deuda Registrada", {
            description: `Se registró la deuda "${newDebt.name}" por un valor de ${newDebt.principal.toLocaleString()}.`
        });
    };

    const payProjectDebt = async (projectId: string, debtId: string, amount: number, paidBy: string, note?: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedDebts = (project.debts || []).map(d => {
            if (d.id === debtId) {
                const newPayments = [
                    ...(d.payments || []),
                    {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString().split('T')[0],
                        amount,
                        paidBy,
                        note
                    }
                ];
                const totalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);
                const remainingAmount = Math.max(0, d.principal - totalPaid);
                const status = remainingAmount <= 0 ? 'paid' as const : 'active' as const;

                return {
                    ...d,
                    amount: remainingAmount,
                    status,
                    payments: newPayments
                };
            }
            return d;
        });

        await updateProject(projectId, { debts: updatedDebts });
        toast.success("Abono Registrado", {
            description: `Se abonaron ${amount.toLocaleString()} a la deuda.`
        });
    };

    const deleteProjectDebt = async (projectId: string, debtId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const updatedDebts = (project.debts || []).filter(d => d.id !== debtId);
        await updateProject(projectId, { debts: updatedDebts });
        toast.success("Deuda Eliminada");
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
            deleteMilestone,
            addProjectDebt,
            payProjectDebt,
            deleteProjectDebt
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
