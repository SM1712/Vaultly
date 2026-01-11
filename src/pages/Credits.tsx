import React, { useState } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useSettings } from '../context/SettingsContext';
import { Plus, Trash2, Calendar, DollarSign, Percent, Landmark, CheckCircle, Pencil } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Credit } from '../types';

import { toast } from 'sonner';
import { useTransactions } from '../hooks/useTransactions';
import { useBalance } from '../hooks/useBalance';

const Credits = () => {
    const { credits, addCredit, deleteCredit, addPayment, getCreditStatus, updateCredit } = useCredits();
    const { currency } = useSettings();
    const { addTransaction } = useTransactions();
    const { currentBalance } = useBalance();

    // UI States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
    const [calcTarget, setCalcTarget] = useState<'quota' | 'rate'>('quota'); // Advanced: what are we calculating?

    // Form States
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Simple Mode Inputs
    const [simpleQuota, setSimpleQuota] = useState('');
    const [simpleTerm, setSimpleTerm] = useState('');

    // Advanced Mode Inputs
    const [advPrincipal, setAdvPrincipal] = useState('');
    const [advTerm, setAdvTerm] = useState('');
    const [advRate, setAdvRate] = useState('');
    const [advQuota, setAdvQuota] = useState('');

    const [paymentModal, setPaymentModal] = useState<{ open: boolean; creditId: string }>({ open: false, creditId: '' });
    const [paymentAmount, setPaymentAmount] = useState('');

    // --- Helpers ---

    const calculateQuota = (p: number, r: number, n: number) => {
        if (p <= 0 || n <= 0) return 0;
        if (r === 0) return p / n;
        const monthlyRate = r / 100 / 12;
        return (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    };

    // Binary Search to find Interest Rate given Principal, Quota, and Term
    const solveInterestRate = (p: number, q: number, n: number) => {
        if (p <= 0 || n <= 0 || q <= 0) return 0;
        if (q * n <= p) return 0; // Impossible to have positive interest if Total Paid <= Principal

        let min = 0;
        let max = 1000; // 1000% annual interest cap
        let guess = 0;

        for (let i = 0; i < 20; i++) { // 20 iterations is plenty for precision
            guess = (min + max) / 2;
            const calcQ = calculateQuota(p, guess, n);
            if (Math.abs(calcQ - q) < 0.01) return guess;
            if (calcQ > q) max = guess;
            else min = guess;
        }
        return guess;
    };

    // --- Handlers ---

    const resetForm = () => {
        setName('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setMode('simple');
        setSimpleQuota('');
        setSimpleTerm('');
        setAdvPrincipal('');
        setAdvTerm('');
        setAdvRate('');
        setAdvQuota('');
        setEditingCreditId(null);
        setCalcTarget('quota');
    };

    const openCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEdit = (credit: Credit) => {
        resetForm();
        setEditingCreditId(credit.id);
        setName(credit.name);
        setStartDate(credit.startDate);

        // Decide mode based on interest rate
        // If 0% interest, likely "simple" mode was used (or it's 0% loan)
        // If >0%, likely advanced.
        if (credit.interestRate === 0) {
            setMode('simple');
            setSimpleTerm(credit.term.toString());
            // Quota is Principal / Term
            setSimpleQuota((credit.principal / credit.term).toFixed(2));

            // Also populate advanced just in case user switches
            setAdvPrincipal(credit.principal.toString());
            setAdvTerm(credit.term.toString());
            setAdvRate('0');
        } else {
            setMode('advanced');
            setAdvPrincipal(credit.principal.toString());
            setAdvTerm(credit.term.toString());
            setAdvRate(credit.interestRate.toString());
            // Calc quota to populate
            const q = calculateQuota(credit.principal, credit.interestRate, credit.term);
            setAdvQuota(q.toFixed(2));
        }

        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalPrincipal = 0;
        let finalRate = 0;
        let finalTerm = 0;

        if (mode === 'simple') {
            const q = Number(simpleQuota);
            const t = Number(simpleTerm);
            if (q <= 0 || t <= 0) {
                toast.error("Por favor completa los campos correctamente");
                return;
            }
            finalPrincipal = q * t;
            finalRate = 0;
            finalTerm = t;
        } else {
            // Advanced
            finalPrincipal = Number(advPrincipal);
            finalTerm = Number(advTerm);
            if (finalPrincipal <= 0 || finalTerm <= 0) {
                toast.error("Principal y Plazo son requeridos");
                return;
            }

            if (calcTarget === 'quota') {
                // User provided Rate, we trust it
                finalRate = Number(advRate);
            } else {
                // User provided Quota, we solved Rate
                const targetQ = Number(advQuota);
                if (targetQ <= 0) {
                    toast.error("Cuota requerida");
                    return;
                }
                finalRate = solveInterestRate(finalPrincipal, targetQ, finalTerm);
            }
        }

        if (!name) return;

        const creditData = {
            name,
            principal: finalPrincipal,
            interestRate: finalRate,
            term: finalTerm,
            startDate,
        };

        if (editingCreditId) {
            updateCredit(editingCreditId, creditData);
            toast.success('Crédito actualizado');
        } else {
            addCredit({ ...creditData, status: 'active' });
            toast.success('Crédito creado');
        }

        setIsCreateOpen(false);
    };

    // Calculate Dynamic Values for Preview
    const previewQuota = mode === 'simple'
        ? Number(simpleQuota) || 0
        : calcTarget === 'quota'
            ? calculateQuota(Number(advPrincipal), Number(advRate) || 0, Number(advTerm))
            : Number(advQuota) || 0;

    const previewTotal = mode === 'simple'
        ? (Number(simpleQuota) * Number(simpleTerm)) || 0
        : (previewQuota * Number(advTerm)) || 0;

    const previewPrincipal = mode === 'simple'
        ? previewTotal
        : Number(advPrincipal) || 0;

    const previewRate = mode === 'simple'
        ? 0
        : calcTarget === 'quota'
            ? Number(advRate) || 0
            : solveInterestRate(Number(advPrincipal), Number(advQuota), Number(advTerm));


    // Payment Handler
    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(paymentAmount);
        if (amount <= 0) return;

        if (amount > currentBalance) {
            toast.error(`Saldo insuficiente (${currency}${currentBalance.toLocaleString()})`);
            return;
        }

        addPayment(paymentModal.creditId, amount);

        const credit = credits.find(c => c.id === paymentModal.creditId);
        addTransaction({
            amount,
            type: 'expense',
            category: 'Deudas',
            description: `Pago Crédito: ${credit?.name}`,
            date: new Date().toISOString().split('T')[0]
        });

        setPaymentModal({ open: false, creditId: '' });
        setPaymentAmount('');
        toast.success('Pago registrado');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Créditos y Deudas</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        Controla tus compromisos financieros.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-5 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-zinc-900/10 dark:shadow-none"
                >
                    <Plus size={18} />
                    <span>Nuevo Crédito</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {credits.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col items-center">
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-full text-zinc-300 dark:text-zinc-700 mb-6 shadow-sm">
                            <Landmark size={48} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Sin Créditos Activos</h3>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            Registra préstamos personales, hipotecas o compras a cuotas para no perder de vista ningún pago.
                        </p>
                    </div>
                ) : (
                    credits.map((credit: Credit) => {
                        const status = getCreditStatus(credit);
                        const progress = Math.min((status.totalPaid / status.totalToPay) * 100, 100);
                        const nextPaymentDate = new Date(credit.startDate);
                        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + (credit.payments?.length || 0) + 1);

                        return (
                            <div key={credit.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
                                        <Landmark size={24} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(credit)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-500 transition-colors">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => deleteCredit(credit.id)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 truncate" title={credit.name}>{credit.name}</h3>
                                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                        <span className="flex items-center gap-1"><DollarSign size={12} /> {currency}{credit.principal.toLocaleString()}</span>
                                        <span className="flex items-center gap-1"><Percent size={12} /> {credit.interestRate.toFixed(1)}%</span>
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {credit.term} Meses</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-zinc-500">Saldo Pendiente</span>
                                        <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{currency}{status.remainingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>

                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-zinc-400 font-mono">
                                        <span>Pagado: {Math.round(progress)}%</span>
                                        <span>Total: {currency}{status.totalToPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>

                                {credit.status === 'active' && (
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-zinc-400">Cuota Mensual</p>
                                                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{currency}{status.quota.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-zinc-400">Vence</p>
                                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{format(nextPaymentDate, 'dd MMM', { locale: es })}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setPaymentModal({ open: true, creditId: credit.id });
                                                setPaymentAmount(status.quota.toFixed(2));
                                            }}
                                            className="w-full py-2.5 bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <CheckCircle size={16} className="text-emerald-500" />
                                            Registrar Pago
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={editingCreditId ? "Editar Crédito" : "Nuevo Crédito"} maxWidth="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nombre</label>
                            <input
                                required
                                type="text"
                                placeholder="Ej. Préstamo Coche"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all dark:text-white"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Fecha Inicio</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all dark:text-white"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setMode('simple')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'simple' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                        >
                            Modo Simple
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('advanced')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'advanced' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                        >
                            Modo Avanzado
                        </button>
                    </div>

                    {mode === 'simple' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                                💡 Ingresa cuánto pagarás al mes y por cuánto tiempo. Calcularemos el total automáticamente.
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cuota Mensual ({currency})</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        className="w-full text-xl font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:border-rose-500 focus:outline-none dark:text-white"
                                        value={simpleQuota}
                                        onChange={e => setSimpleQuota(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Plazo (Meses)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="12"
                                        className="w-full text-xl font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:border-rose-500 focus:outline-none dark:text-white"
                                        value={simpleTerm}
                                        onChange={e => setSimpleTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Monto Préstamo ({currency})</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="10000"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 dark:text-white"
                                        value={advPrincipal}
                                        onChange={e => setAdvPrincipal(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Plazo (Meses)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="24"
                                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 dark:text-white"
                                        value={advTerm}
                                        onChange={e => setAdvTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="calcTarget"
                                            checked={calcTarget === 'quota'}
                                            onChange={() => setCalcTarget('quota')}
                                            className="text-rose-600 focus:ring-rose-500"
                                        />
                                        <span>Conozco la Tasa (%)</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="calcTarget"
                                            checked={calcTarget === 'rate'}
                                            onChange={() => setCalcTarget('rate')}
                                            className="text-rose-600 focus:ring-rose-500"
                                        />
                                        <span>Conozco la Cuota Fija</span>
                                    </label>
                                </div>

                                {calcTarget === 'quota' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tasa Interés Anual (%)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Ej. 15.5"
                                            className="w-full text-lg font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 focus:border-rose-500 focus:outline-none dark:text-white"
                                            value={advRate}
                                            onChange={e => setAdvRate(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cuota Mensual Fija ({currency})</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Ej. 500"
                                            className="w-full text-lg font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 focus:border-rose-500 focus:outline-none dark:text-white"
                                            value={advQuota}
                                            onChange={e => setAdvQuota(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Summary Preview */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-xs uppercase text-zinc-400 font-bold mb-1">Total a Devolver</p>
                                <p className="text-lg font-bold text-zinc-900 dark:text-white">{currency}{previewTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase text-zinc-400 font-bold mb-1">Interés Total</p>
                                <p className={`text-lg font-bold ${previewTotal - previewPrincipal > 0 ? 'text-rose-500' : 'text-zinc-500'}`}>
                                    {currency}{(previewTotal - previewPrincipal).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-1">
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-sm text-zinc-500">Tasa Efectiva Anual (Estimada)</span>
                                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">{previewRate.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 py-3.5 rounded-xl font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-zinc-900/10 dark:shadow-none"
                    >
                        {editingCreditId ? 'Guardar Cambios' : 'Crear Crédito'}
                    </button>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={paymentModal.open} onClose={() => setPaymentModal({ open: false, creditId: '' })} title="Registrar Pago">
                <form onSubmit={handlePayment} className="space-y-4">
                    <p className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        Al registrar este pago, reduciremos tu deuda y crearemos un gasto en la categoría "Deudas".
                    </p>
                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-bold">Monto a Pagar ({currency})</label>
                        <input
                            required
                            autoFocus
                            type="number"
                            className="w-full text-2xl font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 mt-2 focus:outline-none focus:border-emerald-500 dark:text-white"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-colors mt-2 shadow-lg shadow-emerald-600/20"
                    >
                        Confirmar Pago
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Credits;
