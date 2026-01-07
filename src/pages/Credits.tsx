import React, { useState } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useSettings } from '../context/SettingsContext';
import { Plus, Trash2, Calendar, DollarSign, Percent, Landmark, CheckCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Credit } from '../types';

import { toast } from 'sonner';
import { useTransactions } from '../hooks/useTransactions';
import { useBalance } from '../hooks/useBalance';

const Credits = () => {
    const { credits, addCredit, deleteCredit, addPayment, getCreditStatus } = useCredits();
    const { currency } = useSettings();
    const { addTransaction } = useTransactions();
    const { currentBalance } = useBalance();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCredit, setNewCredit] = useState({
        name: '',
        principal: '',
        interestRate: '',
        term: '',
        startDate: new Date().toISOString().split('T')[0]
    });

    const [paymentModal, setPaymentModal] = useState<{ open: boolean; creditId: string }>({ open: false, creditId: '' });
    const [paymentAmount, setPaymentAmount] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const principal = Number(newCredit.principal);
        const rate = Number(newCredit.interestRate);
        const term = Number(newCredit.term);

        if (!newCredit.name || principal <= 0 || term <= 0) return;

        addCredit({
            name: newCredit.name,
            principal,
            interestRate: rate,
            term,
            startDate: newCredit.startDate,
            status: 'active'
        });

        setIsCreateOpen(false);
        setNewCredit({
            name: '',
            principal: '',
            interestRate: '',
            term: '',
            startDate: new Date().toISOString().split('T')[0]
        });
        toast.success('Crédito creado exitosamente');
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(paymentAmount);
        if (amount <= 0) return;

        // Use strict current balance from hook
        // @ts-ignore - useBalance is imported but might not be destructured in component yet
        // We will fix the destructuring in the next step or assume it exists if I check the full file.
        // Actually, I need to call useBalance() inside component body, not inside function.
        // I'll assume currentBalance is available in scope or I'll move this logic.
        // WAIT, I can't call hook in event handler.
        // I need to destructure currentBalance at the top of component level.

        if (amount > currentBalance) {
            toast.error(`Saldo insuficiente. Tu saldo disponible es ${currency}${currentBalance.toLocaleString()}`, {
                description: 'Reduce tus gastos o libera fondos de ahorro.'
            });
            return;
        }

        // 1. Record the Payment in the Credit (Decreases Debt)
        addPayment(paymentModal.creditId, amount);

        // 2. Record the Expense in the Main Ledger (Decreases Asset)
        const credit = credits.find(c => c.id === paymentModal.creditId);
        addTransaction({
            amount,
            type: 'expense',
            category: 'Deudas', // Assuming 'Deudas' category exists or is a good default
            description: `Pago Crédito: ${credit?.name || 'Desconocido'}`,
            date: new Date().toISOString().split('T')[0]
        });

        setPaymentModal({ open: false, creditId: '' });
        setPaymentAmount('');
        toast.success('Pago registrado correctamente y descontado del saldo');
    };

    const calculateMonthlyQuota = (principal: number, rate: number, term: number) => {
        if (rate === 0) return principal / term;
        const r = rate / 100 / 12;
        return (principal * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Créditos y Deudas</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Gestiona tus préstamos y planifica tus pagos</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus size={18} />
                    <span>Nuevo Crédito</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {credits.length === 0 ? (
                    // ... (empty state)
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                        <div className="inline-flex p-4 bg-white dark:bg-zinc-900 rounded-full text-zinc-400 mb-4 shadow-sm">
                            <Landmark size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin Créditos Activos</h3>
                        <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
                            Registra un préstamo personal, hipoteca o tarjeta de crédito para llevar el control de tus pagos.
                        </p>
                    </div>
                ) : (
                    credits.map((credit: Credit) => {
                        const status = getCreditStatus(credit);
                        const progress = (status.totalPaid / status.totalToPay) * 100;
                        const monthlyQuota = calculateMonthlyQuota(credit.principal, credit.interestRate, credit.term);
                        const nextPaymentDate = new Date(credit.startDate);
                        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + (credit.payments?.length || 0) + 1);

                        return (
                            <div key={credit.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm dark:shadow-none relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
                                        <Landmark size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        {credit.status === 'paid' && (
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                <CheckCircle size={12} /> PAGADO
                                            </span>
                                        )}
                                        <button
                                            onClick={() => deleteCredit(credit.id)}
                                            className="text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{credit.name}</h3>
                                <div className="flex gap-4 text-sm text-zinc-500 mb-6">
                                    <span className="flex items-center gap-1"><DollarSign size={14} /> {currency}{credit.principal.toLocaleString()}</span>
                                    <span className="flex items-center gap-1"><Percent size={14} /> {credit.interestRate}% Anual</span>
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {credit.term} Meses</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Deuda Restante</span>
                                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{currency}{status.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-500"
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-400">
                                        <span>Pagado: {currency}{status.totalPaid.toLocaleString()}</span>
                                        <span>Total: {currency}{status.totalToPay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                {credit.status === 'active' && (
                                    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase">Cuota Mensual</p>
                                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{currency}{monthlyQuota.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-zinc-500 uppercase">Próx. Pago</p>
                                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                    {format(nextPaymentDate, 'dd MMM yyyy', { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setPaymentModal({ open: true, creditId: credit.id });
                                                setPaymentAmount(monthlyQuota.toFixed(2));
                                            }}
                                            className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Registrar Pago
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Registrar Nuevo Crédito">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-bold">Nombre del Crédito</label>
                        <input
                            required
                            type="text"
                            placeholder="Ej. Préstamo Auto, Hipoteca"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-rose-500 dark:text-white"
                            value={newCredit.name}
                            onChange={e => setNewCredit({ ...newCredit, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Monto Prestado ({currency})</label>
                            <input
                                required
                                type="number"
                                placeholder="0.00"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-rose-500 dark:text-white"
                                value={newCredit.principal}
                                onChange={e => setNewCredit({ ...newCredit, principal: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Tasa Interés Anual (%)</label>
                            <input
                                required
                                type="number"
                                placeholder="Ej. 12"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-rose-500 dark:text-white"
                                value={newCredit.interestRate}
                                onChange={e => setNewCredit({ ...newCredit, interestRate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Plazo (Meses)</label>
                            <input
                                required
                                type="number"
                                placeholder="Ej. 12, 24, 36"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-rose-500 dark:text-white"
                                value={newCredit.term}
                                onChange={e => setNewCredit({ ...newCredit, term: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Fecha Inicio</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-rose-500 dark:text-white"
                                value={newCredit.startDate}
                                onChange={e => setNewCredit({ ...newCredit, startDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg mt-4">
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase mb-1">Resumen</p>
                        <div className="flex justify-between text-sm text-rose-800 dark:text-rose-200">
                            <span>Cuota Estimada:</span>
                            <span className="font-bold">
                                {newCredit.principal && newCredit.term ? (
                                    `${currency}${calculateMonthlyQuota(Number(newCredit.principal), Number(newCredit.interestRate), Number(newCredit.term)).toLocaleString(undefined, { maximumFractionDigits: 2 })} / mes`
                                ) : '-'}
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold transition-colors mt-2"
                    >
                        Crear Crédito
                    </button>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={paymentModal.open} onClose={() => setPaymentModal({ open: false, creditId: '' })} title="Registrar Pago">
                <form onSubmit={handlePayment} className="space-y-4">
                    <p className="text-sm text-zinc-500">
                        Registrar un pago reducirá tu deuda restante. Asegúrate de incluir intereses si aplica.
                    </p>
                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-bold">Monto a Pagar ({currency})</label>
                        <input
                            required
                            autoFocus
                            type="number"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-emerald-500 dark:text-white"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors mt-2"
                    >
                        Confirmar Pago
                    </button>
                </form>
            </Modal>
        </div >
    );
};

export default Credits;
