import { useData } from '../context/DataContext';
import type { ProjectionsData, SimulatedTransaction } from '../types';

export const useProjections = () => {
    const { data, updateData } = useData();
    // Fallback to default structure if projections doesn't exist (e.g. old data version)
    const projections: ProjectionsData = data.projections || {
        simulatedTransactions: [],
        categoryBudgets: {},
        simulatedCreditPayments: [],
        simulatedGoalContributions: [],
        simulatedFundTransfers: {},
        toggles: {
            includeGlobalBalance: true,
            includeFundsInBalance: false,
            autoIncludeScheduled: true
        }
    };

    const updateProjections = (updates: Partial<ProjectionsData>) => {
        updateData({
            projections: {
                ...projections,
                ...updates
            }
        });
    };

    const addSimulatedTransaction = (tx: SimulatedTransaction) => {
        updateProjections({
            simulatedTransactions: [...projections.simulatedTransactions, tx]
        });
    };

    const removeSimulatedTransaction = (id: string) => {
        updateProjections({
            simulatedTransactions: projections.simulatedTransactions.filter(t => t.id !== id)
        });
    };

    const updateSimulatedTransaction = (id: string, updates: Partial<SimulatedTransaction>) => {
        updateProjections({
            simulatedTransactions: projections.simulatedTransactions.map(t =>
                t.id === id ? { ...t, ...updates } : t
            )
        });
    };

    const clearSimulation = () => {
        updateProjections({
            simulatedTransactions: [],
            categoryBudgets: {},
            simulatedCreditPayments: [],
            simulatedGoalContributions: [],
            simulatedFundTransfers: {}
        });
    };

    const setCategoryBudgets = (budgets: Record<string, string>) => {
        updateProjections({ categoryBudgets: budgets });
    };

    const setSimulatedCreditPayments = (ids: string[]) => {
        updateProjections({ simulatedCreditPayments: ids });
    };

    const setSimulatedGoalContributions = (ids: string[]) => {
        updateProjections({ simulatedGoalContributions: ids });
    };

    const setSimulatedFundTransfers = (transfers: Record<string, string>) => {
        updateProjections({ simulatedFundTransfers: transfers });
    };

    const setToggle = (key: keyof ProjectionsData['toggles'], value: boolean) => {
        updateProjections({
            toggles: {
                ...projections.toggles,
                [key]: value
            }
        });
    };

    const toggleExclusion = (id: string) => {
        const currentExcluded = new Set(projections.excludedIds || []);
        if (currentExcluded.has(id)) {
            currentExcluded.delete(id);
        } else {
            currentExcluded.add(id);
        }
        updateProjections({ excludedIds: Array.from(currentExcluded) });
    };

    const setActiveView = (view: 'structure' | 'scenarios') => {
        updateProjections({ activeView: view });
    };

    return {
        projections,
        addSimulatedTransaction,
        removeSimulatedTransaction,
        clearSimulation,
        setCategoryBudgets,
        setSimulatedCreditPayments,
        setSimulatedGoalContributions,
        setSimulatedFundTransfers,
        setToggle,
        toggleExclusion,
        setActiveView,
        updateSimulatedTransaction
    };
};
