import { useState } from 'react';
import { toast } from 'sonner';
import { useGoals } from '../../hooks/useGoals';
import { useFunds } from '../../hooks/useFunds'; // IMPORT ADDED
import { useTransactions } from '../../hooks/useTransactions';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../ui/Modal';
import { Target, ArrowUpCircle, ArrowDownCircle, PiggyBank } from 'lucide-react'; // Added PiggyBank

interface SavingsListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SavingsListModal = ({ isOpen, onClose }: SavingsListModalProps) => {
    const { goals, addContribution, withdraw } = useGoals();
    const { funds, addTransaction: addFundTransaction } = useFunds(); // USE FUNDS
    const { total: totalIncome } = useTransactions('income');
    const { total: totalExpenses } = useTransactions('expense');
    const { currency } = useSettings();

    // Calculate Available Balance Global
    const totalGoalsSaved = goals.reduce((acc, goal) => acc + (goal.currentAmount || 0), 0);
    const totalFundsSaved = funds.reduce((acc, fund) => acc + fund.currentAmount, 0);
    const availableBalance = (totalIncome - totalExpenses) - (totalGoalsSaved + totalFundsSaved); // Updated Calc

    // Local state for transfer form
    const [transferState, setTransferState] = useState<{
        active: boolean;
        type: 'deposit' | 'withdraw';
        targetId: string;
        targetName: string;
        targetType: 'goal' | 'fund';
    }>({
        active: false,
        type: 'deposit',
        targetId: '',
        targetName: '',
        targetType: 'goal'
    });
    const [amount, setAmount] = useState('');

    const handleAction = (type: 'deposit' | 'withdraw', targetId: string, targetName: string, targetType: 'goal' | 'fund') => {
        setTransferState({ active: true, type, targetId, targetName, targetType });
        setAmount('');
    };

    const submitTransfer = () => {
        const val = Number(amount);
        if (!val || val <= 0) return;

        if (transferState.type === 'withdraw') {
            if (transferState.targetType === 'goal') {
                const goal = goals.find(g => g.id === transferState.targetId);
                if (!goal || goal.currentAmount < val) { return toast.error('Fondos insuficientes en la meta.'); }
                withdraw(transferState.targetId, val);
            } else {
                const fund = funds.find(f => f.id === transferState.targetId);
                if (!fund || fund.currentAmount < val) { return toast.error('Fondos insuficientes en el fondo.'); }
                addFundTransaction(transferState.targetId, val, 'withdraw', 'Retiro desde Gestión');
            }
        } else {
            // Deposit
            if (availableBalance < val) {
                return toast.error(`Saldo insuficiente. Disponible: ${currency}${availableBalance.toFixed(2)}`);
            }

            if (transferState.targetType === 'goal') {
                addContribution(transferState.targetId, val, 'Ingreso desde Gestión');
            } else {
                addFundTransaction(transferState.targetId, val, 'deposit', 'Ingreso desde Gestión');
            }
        }
        setTransferState({ ...transferState, active: false });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Ahorros">
            {transferState.active ? (
                // Transfer Form View
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                    <button
                        onClick={() => setTransferState({ ...transferState, active: false })}
                        className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
                    >
                        ← Volver a la lista
                    </button>

                    <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {transferState.type === 'deposit' ? 'Ingresar en' : 'Retirar de'} {transferState.targetName}
                        </h4>
                        <p className="text-sm text-zinc-500">
                            {transferState.type === 'deposit'
                                ? `Disponible: ${currency}${availableBalance.toFixed(2)}`
                                : `Disponible en ${transferState.targetType === 'goal' ? 'meta' : 'fondo'}: ${currency}${transferState.targetType === 'goal'
                                    ? goals.find(g => g.id === transferState.targetId)?.currentAmount.toFixed(2) || '0.00'
                                    : funds.find(f => f.id === transferState.targetId)?.currentAmount.toFixed(2) || '0.00'
                                }`
                            }
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Monto</label>
                        <input
                            type="number"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                            placeholder="0.00"
                            autoFocus
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submitTransfer()}
                        />
                    </div>

                    <button
                        onClick={submitTransfer}
                        className={`w-full py-2 rounded-lg font-medium text-white transition-colors ${transferState.type === 'deposit'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                    >
                        Confirmar
                    </button>
                </div>
            ) : (
                // List View
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                    {/* Goals Section */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Target size={14} /> Metas de Ahorro
                        </h4>
                        {goals.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">No hay metas activas.</p>
                        ) : (
                            goals.map(goal => (
                                <div key={goal.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{goal.name}</p>
                                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                            {currency}{goal.currentAmount.toFixed(2)} <span className="text-[10px] text-zinc-400">/ {currency}{goal.targetAmount.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction('withdraw', goal.id, goal.name, 'goal')}
                                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                            title="Retirar"
                                        >
                                            <ArrowDownCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleAction('deposit', goal.id, goal.name, 'goal')}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                            title="Ingresar"
                                        >
                                            <ArrowUpCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Funds Section */}
                    <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <PiggyBank size={14} /> Fondos Independientes
                        </h4>
                        {funds.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">No hay fondos creados.</p>
                        ) : (
                            funds.map(fund => (
                                <div key={fund.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{fund.name}</p>
                                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                            {currency}{fund.currentAmount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction('withdraw', fund.id, fund.name, 'fund')}
                                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                            title="Retirar"
                                        >
                                            <ArrowDownCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleAction('deposit', fund.id, fund.name, 'fund')}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                            title="Ingresar"
                                        >
                                            <ArrowUpCircle size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default SavingsListModal;
