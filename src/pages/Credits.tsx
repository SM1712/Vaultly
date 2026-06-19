import React, { useState, useEffect } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useSettings } from '../context/SettingsContext';
import { 
    Plus, Trash2, Calendar, DollarSign, Percent, Landmark, 
    CheckCircle, Pencil, Info, ShieldAlert, Sparkles, TrendingDown,
    Zap, ArrowRight, ShieldCheck, HelpCircle, Download, FileText, PlusCircle, ArrowLeft, Layers
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Credit } from '../types';
import { toast } from 'sonner';
import { useBalance } from '../hooks/useBalance';
import { DatePicker } from '../components/ui/DatePicker';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Timezone-safe local date string helper
const getLocalDateString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Timezone-safe local date formatter helper
const formatLocalDate = (dateStr: string, formatStr: string = 'dd MMM yyyy') => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    try {
        return format(date, formatStr, { locale: es });
    } catch (e) {
        return dateStr;
    }
};

const Credits = () => {
    const { credits, addCredit, deleteCredit, addPayment, addAdjustment, getCreditStatus, updateCredit } = useCredits();
    const { currency } = useSettings();
    const { currentBalance } = useBalance();

    // UI States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creationStep, setCreationStep] = useState<number>(1);
    const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
    const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
    const [calcTarget, setCalcTarget] = useState<'quota' | 'rate'>('quota');
    const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
    const [rightPanelTab, setRightPanelTab] = useState<'details' | 'extra' | 'strategies'>('details');

    // Form States
    const [name, setName] = useState('');
    const [creditType, setCreditType] = useState<'amortized' | 'dynamic'>('amortized');
    const [hasPreExistingHistory, setHasPreExistingHistory] = useState<boolean>(false);
    const [installmentsPaidToDate, setInstallmentsPaidToDate] = useState<number>(0);
    const [startDate, setStartDate] = useState(getLocalDateString());

    // Simple Mode Inputs
    const [simpleQuota, setSimpleQuota] = useState('');
    const [simpleTerm, setSimpleTerm] = useState('');

    // Advanced Mode Inputs
    const [advPrincipal, setAdvPrincipal] = useState('');
    const [advTerm, setAdvTerm] = useState('');
    const [advRate, setAdvRate] = useState('');
    const [advQuota, setAdvQuota] = useState('');

    // Payment State
    const [paymentModal, setPaymentModal] = useState<{ open: boolean; creditId: string }>({ open: false, creditId: '' });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [paymentDate, setPaymentDate] = useState(getLocalDateString());

    // Adjustment Modal State
    const [adjustmentModal, setAdjustmentModal] = useState<{ open: boolean; creditId: string }>({ open: false, creditId: '' });
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentType, setAdjustmentType] = useState<'interest' | 'charge'>('interest');
    const [adjustmentNote, setAdjustmentNote] = useState('');
    const [adjustmentDate, setAdjustmentDate] = useState(getLocalDateString());

    // Delete Confirmation
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; creditId: string | null }>({ isOpen: false, creditId: null });
    const [showPaid, setShowPaid] = useState(false);

    // Simulator States
    const [extraPaymentSim, setExtraPaymentSim] = useState({ oneTime: '0', monthly: '0' });
    const [extraStrategyBuffer, setExtraStrategyBuffer] = useState(200); // extra monthly pool slider

    // Set first credit as selected if none is selected
    useEffect(() => {
        if (credits.length > 0 && !selectedCreditId) {
            const active = credits.find(c => c.status !== 'paid') || credits[0];
            setSelectedCreditId(active.id);
        }
    }, [credits, selectedCreditId]);

    // Helpers
    const calculateQuota = (p: number, r: number, n: number) => {
        if (p <= 0 || n <= 0) return 0;
        if (r === 0) return p / n;
        const monthlyRate = r / 100 / 12;
        return (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    };

    const solveInterestRate = (p: number, q: number, n: number) => {
        if (p <= 0 || n <= 0 || q <= 0) return 0;
        if (q * n <= p) return 0;

        let min = 0;
        let max = 1000;
        let guess = 0;

        for (let i = 0; i < 20; i++) {
            guess = (min + max) / 2;
            const calcQ = calculateQuota(p, guess, n);
            if (Math.abs(calcQ - q) < 0.01) return guess;
            if (calcQ > q) max = guess;
            else min = guess;
        }
        return guess;
    };

    const resetForm = () => {
        setName('');
        setStartDate(getLocalDateString());
        setMode('simple');
        setCreditType('amortized');
        setHasPreExistingHistory(false);
        setInstallmentsPaidToDate(0);
        setSimpleQuota('');
        setSimpleTerm('');
        setAdvPrincipal('');
        setAdvTerm('');
        setAdvRate('');
        setAdvQuota('');
        setEditingCreditId(null);
        setCalcTarget('quota');
        setCreationStep(1);
    };

    const openCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEdit = (credit: Credit, e: React.MouseEvent) => {
        e.stopPropagation();
        resetForm();
        setEditingCreditId(credit.id);
        setName(credit.name);
        setStartDate(credit.startDate);
        setCreditType(credit.type || 'amortized');

        if (credit.type === 'dynamic') {
            setAdvPrincipal(credit.principal.toString());
            setAdvRate(credit.interestRate.toString());
        } else {
            if (credit.interestRate === 0) {
                setMode('simple');
                setSimpleTerm(credit.term.toString());
                setSimpleQuota((credit.principal / credit.term).toFixed(2));
                setAdvPrincipal(credit.principal.toString());
                setAdvTerm(credit.term.toString());
                setAdvRate('0');
            } else {
                setMode('advanced');
                setAdvPrincipal(credit.principal.toString());
                setAdvTerm(credit.term.toString());
                setAdvRate(credit.interestRate.toString());
                const q = calculateQuota(credit.principal, credit.interestRate, credit.term);
                setAdvQuota(q.toFixed(2));
            }
        }

        setIsCreateOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalPrincipal = 0;
        let finalRate = 0;
        let finalTerm = 0;

        if (creditType === 'dynamic') {
            finalPrincipal = Number(advPrincipal);
            finalRate = Number(advRate) || 0;
            finalTerm = 0; // Dynamic has no fixed term

            if (finalPrincipal <= 0) {
                toast.error("Datos Requeridos", {
                    description: "El Monto Inicial debe ser mayor a cero."
                });
                return;
            }
        } else {
            if (mode === 'simple') {
                const q = Number(simpleQuota);
                const t = Number(simpleTerm);
                if (q <= 0 || t <= 0) {
                    toast.error("Datos Requeridos", {
                        description: "Por favor completa los campos de cuota y plazo correctamente."
                    });
                    return;
                }
                finalPrincipal = q * t;
                finalRate = 0;
                finalTerm = t;
            } else {
                finalPrincipal = Number(advPrincipal);
                finalTerm = Number(advTerm);
                if (finalPrincipal <= 0 || finalTerm <= 0) {
                    toast.error("Datos Requeridos", {
                        description: "Los campos de Capital Principal y Plazo (Meses) son requeridos y deben ser mayores a cero."
                    });
                    return;
                }

                if (calcTarget === 'quota') {
                    finalRate = Number(advRate);
                } else {
                    const targetQ = Number(advQuota);
                    if (targetQ <= 0) {
                        toast.error("Cuota Requerida", {
                            description: "Por favor define la cuota mensual objetivo para poder calcular la tasa de interés."
                        });
                        return;
                    }
                    finalRate = solveInterestRate(finalPrincipal, targetQ, finalTerm);
                }
            }
        }

        if (!name) return;

        const creditData = {
            name,
            principal: finalPrincipal,
            interestRate: finalRate,
            term: finalTerm,
            startDate,
            type: creditType
        };

        if (editingCreditId) {
            updateCredit(editingCreditId, creditData);
            toast.success("Deuda Actualizada", {
                description: `Los datos de la deuda "${name}" han sido modificados.`
            });
        } else {
            addCredit({ ...creditData, status: 'active' }, (creditType === 'amortized' && hasPreExistingHistory) ? installmentsPaidToDate : 0);
            toast.success("Deuda Registrada", {
                description: `La nueva deuda "${name}" ha sido agregada a tu portafolio.`
            });
        }

        setIsCreateOpen(false);
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(paymentAmount);
        if (amount <= 0) return;

        if (amount > currentBalance) {
            toast.error("Saldo Insuficiente", {
                description: `Solo tienes ${currency}${currentBalance.toLocaleString()} disponible en Wallet.`
            });
            return;
        }

        addPayment(paymentModal.creditId, amount, paymentNote, false, false, paymentDate);

        setPaymentModal({ open: false, creditId: '' });
        setPaymentAmount('');
        setPaymentNote('');
        setPaymentDate(getLocalDateString());
    };

    const handleAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(adjustmentAmount);
        if (amount <= 0) return;

        addAdjustment(adjustmentModal.creditId, amount, adjustmentType, adjustmentNote, adjustmentDate);

        setAdjustmentModal({ open: false, creditId: '' });
        setAdjustmentAmount('');
        setAdjustmentNote('');
        setAdjustmentDate(getLocalDateString());
        setAdjustmentType('interest');
    };

    // PDF Exporter
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const currencySym = currency || '$';
        
        // Premium Dark Header block
        doc.setFillColor(24, 24, 27); // zinc-900
        doc.rect(0, 0, 210, 42, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('VAULTLY FINANCE', 15, 18);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(161, 161, 170); // zinc-400
        doc.text('Reporte Consolidado de Créditos y Deudas', 15, 26);
        doc.text(`Fecha de Emisión: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 32);
        
        // Summary Cards / Portafolio Stats
        doc.setFillColor(244, 244, 245); // zinc-100
        doc.rect(15, 48, 85, 25, 'F');
        doc.rect(110, 48, 85, 25, 'F');
        
        doc.setTextColor(113, 113, 122); // zinc-500
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL DEUDA PENDIENTE', 20, 56);
        doc.text('PAGO MENSUAL COMPROMETIDO', 115, 56);
        
        doc.setTextColor(24, 24, 27); // zinc-900
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`${currencySym}${totalRemainingDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, 65);
        doc.text(`${currencySym}${totalMonthlyCommitment.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 115, 65);
        
        // Summary Table of Credits
        const tableData = credits.map((c, index) => {
            const status = getCreditStatus(c);
            const typeStr = c.type === 'dynamic' ? 'Dinámica' : 'Amortizada';
            return [
                index + 1,
                c.name,
                typeStr,
                `${c.interestRate.toFixed(2)}%`,
                c.type === 'dynamic' ? 'Revolvente' : `${c.term} meses`,
                `${currencySym}${c.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                `${currencySym}${status.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                `${currencySym}${status.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                `${Math.round(status.progress)}%`
            ];
        });
        
        doc.setFontSize(11);
        doc.setTextColor(24, 24, 27);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen de Cartera de Deudas', 15, 84);
        
        autoTable(doc, {
            startY: 88,
            head: [['#', 'Nombre', 'Tipo', 'Tasa (TEA)', 'Plazo', 'Monto Original', 'Total Pagado', 'Saldo Restante', 'Progreso']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { fontStyle: 'bold' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right', fontStyle: 'bold' },
                8: { halign: 'center' }
            }
        });
        
        let currentY = (doc as any).lastAutoTable.finalY + 12;
        
        // Detailed Ledgers per Credit
        credits.forEach((c) => {
            const status = getCreditStatus(c);
            if (currentY > 230) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(24, 24, 27);
            doc.text(`Libro de Movimientos: ${c.name} (${c.type === 'dynamic' ? 'Deuda Dinámica' : 'Amortización Fija'})`, 15, currentY);
            currentY += 4;
            
            // Build ledger events chronologically
            const movementsList: { date: string; description: string; amount: number; type: 'deposit' | 'charge' | 'interest' }[] = [];
            
            movementsList.push({
                date: c.startDate,
                description: 'Saldo / Deuda Inicial',
                amount: c.principal,
                type: 'charge'
            });
            
            (c.payments || []).forEach(p => {
                movementsList.push({
                    date: p.date,
                    description: p.note || 'Abono / Pago de cuota',
                    amount: p.amount,
                    type: 'deposit'
                });
            });
            
            (c.adjustments || []).forEach(a => {
                movementsList.push({
                    date: a.date,
                    description: a.note || (a.type === 'interest' ? 'Cobro de Interés' : 'Cargo adicional'),
                    amount: a.amount,
                    type: a.type
                });
            });
            
            movementsList.sort((a, b) => a.date.localeCompare(b.date));
            
            const movementRows = movementsList.map(m => {
                let amountStr = '';
                let typeLabel = '';
                if (m.type === 'deposit') {
                    amountStr = `-${currencySym}${m.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    typeLabel = 'Abono (-)';
                } else {
                    amountStr = `+${currencySym}${m.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    typeLabel = m.type === 'interest' ? 'Interés (+)' : 'Cargo (+)';
                }
                
                const [yr, mn, dy] = m.date.split('-');
                return [
                    `${dy}/${mn}/${yr}`,
                    m.description,
                    typeLabel,
                    amountStr
                ];
            });
            
            autoTable(doc, {
                startY: currentY,
                head: [['Fecha', 'Detalle / Concepto', 'Tipo de Movimiento', 'Monto']],
                body: movementRows,
                theme: 'plain',
                styles: { fontSize: 7, cellPadding: 2 },
                headStyles: { fillColor: [113, 113, 122], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 25 },
                    2: { fontStyle: 'bold' },
                    3: { halign: 'right', fontStyle: 'bold' }
                }
            });
            
            currentY = (doc as any).lastAutoTable.finalY + 12;
        });
        
        doc.save(`vaultly-reporte-deudas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success("Reporte Exportado", {
            description: "El informe en PDF ha sido generado y descargado con éxito."
        });
    };

    // Selected credit status
    const selectedCredit = credits.find(c => c.id === selectedCreditId);
    const selectedStatus = selectedCredit ? getCreditStatus(selectedCredit) : null;

    // Amortization Timeline for Selected Credit (Amortized only)
    const generateAmortizationTimeline = (credit: Credit, extraMonthly: number = 0, extraOneTime: number = 0) => {
        const rate = credit.interestRate / 100 / 12;
        const term = credit.term;
        let balance = credit.principal;
        const timeline = [];

        let baseQuota = 0;
        if (rate === 0) {
            baseQuota = credit.principal / term;
        } else {
            baseQuota = (credit.principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
        }

        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;

        for (let month = 1; month <= term && balance > 0.01; month++) {
            const interest = balance * rate;
            let principal = baseQuota - interest;
            
            let extra = extraMonthly;
            if (month === 1) {
                extra += extraOneTime;
            }

            let actualPayment = baseQuota + extra;
            if (actualPayment > balance + interest) {
                actualPayment = balance + interest;
                principal = balance;
            } else {
                principal = actualPayment - interest;
            }

            balance = Math.max(0, balance - principal);
            totalInterestPaid += interest;
            totalPrincipalPaid += principal;

            timeline.push({
                name: `Mes ${month}`,
                balance: Math.round(balance),
                interes: Math.round(totalInterestPaid),
                principal: Math.round(totalPrincipalPaid)
            });
        }
        return timeline;
    };

    // Running Balance history for Dynamic Credits
    const getBalanceHistory = (credit: Credit) => {
        const movementsList: { date: string; amount: number; type: string }[] = [];
        
        movementsList.push({
            date: credit.startDate,
            amount: credit.principal,
            type: 'initial'
        });

        (credit.payments || []).forEach(p => {
            movementsList.push({
                date: p.date,
                amount: p.amount,
                type: 'payment'
            });
        });

        (credit.adjustments || []).forEach(a => {
            movementsList.push({
                date: a.date,
                amount: a.amount,
                type: a.type
            });
        });

        movementsList.sort((a, b) => a.date.localeCompare(b.date));

        let balance = 0;
        return movementsList.map((m) => {
            if (m.type === 'payment') {
                balance = Math.max(0, balance - m.amount);
            } else {
                balance += m.amount;
            }
            const [, mon, d] = m.date.split('-');
            const label = `${d}/${mon}`;
            return {
                name: label,
                balance: Math.round(balance),
                amount: m.amount,
                type: m.type
            };
        });
    };

    const chartData = selectedCredit && selectedCredit.type !== 'dynamic'
        ? generateAmortizationTimeline(selectedCredit, Number(extraPaymentSim.monthly) || 0, Number(extraPaymentSim.oneTime) || 0)
        : [];

    const dynamicChartData = selectedCredit && selectedCredit.type === 'dynamic'
        ? getBalanceHistory(selectedCredit)
        : [];

    const simTimeline = selectedCredit && selectedCredit.type !== 'dynamic' ? generateAmortizationTimeline(selectedCredit, Number(extraPaymentSim.monthly) || 0, Number(extraPaymentSim.oneTime) || 0) : [];
    const baseTimeline = selectedCredit && selectedCredit.type !== 'dynamic' ? generateAmortizationTimeline(selectedCredit, 0, 0) : [];
    
    const monthsSaved = Math.max(0, baseTimeline.length - simTimeline.length);
    const interestSaved = selectedCredit && selectedCredit.type !== 'dynamic' && baseTimeline.length > 0 && simTimeline.length > 0
        ? Math.max(0, baseTimeline[baseTimeline.length - 1].interes - simTimeline[simTimeline.length - 1].interes)
        : 0;

    // Debt Snowball vs Avalanche multi-debt simulator
    const simulateDebtStrategy = (strategy: 'snowball' | 'avalanche' | 'baseline', extraPool: number) => {
        const activeDebts = credits.map(c => {
            const status = getCreditStatus(c);
            const rate = c.interestRate / 100 / 12;
            return {
                id: c.id,
                name: c.name,
                balance: status.remainingBalance,
                rate: rate,
                quota: status.quota,
                interestRate: c.interestRate
            };
        }).filter(d => d.balance > 0.05);

        if (activeDebts.length === 0) return { months: 0, totalInterest: 0, logs: [] };

        let month = 0;
        let cumulativeInterest = 0;
        const logs = [];

        while (activeDebts.some(d => d.balance > 0.05) && month < 360) {
            month++;
            
            let monthlyInterest = 0;
            activeDebts.forEach(d => {
                if (d.balance > 0) {
                    const interest = d.balance * d.rate;
                    d.balance += interest;
                    monthlyInterest += interest;
                    cumulativeInterest += interest;
                }
            });

            let totalMinQuota = 0;
            activeDebts.forEach(d => {
                if (d.balance > 0) {
                    totalMinQuota += Math.min(d.quota, d.balance);
                }
            });

            let pool = totalMinQuota + (strategy === 'baseline' ? 0 : extraPool);

            activeDebts.forEach(d => {
                if (d.balance > 0) {
                    const pay = Math.min(d.quota, d.balance);
                    d.balance -= pay;
                    pool -= pay;
                }
            });

            if (pool > 0 && strategy !== 'baseline') {
                const targetDebts = [...activeDebts].filter(d => d.balance > 0);
                if (targetDebts.length > 0) {
                    if (strategy === 'snowball') {
                        targetDebts.sort((a, b) => a.balance - b.balance);
                    } else if (strategy === 'avalanche') {
                        targetDebts.sort((a, b) => b.interestRate - a.interestRate);
                    }

                    const target = targetDebts[0];
                    const extraPayment = Math.min(pool, target.balance);
                    target.balance -= extraPayment;
                }
            }

            logs.push({
                month,
                remaining: activeDebts.reduce((sum, d) => sum + d.balance, 0),
                interest: cumulativeInterest
            });
        }

        return {
            months: month,
            totalInterest: cumulativeInterest,
            logs
        };
    };

    // Strategy results
    const activeCreditsCount = credits.filter(c => getCreditStatus(c).remainingBalance > 0).length;
    const snowballResult = simulateDebtStrategy('snowball', extraStrategyBuffer);
    const avalancheResult = simulateDebtStrategy('avalanche', extraStrategyBuffer);
    const baselineResult = simulateDebtStrategy('baseline', 0);

    // Preview calculations for modal creation
    const previewQuota = creditType === 'dynamic' 
        ? 0 
        : mode === 'simple'
            ? Number(simpleQuota) || 0
            : calcTarget === 'quota'
                ? calculateQuota(Number(advPrincipal), Number(advRate) || 0, Number(advTerm))
                : Number(advQuota) || 0;

    const previewTotal = creditType === 'dynamic'
        ? Number(advPrincipal) || 0
        : mode === 'simple'
            ? (Number(simpleQuota) * Number(simpleTerm)) || 0
            : (previewQuota * Number(advTerm)) || 0;

    const previewPrincipal = creditType === 'dynamic'
        ? Number(advPrincipal) || 0
        : mode === 'simple'
            ? previewTotal
            : Number(advPrincipal) || 0;

    const previewRate = creditType === 'dynamic'
        ? Number(advRate) || 0
        : mode === 'simple'
            ? 0
            : calcTarget === 'quota'
                ? Number(advRate) || 0
                : solveInterestRate(Number(advPrincipal), Number(advQuota), Number(advTerm));

    // Global Stats
    const activeCreditsWithStatus = credits.map(c => ({ credit: c, status: getCreditStatus(c) }));
    const totalRemainingDebt = activeCreditsWithStatus.reduce((sum, item) => sum + item.status.remainingBalance, 0);
    const totalMonthlyCommitment = activeCreditsWithStatus.reduce((sum, item) => item.credit.status !== 'paid' ? sum + item.status.quota : sum, 0);

    const activeCredits = activeCreditsWithStatus.filter(({ status }) => status.remainingBalance > 0);
    const displayedCredits = showPaid ? activeCreditsWithStatus : activeCredits;

    // Helper to validate current wizard step before proceeding
    const isStepValid = (step: number) => {
        if (step === 1) return true;
        if (step === 2) return name.trim() !== '';
        if (step === 3) {
            if (creditType === 'dynamic') {
                return Number(advPrincipal) > 0 && advRate !== '';
            } else {
                if (mode === 'simple') {
                    return Number(simpleQuota) > 0 && Number(simpleTerm) > 0;
                } else {
                    if (calcTarget === 'quota') {
                        return Number(advPrincipal) > 0 && Number(advTerm) > 0 && advRate !== '';
                    } else {
                        return Number(advPrincipal) > 0 && Number(advTerm) > 0 && Number(advQuota) > 0;
                    }
                }
            }
        }
        if (step === 4) {
            if (creditType === 'dynamic') return true;
            if (!hasPreExistingHistory) return true;
            const term = mode === 'simple' ? Number(simpleTerm) : Number(advTerm);
            return Number(installmentsPaidToDate) > 0 && Number(installmentsPaidToDate) <= term;
        }
        return true;
    };

    // Combined movements list for selected credit ledger
    const getCombinedMovements = (credit: Credit) => {
        const list: { id: string; date: string; description: string; amount: number; type: 'initial' | 'payment' | 'interest' | 'charge'; isPreExisting?: boolean }[] = [];
        
        list.push({
            id: 'initial',
            date: credit.startDate,
            description: 'Saldo Inicial / Deuda',
            amount: credit.principal,
            type: 'initial'
        });

        (credit.payments || []).forEach(p => {
            list.push({
                id: p.id,
                date: p.date,
                description: p.note || 'Abono / Pago de cuota',
                amount: p.amount,
                type: 'payment',
                isPreExisting: p.isPreExisting
            });
        });

        (credit.adjustments || []).forEach(a => {
            list.push({
                id: a.id,
                date: a.date,
                description: a.note || (a.type === 'interest' ? 'Cobro de Interés' : 'Cargo adicional'),
                amount: a.amount,
                type: a.type
            });
        });

        list.sort((a, b) => b.date.localeCompare(a.date));
        return list;
    };

    const selectedMovements = selectedCredit ? getCombinedMovements(selectedCredit) : [];

    return (
        <div className="space-y-8 min-h-screen text-zinc-900 dark:text-zinc-100 pb-12">
            {/* Header Premium Obsidian & Aurora */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 sm:p-10 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                {/* Aurora glows */}
                <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[80%] rounded-full bg-rose-500/10 blur-[130px] pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[80%] rounded-full bg-orange-500/10 blur-[130px] pointer-events-none animate-pulse" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 z-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-widest">
                            <Landmark size={14} className="text-rose-400 animate-pulse" /> Bóveda de Créditos
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-50 via-zinc-300 to-zinc-500 tracking-tight">
                            Obligaciones y Deudas
                        </h1>
                        <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
                            Diseñado para auditar planes de pago de cuotas fijas, controlar tus tarjetas de crédito y simular desendeudamiento dinámico.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 px-6 py-4 rounded-3xl flex flex-col justify-center w-full sm:w-[180px] h-[92px] shadow-inner">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Deuda Pendiente</span>
                            <span className="text-2xl font-mono font-black text-rose-500 tracking-tighter">
                                {currency}{totalRemainingDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        
                        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 px-6 py-4 rounded-3xl flex flex-col justify-center w-full sm:w-[180px] h-[92px] shadow-inner">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Pago Fijo Mensual</span>
                            <span className="text-2xl font-mono font-black text-zinc-100 tracking-tighter">
                                {currency}{totalMonthlyCommitment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 w-full sm:w-[160px]">
                            <button
                                onClick={openCreate}
                                className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-zinc-100 to-white hover:from-white hover:to-white text-zinc-950 px-4 py-3 rounded-2xl font-black transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 duration-300 text-xs uppercase tracking-wider whitespace-nowrap"
                            >
                                <Plus size={14} strokeWidth={3} />
                                <span>Nueva Deuda</span>
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl text-zinc-100 transition-all hover:border-zinc-700 whitespace-nowrap"
                                    title="Descargar Reporte PDF"
                                >
                                    <Download size={11} />
                                    <span>Exportar</span>
                                </button>
                                <button
                                    onClick={() => setShowPaid(!showPaid)}
                                    className={`text-[10px] font-bold px-2 py-2 rounded-xl transition-all border whitespace-nowrap ${showPaid ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm' : 'bg-transparent border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'}`}
                                >
                                    {showPaid ? 'Ocultar' : 'Ver Todos'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Plastic Glassmorphic Credit Cards List (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest px-1">Tus Plásticos y Obligaciones</h3>
                    
                    {displayedCredits.length === 0 ? (
                        <div className="py-20 text-center border border-zinc-800/60 rounded-[2.5rem] bg-zinc-950/20 backdrop-blur-sm flex flex-col items-center">
                            <Layers size={44} className="text-zinc-655 dark:text-zinc-600 mb-3 animate-pulse" strokeWidth={1.2} />
                            <h4 className="text-sm font-bold text-zinc-400">Sin deudas activas</h4>
                            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
                                Comienza usando el asistente para registrar tu primera obligación bancaria o tarjeta.
                            </p>
                        </div>
                    ) : (
                        displayedCredits.map(({ credit, status }) => {
                            const isSelected = selectedCreditId === credit.id;
                            const isPaid = credit.status === 'paid' || status.remainingBalance <= 0.05;

                            // Dynamic color schemes for luxury card designs
                            let cardGradient = "from-white via-white to-rose-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-rose-950/20";
                            let cardBorder = "border-zinc-200 dark:border-zinc-800/80";
                            let glowShadow = "";

                            if (isSelected) {
                                cardBorder = credit.type === 'dynamic' ? "border-rose-500" : "border-amber-500";
                                glowShadow = credit.type === 'dynamic' 
                                    ? "shadow-[0_0_40px_rgba(244,63,94,0.15)] scale-[1.01]" 
                                    : "shadow-[0_0_40px_rgba(245,158,11,0.15)] scale-[1.01]";
                            }

                            if (isPaid) {
                                cardGradient = "from-white via-white to-emerald-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/15";
                                if (isSelected) cardBorder = "border-emerald-500";
                            } else if (credit.type === 'amortized') {
                                cardGradient = "from-white via-white to-amber-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20";
                            }

                            return (
                                <div
                                    key={credit.id}
                                    onClick={() => setSelectedCreditId(credit.id)}
                                    className={`relative p-6 rounded-[2.2rem] bg-gradient-to-br ${cardGradient} border ${cardBorder} transition-all duration-500 cursor-pointer overflow-hidden group select-none ${glowShadow}`}
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                    
                                    {/* Holographic Watermark Circle */}
                                    <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-white/[0.01] border border-white/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700" />

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-ping" />
                                                <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 dark:group-hover:text-white leading-tight tracking-tight">
                                                    {credit.name}
                                                </h4>
                                            </div>
                                            <div className="flex gap-2 text-[9px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">
                                                <span>{credit.type === 'dynamic' ? 'Tarjeta / Revolvente' : 'Amortizable Fijo'}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => openEdit(credit, e)} 
                                                className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950/60 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirmation({ isOpen: true, creditId: credit.id });
                                                }} 
                                                className="p-1.5 bg-zinc-100 hover:bg-rose-100 dark:bg-zinc-950/60 dark:hover:bg-rose-950/40 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-900/35 rounded-xl transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chip and Network Layout */}
                                    <div className="flex justify-between items-center mb-6">
                                        {/* Golden Sim Card Chip Visual */}
                                        <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-yellow-600/30 via-yellow-500/20 to-yellow-700/30 border border-yellow-600/30 relative overflow-hidden flex flex-col justify-between p-1">
                                            <div className="grid grid-cols-3 gap-0.5 h-full opacity-60">
                                                <div className="border-r border-b border-yellow-600/30" />
                                                <div className="border-r border-b border-yellow-600/30" />
                                                <div className="border-b border-yellow-600/30" />
                                                <div className="border-r border-yellow-600/30" />
                                                <div className="border-r border-yellow-600/30" />
                                                <div className="" />
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[8px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block">Tasa TEA</span>
                                            <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{credit.interestRate.toFixed(2)}%</span>
                                        </div>
                                    </div>

                                    {/* Balance displaying card digits style */}
                                    <div className="mb-4">
                                        <span className="text-[8px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block mb-1">Saldo Pendiente</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-2xl font-mono font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">
                                                {currency}{status.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            {isPaid && (
                                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
                                                    Liquidado
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar & Quota footer */}
                                    <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-900/60">
                                        <div className="space-y-1">
                                            <div className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        isPaid ? 'bg-emerald-500' : credit.type === 'dynamic' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                                    }`}
                                                    style={{ width: `${status.progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[8px] font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                                                <span>Amortización: {Math.round(status.progress)}%</span>
                                                <span>Inicial: {currency}{credit.principal.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {!isPaid && (
                                            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/45 p-2 rounded-xl border border-zinc-200 dark:border-zinc-900/40">
                                                <div>
                                                    <span className="text-[8px] text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-wider block">
                                                        {credit.type === 'dynamic' ? 'Pago Mínimo' : 'Cuota Ordinaria'}
                                                    </span>
                                                    <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                                        {currency}{status.quota.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPaymentModal({ open: true, creditId: credit.id });
                                                        setPaymentAmount(status.quota.toFixed(2));
                                                        setPaymentDate(getLocalDateString());
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-95 shadow-sm"
                                                >
                                                    Abonar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right Column: Simulator & Details Desktop (7 Cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
                    
                    {/* Navigation Tabs */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-900/70">
                        <button
                            onClick={() => setRightPanelTab('details')}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                                rightPanelTab === 'details'
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-md'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Auditoría de Saldos
                        </button>
                        <button
                            onClick={() => setRightPanelTab('extra')}
                            disabled={selectedCredit?.type === 'dynamic'}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                                selectedCredit?.type === 'dynamic'
                                    ? 'opacity-30 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                                    : rightPanelTab === 'extra'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-md'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Aportes Extra
                        </button>
                        <button
                            onClick={() => setRightPanelTab('strategies')}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                                rightPanelTab === 'strategies'
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-md'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Estrategias
                        </button>
                    </div>

                    {!selectedCredit ? (
                        <div className="py-24 text-center flex flex-col items-center justify-center">
                            <Layers size={40} className="text-zinc-700 mb-3 animate-pulse" />
                            <h4 className="text-sm font-bold text-zinc-400">Selecciona una obligación</h4>
                            <p className="text-xs text-zinc-550 dark:text-zinc-500 max-w-xs mt-1">
                                Escoge un plástico o préstamo de la izquierda para ver su panel interactivo.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* TAB 1: LEDGER MOVEMENT DETAIL & CHART */}
                            {rightPanelTab === 'details' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{selectedCredit.name}</h3>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                    selectedCredit.type === 'dynamic' 
                                                        ? 'text-rose-600 bg-rose-50 dark:text-rose-450 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' 
                                                        : 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                                                }`}>
                                                    {selectedCredit.type === 'dynamic' ? 'Cuenta Revolvente' : 'Amortizable Fijo'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                {selectedCredit.type === 'dynamic'
                                                    ? 'Monitoreo dinámico del balance del crédito con historial de abonos y recargos'
                                                    : 'Tabla proyectada de amortización y pagos'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block">TEA Pactada</span>
                                            <span className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">{selectedCredit.interestRate}% EA</span>
                                        </div>
                                    </div>

                                    {/* Chart container */}
                                    <div className="h-60 bg-zinc-50 dark:bg-zinc-950/40 rounded-[1.8rem] border border-zinc-200 dark:border-zinc-900/60 p-4 shadow-inner">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedCredit.type === 'dynamic' ? dynamicChartData : chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="glowBal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={selectedCredit.type === 'dynamic' ? '#f43f5e' : '#f59e0b'} stopOpacity={0.25}/>
                                                        <stop offset="95%" stopColor={selectedCredit.type === 'dynamic' ? '#f43f5e' : '#f59e0b'} stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="glowPrinc" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                                                <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '14px', fontSize: '11px', color: '#f4f4f5' }} />
                                                <Area type="monotone" name="Balance" dataKey="balance" stroke={selectedCredit.type === 'dynamic' ? '#f43f5e' : '#f59e0b'} fillOpacity={1} fill="url(#glowBal)" strokeWidth={2.5} />
                                                {selectedCredit.type !== 'dynamic' && (
                                                    <Area type="monotone" name="Capital Pagado" dataKey="principal" stroke="#10b981" fillOpacity={1} fill="url(#glowPrinc)" strokeWidth={2.5} />
                                                )}
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Breakdown statistics */}
                                    <div className="grid grid-cols-3 gap-3 bg-zinc-55 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 text-center shadow-inner">
                                        <div>
                                            <span className="text-[8px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block mb-0.5">Saldo Original</span>
                                            <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-300">
                                                {currency}{selectedCredit.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block mb-0.5">Monto Satisfecho</span>
                                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {currency}{selectedStatus!.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block mb-0.5">Saldo Vigente</span>
                                            <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                                                {currency}{selectedStatus!.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Movements ledger */}
                                    <div className="space-y-3.5">
                                        <div className="flex justify-between items-center px-1">
                                            <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Línea de Movimientos del Crédito</h4>
                                            
                                            {selectedCredit.status !== 'paid' && selectedStatus!.remainingBalance > 0.05 && (
                                                <div className="flex gap-2">
                                                    {selectedCredit.type === 'dynamic' && (
                                                        <button
                                                            onClick={() => {
                                                                setAdjustmentModal({ open: true, creditId: selectedCredit.id });
                                                                setAdjustmentAmount('');
                                                                setAdjustmentNote('');
                                                                setAdjustmentType('interest');
                                                                setAdjustmentDate(getLocalDateString());
                                                            }}
                                                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-[10px] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                                        >
                                                            <PlusCircle size={12} />
                                                            <span>Reg. Cargo / Compra</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setPaymentModal({ open: true, creditId: selectedCredit.id });
                                                            setPaymentAmount(selectedStatus!.quota.toFixed(2));
                                                            setPaymentDate(getLocalDateString());
                                                        }}
                                                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-black rounded-xl text-[10px] transition-all flex items-center gap-1.5 shadow-md hover:shadow-white/5 active:scale-95"
                                                    >
                                                        <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-400" />
                                                        <span>Registrar Abono</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-[1.8rem] p-5 max-h-[250px] overflow-y-auto space-y-3.5 divide-y divide-zinc-200 dark:divide-zinc-900/60 shadow-inner">
                                            {selectedMovements.map((m, idx) => (
                                                <div key={m.id} className={`flex justify-between items-center text-xs ${idx > 0 ? 'pt-3.5' : ''}`}>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-200">{m.description}</span>
                                                            {m.isPreExisting && (
                                                                <span className="text-[7px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                    Cuota Previa
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">
                                                            {formatLocalDate(m.date, 'dd MMM yyyy')}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`font-mono font-bold text-[13px] ${
                                                            m.type === 'payment' 
                                                                ? 'text-emerald-600 dark:text-emerald-400' 
                                                                : m.type === 'initial'
                                                                    ? 'text-zinc-600 dark:text-zinc-500'
                                                                    : 'text-rose-600 dark:text-rose-400'
                                                        }`}>
                                                            {m.type === 'payment' ? '-' : '+'}{currency}{m.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-zinc-550 dark:text-zinc-400 block uppercase tracking-wider mt-0.5">
                                                            {m.type === 'payment' 
                                                                ? 'Abono' 
                                                                : m.type === 'initial'
                                                                    ? 'Apertura'
                                                                    : m.type === 'interest'
                                                                        ? 'Interés'
                                                                        : 'Cargo'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: EXTRA PAYMENTS SIMULATOR */}
                            {rightPanelTab === 'extra' && selectedCredit.type !== 'dynamic' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div>
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Calculadora de Aporte Extraordinario</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Simula aportes adicionales y descubre el tiempo e intereses que puedes ahorrar</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Aporte Extra Único ({currency})</label>
                                            <input
                                                type="number"
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 font-bold focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800"
                                                placeholder="Ej. 1000 (Única vez)"
                                                value={extraPaymentSim.oneTime}
                                                onChange={e => setExtraPaymentSim({ ...extraPaymentSim, oneTime: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Extra Mensual Recurrente ({currency})</label>
                                            <input
                                                type="number"
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 font-bold focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800"
                                                placeholder="Ej. 100 (Cada mes)"
                                                value={extraPaymentSim.monthly}
                                                onChange={e => setExtraPaymentSim({ ...extraPaymentSim, monthly: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Saving Metrics */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-55 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-2xl text-center space-y-1">
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                <TrendingDown size={28} className="mx-auto animate-bounce" />
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Tiempo Ahorrado</span>
                                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                {monthsSaved} meses
                                            </span>
                                        </div>

                                        <div className="bg-emerald-55 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-2xl text-center space-y-1">
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                <ShieldCheck size={28} className="mx-auto" />
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Intereses Ahorrados</span>
                                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                {currency}{Math.round(interestSaved).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {monthsSaved > 0 && (
                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                                            <Info size={16} className="text-zinc-400 dark:text-zinc-505 shrink-0 mt-0.5" />
                                            <span>
                                                ¡Excelente! Al realizar un aporte único de {currency}{extraPaymentSim.oneTime} y agregar {currency}{extraPaymentSim.monthly} mensuales, tu préstamo se saldará en un plazo de <strong className="text-zinc-800 dark:text-zinc-200">{simTimeline.length} meses</strong> en lugar de {baseTimeline.length} meses.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: DEBT SNOWBALL VS AVALANCHE DESK */}
                            {rightPanelTab === 'strategies' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div>
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Simulador de Estrategias de Pago</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">¿Qué pasa si inyectas un fondo extra mensual para saldar tus deudas?</p>
                                    </div>

                                    {/* Extra Buffer Slider */}
                                    <div className="bg-zinc-50 dark:bg-zinc-950/60 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400 uppercase tracking-wider">Aporte Extra Mensual Total</span>
                                            <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                {currency}{extraStrategyBuffer}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="2000"
                                            step="50"
                                            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                            value={extraStrategyBuffer}
                                            onChange={e => setExtraStrategyBuffer(Number(e.target.value))}
                                        />
                                        <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                            <span>{currency}50</span>
                                            <span>{currency}2000</span>
                                        </div>
                                    </div>

                                    {/* Strategy Cards */}
                                    {activeCreditsCount < 2 ? (
                                        <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-900 rounded-2xl text-xs text-zinc-600 dark:text-zinc-400">
                                            <Info size={16} className="mx-auto mb-2 text-zinc-400 dark:text-zinc-500" />
                                            Para comparar las estrategias Bola de Nieve vs Avalancha necesitas tener al menos **2 deudas activas** registradas.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                
                                                {/* Baseline Plan */}
                                                <div className="bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 flex flex-col justify-between">
                                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Plan Original</span>
                                                    <span className="text-2xl font-black text-zinc-800 dark:text-zinc-400 block my-2">{baselineResult.months}m</span>
                                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Interés: {currency}{Math.round(baselineResult.totalInterest).toLocaleString()}</span>
                                                </div>

                                                {/* Snowball Strategy */}
                                                <div className="bg-zinc-100/60 dark:bg-zinc-950/60 border border-zinc-250 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500/10 border-l border-b border-emerald-500/20 text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest rounded-bl-lg">
                                                        Bajas primero
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mt-1">Bola de Nieve</span>
                                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block my-2">{snowballResult.months}m</span>
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Ahorro: {currency}{Math.round(Math.max(0, baselineResult.totalInterest - snowballResult.totalInterest)).toLocaleString()}</span>
                                                </div>

                                                {/* Avalanche Strategy */}
                                                <div className="bg-zinc-100/60 dark:bg-zinc-950/60 border border-zinc-250 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-blue-500/10 border-l border-b border-blue-500/20 text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest rounded-bl-lg">
                                                        Eficiente
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mt-1">Avalancha</span>
                                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block my-2">{avalancheResult.months}m</span>
                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Ahorro: {currency}{Math.round(Math.max(0, baselineResult.totalInterest - avalancheResult.totalInterest)).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900/80 rounded-2xl flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                                                <Zap size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                                <span>
                                                    {avalancheResult.totalInterest < snowballResult.totalInterest ? (
                                                        <span>El método **Avalancha** es matemáticamente más óptimo en tu caso, ahorrándote un total de <strong className="text-blue-650 dark:text-blue-400">{currency}{Math.round(snowballResult.totalInterest - avalancheResult.totalInterest)}</strong> adicionales frente a Bola de Nieve al liquidar primero las deudas con mayor interés.</span>
                                                    ) : (
                                                        <span>El método **Bola de Nieve** te permitirá liberar compromisos mensuales más rápido y ganar victorias psicológicas tempranas, liquidando primero las cuentas más pequeñas.</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Step-by-Step wizard Modal for Creation, Unified Modal for Editing */}
            <Modal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                title={editingCreditId ? "Editar Obligación" : `Crear Deuda (Paso ${creationStep} de 5)`} 
                maxWidth="max-w-2xl"
            >
                {editingCreditId ? (
                    /* UNIFIED FORM FOR EDITING (COMFORTABLE EDIT EXPERIENCE) */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Identificador de Deuda</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 font-bold"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <DatePicker
                                    label="Fecha de Inicio"
                                    value={startDate}
                                    onChange={setStartDate}
                                />
                            </div>
                        </div>

                        {creditType === 'dynamic' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Deuda / Balance Inicial ({currency})</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-zinc-900 dark:text-zinc-200"
                                        value={advPrincipal}
                                        onChange={e => setAdvPrincipal(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Tasa de Interés TEA (%)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-zinc-900 dark:text-zinc-200"
                                        value={advRate}
                                        onChange={e => setAdvRate(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Monto Principal ({currency})</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-zinc-900 dark:text-zinc-200"
                                            value={advPrincipal}
                                            onChange={e => setAdvPrincipal(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Plazo (Meses)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-zinc-900 dark:text-zinc-200"
                                            value={advTerm}
                                            onChange={e => setAdvTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Tasa Interés Anual TEA (%)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-zinc-900 dark:text-zinc-200"
                                        value={advRate}
                                        onChange={e => setAdvRate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95"
                        >
                            Guardar Cambios
                        </button>
                    </form>
                ) : (
                    /* INTERACTIVE WIZARD FLOW FOR CREATING NEW DEBTS (TAKES THE USER BY THE HAND) */
                    <div className="space-y-6 min-h-[380px] flex flex-col justify-between">
                        
                        {/* WIZARD STEPPERS INDICATOR */}
                        <div className="flex items-center justify-between px-1 mb-4">
                            {[1, 2, 3, 4, 5].map((step) => {
                                const isPassed = step < creationStep;
                                const isCurrent = step === creationStep;
                                return (
                                    <React.Fragment key={step}>
                                        <div className="flex items-center justify-center">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                isPassed 
                                                    ? 'bg-emerald-500 text-zinc-950'
                                                    : isCurrent
                                                        ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400/20'
                                                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800'
                                            }`}>
                                                {isPassed ? <CheckCircle size={13} strokeWidth={3} /> : step}
                                            </div>
                                        </div>
                                        {step < 5 && (
                                            <div className={`flex-1 h-[2px] mx-2 transition-all ${
                                                step < creationStep ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                                            }`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* STEP CONTENT PANEL */}
                        <div className="flex-1 py-2">
                            {creationStep === 1 && (
                                /* STEP 1: DEBT TYPE */
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">¿Qué tipo de deuda vamos a registrar?</h3>
                                        <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-md mx-auto">Selecciona el formato que mejor describa las condiciones de tu obligación financiera.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div 
                                            onClick={() => {
                                                setCreditType('amortized');
                                                setCreationStep(2);
                                            }}
                                            className={`p-6 rounded-3xl bg-zinc-50/80 dark:bg-zinc-950/45 border ${creditType === 'amortized' ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/5' : 'border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'} transition-all cursor-pointer text-center space-y-3 group hover:scale-[1.02] duration-300`}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                                <Landmark className="text-amber-500" size={22} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Préstamo Fijo (Amortizable)</h4>
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                    Pagas una cuota fija mensual preestablecida. Ej: Préstamo vehicular, compra de celular a plazos o crédito hipotecario.
                                                </p>
                                            </div>
                                        </div>

                                        <div 
                                            onClick={() => {
                                                setCreditType('dynamic');
                                                setCreationStep(2);
                                            }}
                                            className={`p-6 rounded-3xl bg-zinc-50/80 dark:bg-zinc-950/45 border ${creditType === 'dynamic' ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-950/5' : 'border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'} transition-all cursor-pointer text-center space-y-3 group hover:scale-[1.02] duration-300`}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                                <Zap className="text-rose-500" size={22} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">Línea de Crédito / Tarjeta</h4>
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                    El balance sube o baja con compras, recargos manuales e intereses. Ej: Tarjetas de crédito bancarias o deudas informales variables.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {creationStep === 2 && (
                                /* STEP 2: BASIC INFO */
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Detalles de Identificación</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">¿Cómo identificamos esta deuda y cuándo inició?</p>
                                    </div>

                                    <div className="space-y-4 max-w-md mx-auto pt-2">
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Nombre o Concepto</label>
                                            <input
                                                required
                                                type="text"
                                                autoFocus
                                                placeholder="Ej. Visa BCP, Celular Claro, Préstamo de Papá"
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-200 font-bold transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <DatePicker
                                                label="Fecha de Inicio / Firma"
                                                value={startDate}
                                                onChange={setStartDate}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {creationStep === 3 && (
                                /* STEP 3: FINANCIAL MATH */
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Las Matemáticas del Contrato</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Ingresa los números financieros acordados en tu deuda.</p>
                                    </div>

                                    {creditType === 'dynamic' ? (
                                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Balance Inicial ({currency})</label>
                                                <input
                                                    type="number"
                                                    required
                                                    autoFocus
                                                    placeholder="0.00"
                                                    className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                    value={advPrincipal}
                                                    onChange={e => setAdvPrincipal(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Interés Anual TEA (%)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    required
                                                    placeholder="Ej. 18.5"
                                                    className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                    value={advRate}
                                                    onChange={e => setAdvRate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-w-lg mx-auto pt-2">
                                            {/* Mode Selector for Fixed Debt */}
                                            <div className="flex bg-zinc-100 dark:bg-zinc-950/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-900">
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('simple')}
                                                    className={`flex-1 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${
                                                        mode === 'simple' 
                                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm' 
                                                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-455 dark:hover:text-zinc-305 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300'
                                                    }`}
                                                >
                                                    Modo Simple (Tasa 0%)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('advanced')}
                                                    className={`flex-1 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${
                                                        mode === 'advanced' 
                                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm' 
                                                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300'
                                                    }`}
                                                >
                                                    Modo Avanzado (Con TEA)
                                                </button>
                                            </div>

                                            {mode === 'simple' ? (
                                                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                                    <div className="space-y-2">
                                                        <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Cuota Fija ({currency})</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            placeholder="0.00"
                                                            className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                            value={simpleQuota}
                                                            onChange={e => setSimpleQuota(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Plazo (Meses)</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            placeholder="12"
                                                            className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                            value={simpleTerm}
                                                            onChange={e => setSimpleTerm(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 animate-in fade-in">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Capital Principal ({currency})</label>
                                                            <input
                                                                type="number"
                                                                required
                                                                placeholder="10000"
                                                                className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                                value={advPrincipal}
                                                                onChange={e => setAdvPrincipal(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Plazo (Meses)</label>
                                                            <input
                                                                type="number"
                                                                required
                                                                placeholder="24"
                                                                className="w-full text-sm font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                                value={advTerm}
                                                                onChange={e => setAdvTerm(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-zinc-200 dark:border-zinc-900/60 pt-3 space-y-2">
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="calcTarget"
                                                                    checked={calcTarget === 'quota'}
                                                                    onChange={() => setCalcTarget('quota')}
                                                                    className="text-rose-600 focus:ring-rose-500 bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800"
                                                                />
                                                                <span>Conozco la Tasa TEA (%)</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="calcTarget"
                                                                    checked={calcTarget === 'rate'}
                                                                    onChange={() => setCalcTarget('rate')}
                                                                    className="text-rose-600 focus:ring-rose-500 bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800"
                                                                />
                                                                <span>Conozco la Cuota Fija</span>
                                                            </label>
                                                        </div>

                                                        {calcTarget === 'quota' ? (
                                                            <div className="space-y-1">
                                                                <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Tasa Anual TEA (%)</label>
                                                                <input
                                                                    type="number"
                                                                    step="any"
                                                                    required
                                                                    placeholder="Ej. 15.5"
                                                                    className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                                    value={advRate}
                                                                    onChange={e => setAdvRate(e.target.value)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Cuota Fija Mensual ({currency})</label>
                                                                <input
                                                                    type="number"
                                                                    step="any"
                                                                    required
                                                                    placeholder="Ej. 500"
                                                                    className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                                    value={advQuota}
                                                                    onChange={e => setAdvQuota(e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {creationStep === 4 && (
                                /* STEP 4: PRE-EXISTING HISTORY (ONLY FIXED DEBTS) */
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Historial Previo de Pagos</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">¿Ya has venido pagando cuotas de este crédito antes de hoy?</p>
                                    </div>

                                    <div className="space-y-5 max-w-md mx-auto pt-2">
                                        {/* Toggle Question Cards */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div 
                                                onClick={() => {
                                                    setHasPreExistingHistory(true);
                                                }}
                                                className={`p-4 border rounded-2xl cursor-pointer text-center font-bold text-xs transition-all ${
                                                    hasPreExistingHistory 
                                                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm' 
                                                        : 'border-zinc-200 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-950/45 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-800'
                                                }`}
                                            >
                                                Sí, ya he pagado cuotas
                                            </div>
                                            <div 
                                                onClick={() => {
                                                    setHasPreExistingHistory(false);
                                                    setInstallmentsPaidToDate(0);
                                                }}
                                                className={`p-4 border rounded-2xl cursor-pointer text-center font-bold text-xs transition-all ${
                                                    !hasPreExistingHistory 
                                                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm' 
                                                        : 'border-zinc-200 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-950/45 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-800'
                                                }`}
                                            >
                                                No, es una deuda nueva
                                            </div>
                                        </div>

                                        {hasPreExistingHistory && (
                                            <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-1.5">
                                                    <label className="block text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">¿Cuántas cuotas has pagado ya?</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={mode === 'simple' ? (Number(simpleTerm) || 360) : (Number(advTerm) || 360)}
                                                        placeholder="Ej. 5 (de 12 cuotas)"
                                                        className="w-full text-base font-bold bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-200 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                                        value={installmentsPaidToDate || ''}
                                                        onChange={e => setInstallmentsPaidToDate(Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] flex items-start gap-2">
                                                    <Info size={15} className="shrink-0 mt-0.5" />
                                                    <span>
                                                        <strong>Nota:</strong> Estas cuotas históricas se registrarán como pagadas previamente. **No afectarán** el balance actual de tu Wallet.
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {creationStep === 5 && (
                                /* STEP 5: RECEIPT REVIEW & SUBMIT */
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Revisión Final del Registro</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Revisa la simulación del contrato de tu deuda antes de archivarla.</p>
                                    </div>

                                    {/* Luxury Digital Receipt design */}
                                    <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm mx-auto shadow-2xl relative overflow-hidden space-y-4">
                                        {/* Stylized receipt stripes header */}
                                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500" />
                                        
                                        <div className="text-center pb-3 border-b border-zinc-200 dark:border-zinc-900/60">
                                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Resumen del Contrato</span>
                                            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-200 block mt-1">{name}</span>
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Inicia el {formatLocalDate(startDate)}</span>
                                        </div>

                                        <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400">
                                            <div className="flex justify-between">
                                                <span>Tipo de Cuenta:</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-200">{creditType === 'dynamic' ? 'Tarjeta Revolvente' : 'Amortización Fija'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Capital Principal:</span>
                                                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">{currency}{previewPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            
                                            {creditType === 'amortized' && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span>Cuota Mensual:</span>
                                                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">{currency}{previewQuota.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Intereses Totales:</span>
                                                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">+{currency}{(previewTotal - previewPrincipal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-900/60 pt-3 text-xs">
                                                <span>Tasa de Interés (TEA):</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{previewRate.toFixed(2)}% Anual</span>
                                            </div>

                                            {hasPreExistingHistory && installmentsPaidToDate > 0 && (
                                                <div className="flex justify-between bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-2.5 rounded-xl text-[10px] text-blue-600 dark:text-blue-400 mt-2">
                                                    <span>Abonos Históricos:</span>
                                                    <span className="font-bold">{installmentsPaidToDate} cuotas pagadas previamente</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* WIZARD ACTIONS BAR */}
                        <div className="border-t border-zinc-200 dark:border-zinc-900/60 pt-4 flex justify-between gap-4 mt-6">
                            {creationStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setCreationStep(creationStep - 1)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800 rounded-xl font-bold text-xs transition-all active:scale-95"
                                >
                                    <ArrowLeft size={13} />
                                    <span>Atrás</span>
                                </button>
                            ) : (
                                <div />
                            )}

                            {creationStep < 5 ? (
                                <button
                                    type="button"
                                    disabled={!isStepValid(creationStep)}
                                    onClick={() => {
                                        // Skip Step 4 (Pre-existing history) if it is a dynamic revolving credit
                                        if (creationStep === 3 && creditType === 'dynamic') {
                                            setCreationStep(5);
                                        } else {
                                            setCreationStep(creationStep + 1);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-[1.02] active:scale-95 ml-auto"
                                >
                                    <span>Continuar</span>
                                    <ArrowRight size={13} strokeWidth={3} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                                >
                                    ¡Inicializar Deuda!
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={paymentModal.open} onClose={() => setPaymentModal({ open: false, creditId: '' })} title="Registrar Pago de Cuota (Abono)">
                <form onSubmit={handlePayment} className="space-y-4">
                    <p className="text-xs text-zinc-650 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
                        Al confirmar este pago, el saldo restante de la deuda se reducirá y se inyectará una transacción de gasto al libro diario general en la categoría <strong>Deudas / Créditos</strong>.
                    </p>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Monto a Abonar ({currency})</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold">{currency}</span>
                            <input
                                required
                                autoFocus
                                type="number"
                                step="any"
                                className="w-full text-xl font-black bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <DatePicker
                                label="Fecha del Pago"
                                value={paymentDate}
                                onChange={setPaymentDate}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Nota o Comentario (Opcional)</label>
                            <input
                                type="text"
                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                placeholder="Ej. Cuota de junio..."
                                value={paymentNote}
                                onChange={e => setPaymentNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {Number(paymentAmount) > currentBalance && (
                        <div className="flex items-start gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span>No posees fondos suficientes en tu Wallet principal para registrar este pago.</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={Number(paymentAmount) > currentBalance}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10"
                    >
                        Confirmar Pago
                    </button>
                </form>
            </Modal>

            {/* Adjustment Modal (Add Charge / Interest) */}
            <Modal isOpen={adjustmentModal.open} onClose={() => setAdjustmentModal({ open: false, creditId: '' })} title="Registrar Cargo o Interés (Incrementa Deuda)">
                <form onSubmit={handleAdjustment} className="space-y-4">
                    <p className="text-xs text-zinc-605 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
                        Ingresa cargos manuales o cobros de intereses sobre deudas dinámicas. Esto incrementará la deuda pendiente sin afectar tus fondos de Wallet.
                    </p>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo de Cargo</label>
                        <div className="grid grid-cols-2 gap-3 bg-zinc-100 dark:bg-zinc-950/40 p-1 rounded-xl border border-zinc-200 dark:border-zinc-900">
                            <button
                                type="button"
                                onClick={() => setAdjustmentType('interest')}
                                className={`py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${
                                    adjustmentType === 'interest'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-800'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300'
                                }`}
                            >
                                Cobro de Interés
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdjustmentType('charge')}
                                className={`py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${
                                    adjustmentType === 'charge'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-800'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300'
                                }`}
                            >
                                Cargo / Compra Adicional
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Monto del Incremento ({currency})</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold">{currency}</span>
                            <input
                                required
                                autoFocus
                                type="number"
                                step="any"
                                className="w-full text-xl font-black bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                value={adjustmentAmount}
                                onChange={e => setAdjustmentAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <DatePicker
                                label="Fecha de Registro"
                                value={adjustmentDate}
                                onChange={setAdjustmentDate}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Nota o Concepto (Opcional)</label>
                            <input
                                type="text"
                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                placeholder="Ej. Cargo de mantenimiento o compra de zapatería..."
                                value={adjustmentNote}
                                onChange={e => setAdjustmentNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/10"
                    >
                        Confirmar Cargo
                    </button>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, creditId: null })}
                title="Eliminar Obligación"
                maxWidth="max-w-sm"
            >
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mb-1">
                        <Trash2 size={22} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-200">¿Proceder con la eliminación?</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Al eliminar esta obligación, se borrarán todos los pagos realizados e historiales vinculados en el libro diario. Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full pt-3">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirmation({ isOpen: false, creditId: null })}
                            className="flex-1 px-4 py-2.5 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-xs transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (deleteConfirmation.creditId) {
                                    deleteCredit(deleteConfirmation.creditId);
                                    setDeleteConfirmation({ isOpen: false, creditId: null });
                                }
                            }}
                            className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-550 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-rose-600/20"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Credits;
