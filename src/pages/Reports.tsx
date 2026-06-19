import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useGoals } from '../hooks/useGoals';
import { useFunds } from '../hooks/useFunds';
import { useCredits } from '../hooks/useCredits';
import { useBalance } from '../hooks/useBalance';
import { useSettings } from '../context/SettingsContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import {
    ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Calendar, Download,
    Loader2, Award, HeartPulse, ShieldAlert, FileText, CheckCircle2, AlertCircle, Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const Reports = () => {
    const { transactions } = useTransactions();
    const { goals, getTotalSavingsAtDate } = useGoals();
    const { funds } = useFunds();
    const { credits, getCreditStatus } = useCredits();
    const { getBalanceAtDate } = useBalance();
    const { currency } = useSettings();

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isExporting, setIsExporting] = useState(false);

    // --- PDF Customizer State ---
    const [exportModules, setExportModules] = useState({
        health: true,
        summary: true,
        categories: true,
        monthly: true,
        goals: true,
        credits: true
    });
    const [pdfTheme, setPdfTheme] = useState<'obsidian' | 'emerald' | 'sapphire'>('obsidian');
    const [customNotes, setCustomNotes] = useState('');

    // --- Data Processing & Year Filter ---

    // 1. Get available years from transactions
    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        years.add(new Date().getFullYear()); // Ensure current year is always available
        return Array.from(years).sort((a, b) => b - a); // Descending
    }, [transactions]);

    // 2. Filter transactions by selected year & exclude internal savings transfers
    const yearTransactions = useMemo(() => {
        return transactions.filter(t => {
            const isSelectedYear = new Date(t.date).getFullYear() === selectedYear;
            const isSavingsTransfer = t.relatedTo && (t.relatedTo.type === 'goal' || t.relatedTo.type === 'fund');
            return isSelectedYear && !isSavingsTransfer;
        });
    }, [transactions, selectedYear]);

    // 3. Aggregate Monthly Data (Income vs Expense)
    const monthlyData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(selectedYear, i, 1).toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
            fullMonthName: new Date(selectedYear, i, 1).toLocaleString('es-ES', { month: 'long' }),
            income: 0,
            expense: 0,
            savings: 0,
            monthIndex: i
        }));

        yearTransactions.forEach(t => {
            // Safe month calculation
            const month = new Date(t.date + 'T12:00:00').getMonth();
            const amount = t.amount;
            if (t.type === 'income') {
                months[month].income += amount;
            } else {
                months[month].expense += amount;
            }
        });

        // Calculate savings per month
        months.forEach(m => {
            m.savings = m.income - m.expense;
        });

        return months;
    }, [yearTransactions, selectedYear]);

    // 4. Aggregate Category Data (Expenses Only)
    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};

        yearTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = t.category || 'Otros';
                categories[cat] = (categories[cat] || 0) + t.amount;
            });

        return Object.entries(categories)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Top expenses first
    }, [yearTransactions]);

    // 5. YTD Totals
    const ytdTotals = useMemo(() => {
        const income = monthlyData.reduce((acc, curr) => acc + curr.income, 0);
        const expense = monthlyData.reduce((acc, curr) => acc + curr.expense, 0);
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        return { income, expense, savings, savingsRate };
    }, [monthlyData]);

    // --- Year-End Historical Calculations (Net Worth, Debt, Savings) ---

    const endOfYearDate = useMemo(() => {
        const currentYear = new Date().getFullYear();
        if (selectedYear === currentYear) {
            return new Date(); // Use today for current year calculations
        }
        return new Date(selectedYear, 11, 31, 23, 59, 59);
    }, [selectedYear]);

    const balanceAtYearEnd = useMemo(() => {
        return getBalanceAtDate(endOfYearDate);
    }, [getBalanceAtDate, endOfYearDate]);

    const goalsSavedAtYearEnd = useMemo(() => {
        return getTotalSavingsAtDate(endOfYearDate);
    }, [getTotalSavingsAtDate, endOfYearDate]);

    const fundsSavedAtYearEnd = useMemo(() => {
        return funds.reduce((acc, f) => {
            if (!f.history) return acc;
            const fTotal = f.history.reduce((hAcc, item) => {
                const iDate = new Date(item.date + 'T12:00:00');
                if (iDate <= endOfYearDate) {
                    return item.type === 'deposit' ? hAcc + item.amount : hAcc - item.amount;
                }
                return hAcc;
            }, 0);
            return acc + Math.max(0, fTotal);
        }, 0);
    }, [funds, endOfYearDate]);

    const totalSavedAtYearEnd = useMemo(() => {
        return goalsSavedAtYearEnd + fundsSavedAtYearEnd;
    }, [goalsSavedAtYearEnd, fundsSavedAtYearEnd]);

    const debtAtYearEnd = useMemo(() => {
        return credits
            .filter(c => new Date(c.startDate) <= endOfYearDate)
            .reduce((acc, c) => {
                const paymentsBefore = (c.payments || []).filter(p => new Date(p.date + 'T12:00:00') <= endOfYearDate);
                const totalPaidBefore = paymentsBefore.reduce((sum, p) => sum + p.amount, 0);

                const monthlyRate = c.interestRate / 100 / 12;
                let totalToPay = 0;
                if (c.interestRate === 0) {
                    totalToPay = c.principal;
                } else {
                    const quota = (c.principal * monthlyRate * Math.pow(1 + monthlyRate, c.term)) / (Math.pow(1 + monthlyRate, c.term) - 1);
                    totalToPay = quota * c.term;
                }
                return acc + Math.max(0, totalToPay - totalPaidBefore);
            }, 0);
    }, [credits, endOfYearDate]);

    const netWorthAtYearEnd = useMemo(() => {
        return balanceAtYearEnd + totalSavedAtYearEnd - debtAtYearEnd;
    }, [balanceAtYearEnd, totalSavedAtYearEnd, debtAtYearEnd]);

    // --- Financial Health Score Algorithm (A-F) ---

    const healthScore = useMemo(() => {
        const income = ytdTotals.income;
        const expense = ytdTotals.expense;
        const savingsRate = ytdTotals.savingsRate;

        // 1. Savings Rate Score (Max 35 points)
        let savingsRateScore = 0;
        if (income === 0) {
            savingsRateScore = expense > 0 ? 0 : 15; // neutral if no transactions
        } else {
            if (savingsRate >= 30) {
                savingsRateScore = 35;
            } else if (savingsRate <= 0) {
                savingsRateScore = 0;
            } else {
                savingsRateScore = (savingsRate / 30) * 35;
            }
        }

        // 2. Emergency Buffer Score (Max 30 points)
        // Buffer = total saved / average monthly expense (YTD Expense / 12)
        const avgMonthlyExpense = expense / 12;
        const totalSaved = totalSavedAtYearEnd;
        let emergencyBufferScore = 0;
        let monthsBuffer = 0;

        if (avgMonthlyExpense === 0) {
            emergencyBufferScore = totalSaved > 0 ? 30 : 15;
            monthsBuffer = totalSaved > 0 ? 12 : 0;
        } else {
            monthsBuffer = totalSaved / avgMonthlyExpense;
            if (monthsBuffer >= 6) {
                emergencyBufferScore = 30;
            } else {
                emergencyBufferScore = (monthsBuffer / 6) * 30;
            }
        }

        // 3. Debt Load Score (Max 20 points)
        // Debt ratio = total debt / YTD Income
        const debt = debtAtYearEnd;
        let debtLoadScore = 0;
        let debtRatio = 0;

        if (debt === 0) {
            debtLoadScore = 20;
        } else if (income === 0) {
            debtLoadScore = 0; // has debt but no income
        } else {
            debtRatio = debt / income;
            if (debtRatio <= 0.1) {
                debtLoadScore = 20;
            } else if (debtRatio >= 1.0) {
                debtLoadScore = 0;
            } else {
                debtLoadScore = 20 - ((debtRatio - 0.1) / 0.9) * 20;
            }
        }

        // 4. Budget Consistency Score (Max 15 points)
        // Ratio of active months where Income >= Expense
        let activeMonths = 0;
        let positiveSavingsMonths = 0;

        monthlyData.forEach(m => {
            if (m.income > 0 || m.expense > 0) {
                activeMonths++;
                if (m.income >= m.expense) {
                    positiveSavingsMonths++;
                }
            }
        });

        let consistencyScore = 0;
        if (activeMonths === 0) {
            consistencyScore = 15;
        } else {
            consistencyScore = (positiveSavingsMonths / activeMonths) * 15;
        }

        const totalScore = Math.round(savingsRateScore + emergencyBufferScore + debtLoadScore + consistencyScore);

        let grade = 'F';
        let gradeColor = 'text-rose-500';
        let gradeBg = 'bg-rose-500/10 border-rose-500/20';
        let gradeGlow = 'shadow-[0_0_20px_rgba(244,63,94,0.15)]';
        let feedback = 'Alerta Crítica. Tus finanzas presentan un alto riesgo de descapitalización o sobrendeudamiento.';

        if (totalScore >= 90) {
            grade = 'A';
            gradeColor = 'text-emerald-500';
            gradeBg = 'bg-emerald-500/10 border-emerald-500/20';
            gradeGlow = 'shadow-[0_0_25px_rgba(16,185,129,0.25)]';
            feedback = 'Excelente. ¡Salud financiera inquebrantable! Tienes un balance de ahorro óptimo, deudas bajo control y un colchón de emergencia robusto.';
        } else if (totalScore >= 80) {
            grade = 'B';
            gradeColor = 'text-indigo-400';
            gradeBg = 'bg-indigo-500/10 border-indigo-500/20';
            gradeGlow = 'shadow-[0_0_25px_rgba(99,102,241,0.2)]';
            feedback = 'Saludable. Vas por excelente camino. Tus hábitos de ahorro e ingresos son sólidos, aunque hay áreas menores de optimización.';
        } else if (totalScore >= 70) {
            grade = 'C';
            gradeColor = 'text-amber-500';
            gradeBg = 'bg-amber-500/10 border-amber-500/20';
            gradeGlow = 'shadow-[0_0_20px_rgba(245,158,11,0.15)]';
            feedback = 'Aceptable. Tus finanzas están estables, pero vives con un margen de ahorro bajo o una carga de deuda moderada.';
        } else if (totalScore >= 60) {
            grade = 'D';
            gradeColor = 'text-orange-500';
            gradeBg = 'bg-orange-500/10 border-orange-500/20';
            gradeGlow = 'shadow-[0_0_20px_rgba(249,115,22,0.15)]';
            feedback = 'Vulnerable. Tus gastos están muy ajustados al ingreso y tu colchón de emergencia es insuficiente. Es hora de hacer ajustes.';
        }

        const tips: string[] = [];
        if (savingsRateScore < 20) {
            tips.push('Tu tasa de ahorro está por debajo del 20%. Te sugerimos recortar gastos superfluos usando la pestaña de Gastos y automatizar un porcentaje fijo en Fondos.');
        }
        if (emergencyBufferScore < 20) {
            tips.push(`Tu colchón de ahorros cubre solo ${monthsBuffer.toFixed(1)} meses de gastos. Prioriza aportar al Fondo de Emergencias antes de hacer otros desembolsos.`);
        }
        if (debtLoadScore < 15) {
            tips.push('Tu nivel de deuda respecto a tus ingresos es elevado. Te recomendamos usar el simulador de desendeudamiento (Avalancha/Bola de Nieve) en la pestaña Créditos.');
        }
        if (consistencyScore < 12) {
            tips.push('Has gastado más de lo que ingresaste en varios meses del año. Te aconsejamos establecer límites de presupuesto mensuales por categoría.');
        }
        if (tips.length === 0) {
            tips.push('¡Felicidades! Mantienes una salud financiera ejemplar en todos los indicadores. Sigue automatizando tus aportaciones para mantener el ritmo.');
        }

        return {
            totalScore,
            grade,
            gradeColor,
            gradeBg,
            gradeGlow,
            feedback,
            tips,
            details: {
                savingsRateScore: Math.round(savingsRateScore),
                emergencyBufferScore: Math.round(emergencyBufferScore),
                debtLoadScore: Math.round(debtLoadScore),
                consistencyScore: Math.round(consistencyScore),
                monthsBuffer,
                debtRatio
            }
        };
    }, [ytdTotals, totalSavedAtYearEnd, debtAtYearEnd, monthlyData]);

    // --- PDF Custom Export Engine ---
    const handleDownloadPDF = () => {
        try {
            setIsExporting(true);
            const doc = new jsPDF();

            // Set PDF theme colors
            let primaryColor: [number, number, number] = [24, 24, 27]; // zinc-900 (obsidian primary)
            let accentColor: [number, number, number] = [99, 102, 241]; // indigo (obsidian accent)

            if (pdfTheme === 'emerald') {
                primaryColor = [6, 78, 59]; // emerald-900
                accentColor = [16, 185, 129]; // emerald-500
            } else if (pdfTheme === 'sapphire') {
                primaryColor = [30, 58, 138]; // blue-900
                accentColor = [59, 130, 246]; // blue-500
            }

            // Helper to draw section headers with vertical accent bar
            const drawSectionHeader = (title: string, y: number) => {
                // Left vertical accent bar (3mm width, 6mm height)
                doc.setFillColor(...accentColor);
                doc.rect(15, y - 5, 2.5, 6, 'F');
                
                // Section Title text
                doc.setTextColor(...primaryColor);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(title, 20, y);

                // Thin separator line below title
                doc.setDrawColor(244, 244, 245); // zinc-100
                doc.setLineWidth(0.5);
                doc.line(15, y + 2, 195, y + 2);
            };

            // Helper to draw standardized premium tables
            const drawTable = (head: string[][], body: any[][], startY: number, options: any = {}) => {
                autoTable(doc, {
                    startY,
                    head,
                    body,
                    theme: 'plain',
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 8,
                        cellPadding: 4
                    },
                    styles: {
                        font: 'helvetica',
                        fontSize: 7.5,
                        cellPadding: 3.5,
                        textColor: [63, 63, 70], // zinc-700
                        lineColor: [228, 228, 231], // zinc-200
                        lineWidth: 0.1
                    },
                    alternateRowStyles: {
                        fillColor: [250, 250, 252] // clean off-white
                    },
                    ...options
                });
            };

            // PÁGINA 1: Header (Editorial/Premium style)
            // Accent line at the very top (4mm height)
            doc.setFillColor(...accentColor);
            doc.rect(0, 0, 210, 4, 'F');

            // Top branding text
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('VAULTLY', 15, 16);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(115, 115, 115); // zinc-400
            doc.text('FINANCE AUDIT ENGINE', 36, 16);

            doc.setFontSize(7.5);
            doc.text(`GENERADO EL: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`, 195, 16, { align: 'right' });

            // Thin horizontal rule under branding
            doc.setDrawColor(228, 228, 231); // zinc-200
            doc.setLineWidth(0.5);
            doc.line(15, 20, 195, 20);

            // Report Title
            doc.setTextColor(...primaryColor);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(`Reporte de Auditoría Financiera`, 15, 31);

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(82, 82, 91); // zinc-600
            doc.text(`Período Fiscal: ${selectedYear}  |  Divisa de Referencia: ${currency}  |  Ámbito: Balance Consolidado YTD`, 15, 37);

            // Thin separator under title
            doc.line(15, 41, 195, 41);

            let yOffset = 50;

            // 1. Health Score Module
            if (exportModules.health) {
                // Main Container Card
                doc.setDrawColor(228, 228, 231); // zinc-200
                doc.setFillColor(250, 250, 250); // off-white
                doc.setLineWidth(0.5);
                doc.roundedRect(15, yOffset, 180, 52, 3, 3, 'FD');

                // Left Box: Grade Banner
                doc.setFillColor(...primaryColor);
                doc.roundedRect(18, yOffset + 4, 32, 44, 2, 2, 'F');
                
                // Draw Grade Letter
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(28);
                doc.setFont('helvetica', 'bold');
                doc.text(healthScore.grade, 18 + 16, yOffset + 26, { align: 'center' });
                
                // Draw Grade Subtitle
                doc.setFontSize(7);
                doc.setTextColor(...accentColor);
                doc.text('AUDITORÍA', 18 + 16, yOffset + 38, { align: 'center' });
                
                // Middle Box: Verdict / Feedback
                doc.setTextColor(...primaryColor);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Dictamen de Salud Financiera', 55, yOffset + 10);
                
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(63, 63, 70); // zinc-700
                const feedbackLines = doc.splitTextToSize(`${healthScore.feedback}`, 72);
                doc.text(feedbackLines, 55, yOffset + 16);
                
                // Score Tag
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...accentColor);
                doc.text(`Puntuación: ${healthScore.totalScore} / 100 Puntos YTD`, 55, yOffset + 45);

                // Right Box: Visual Meters
                doc.setTextColor(...primaryColor);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Indicadores YTD', 134, yOffset + 10);

                const metrics = [
                    { name: 'Tasa Ahorro', score: healthScore.details.savingsRateScore },
                    { name: 'Fondo Emerg.', score: healthScore.details.emergencyBufferScore },
                    { name: 'Control Deuda', score: healthScore.details.debtLoadScore },
                    { name: 'Consistencia', score: healthScore.details.consistencyScore }
                ];

                metrics.forEach((m, idx) => {
                    const rowY = yOffset + 16 + (idx * 8.5);
                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(82, 82, 91); // zinc-600
                    doc.text(m.name, 134, rowY);
                    
                    // Value text
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(39, 39, 42);
                    doc.text(`${m.score}/25`, 160, rowY);

                    // Draw meter track
                    doc.setFillColor(228, 228, 231); // zinc-200
                    doc.rect(168, rowY - 2, 22, 1.5, 'F');

                    // Draw meter fill
                    doc.setFillColor(...accentColor);
                    const fillW = (m.score / 25) * 22;
                    doc.rect(168, rowY - 2, Math.max(0.5, fillW), 1.5, 'F');
                });

                yOffset += 60;
            }

            // 2. Summary Module
            if (exportModules.summary) {
                drawSectionHeader('Resumen YTD y Balance Consolidado', yOffset);

                const summaryBody = [
                    ['Ingresos Totales (Flujo Externo)', `${currency}${ytdTotals.income.toLocaleString()}`],
                    ['Gastos Totales (Flujo Externo)', `${currency}${ytdTotals.expense.toLocaleString()}`],
                    ['Ahorro Neto YTD', `${currency}${ytdTotals.savings.toLocaleString()}`],
                    ['Tasa de Ahorro Neto', `${ytdTotals.savingsRate.toFixed(1)}%`],
                    ['Saldo Disponible en Wallet', `${currency}${balanceAtYearEnd.toLocaleString()}`],
                    ['Bolsa de Ahorro Acumulado (Metas + Fondos)', `${currency}${totalSavedAtYearEnd.toLocaleString()}`],
                    ['Deuda Total Activa (Créditos)', `${currency}${debtAtYearEnd.toLocaleString()}`],
                    ['Valor Neto Real', `${currency}${netWorthAtYearEnd.toLocaleString()}`]
                ];

                drawTable(
                    [['Indicador Financiero', 'Monto al Cierre']],
                    summaryBody,
                    yOffset + 6,
                    {
                        columnStyles: {
                            0: { cellWidth: 120 },
                            1: { halign: 'right', fontStyle: 'bold', textColor: primaryColor }
                        }
                    }
                );

                yOffset = (doc as any).lastAutoTable.finalY + 15;
            }

            // 3. Category Breakdown Module
            if (exportModules.categories && categoryData.length > 0) {
                if (yOffset > 220) {
                    doc.addPage();
                    yOffset = 25;
                }

                drawSectionHeader('Desglose de Gastos por Categoría', yOffset);

                const categoryTableData = categoryData.map(c => [
                    c.name,
                    `${currency}${c.value.toLocaleString()}`,
                    `${((c.value / (ytdTotals.expense || 1)) * 100).toFixed(1)}%`
                ]);

                drawTable(
                    [['Categoría', 'Total Gastado', '% del Gasto Total']],
                    categoryTableData,
                    yOffset + 6,
                    {
                        columnStyles: {
                            1: { halign: 'right', fontStyle: 'bold' },
                            2: { halign: 'right', textColor: accentColor, fontStyle: 'bold' }
                        }
                    }
                );

                yOffset = (doc as any).lastAutoTable.finalY + 15;
            }

            // 4. Monthly History Module
            if (exportModules.monthly) {
                if (yOffset > 200) {
                    doc.addPage();
                    yOffset = 25;
                }

                drawSectionHeader('Historial de Desempeño Mensual', yOffset);

                const monthlyTableData = monthlyData.map(m => [
                    m.fullMonthName.charAt(0).toUpperCase() + m.fullMonthName.slice(1),
                    `${currency}${m.income.toLocaleString()}`,
                    `${currency}${m.expense.toLocaleString()}`,
                    `${currency}${m.savings.toLocaleString()}`
                ]);

                drawTable(
                    [['Mes', 'Ingresos', 'Gastos', 'Balance']],
                    monthlyTableData,
                    yOffset + 6,
                    {
                        columnStyles: {
                            1: { halign: 'right' },
                            2: { halign: 'right' },
                            3: { halign: 'right', fontStyle: 'bold' }
                        },
                        didParseCell: function (data: any) {
                            if (data.section === 'body' && data.column.index === 3) {
                                const val = data.cell.raw as string;
                                if (val.includes('-')) {
                                    data.cell.styles.textColor = [225, 29, 72]; // Rose 600
                                } else if (val !== `${currency}0` && val !== `${currency}0.00`) {
                                    data.cell.styles.textColor = [5, 150, 105]; // Emerald 600
                                }
                            }
                        }
                    }
                );

                yOffset = (doc as any).lastAutoTable.finalY + 15;
            }

            // 5. Goals Module
            if (exportModules.goals && goals.length > 0) {
                if (yOffset > 200) {
                    doc.addPage();
                    yOffset = 25;
                }

                drawSectionHeader('Metas de Ahorro y Hitos', yOffset);

                const goalsTableData = goals.map(g => [
                    g.name,
                    `${currency}${g.targetAmount.toLocaleString()}`,
                    `${currency}${g.currentAmount.toLocaleString()}`,
                    `${((g.currentAmount / (g.targetAmount || 1)) * 100).toFixed(0)}%`,
                    new Date(g.deadline).toLocaleDateString()
                ]);

                drawTable(
                    [['Nombre de Meta', 'Monto Objetivo', 'Monto Ahorrado', 'Progreso', 'Fecha Límite']],
                    goalsTableData,
                    yOffset + 6,
                    {
                        columnStyles: {
                            1: { halign: 'right' },
                            2: { halign: 'right' },
                            3: { halign: 'right', textColor: accentColor, fontStyle: 'bold' },
                            4: { halign: 'center' }
                        }
                    }
                );

                yOffset = (doc as any).lastAutoTable.finalY + 15;
            }

            // 6. Credits Module
            if (exportModules.credits && credits.length > 0) {
                if (yOffset > 200) {
                    doc.addPage();
                    yOffset = 25;
                }

                drawSectionHeader('Amortización de Deudas y Créditos', yOffset);

                const creditsTableData = credits.map(c => {
                    const status = getCreditStatus(c, endOfYearDate);
                    return [
                        c.name,
                        `${currency}${c.principal.toLocaleString()}`,
                        `${currency}${status.remainingBalance.toLocaleString()}`,
                        `${c.interestRate}%`,
                        `${currency}${Math.round(status.quota).toLocaleString()}/mes`,
                        c.status === 'paid' ? 'Pagado' : 'Activo'
                    ];
                });

                drawTable(
                    [['Crédito', 'Principal', 'Saldo Pendiente', 'Tasa Anual', 'Cuota de Pago', 'Estado']],
                    creditsTableData,
                    yOffset + 6,
                    {
                        columnStyles: {
                            1: { halign: 'right' },
                            2: { halign: 'right' },
                            3: { halign: 'right' },
                            4: { halign: 'right' },
                            5: { halign: 'center', fontStyle: 'bold' }
                        },
                        didParseCell: function (data: any) {
                            if (data.section === 'body' && data.column.index === 5) {
                                const val = data.cell.raw as string;
                                if (val === 'Pagado') {
                                    data.cell.styles.textColor = [5, 150, 105]; // Emerald 600
                                } else {
                                    data.cell.styles.textColor = [217, 119, 6]; // Amber 600
                                }
                            }
                        }
                    }
                );

                yOffset = (doc as any).lastAutoTable.finalY + 15;
            }

            // 7. Custom Notes & Tips Module
            if (customNotes.trim()) {
                if (yOffset > 210) {
                    doc.addPage();
                    yOffset = 25;
                }

                drawSectionHeader('Notas y Comentarios del Auditor', yOffset);

                doc.setDrawColor(228, 228, 231); // zinc-200
                doc.setFillColor(250, 250, 252); // soft off-white
                doc.roundedRect(15, yOffset + 6, 180, 38, 2, 2, 'FD');

                doc.setTextColor(82, 82, 91); // zinc-600
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                const notesLines = doc.splitTextToSize(customNotes, 170);
                doc.text(notesLines, 20, yOffset + 15);

                yOffset += 55;
            }

            // Footer / Watermark on all pages
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Top accent line
                doc.setFillColor(...accentColor);
                doc.rect(0, 0, 210, 4, 'F');
                
                // Footer separator line
                doc.setDrawColor(228, 228, 231);
                doc.setLineWidth(0.5);
                doc.line(15, 282, 195, 282);

                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(115, 115, 115);
                doc.text(`Generado vía Vaultly App - Página ${i} de ${pageCount}`, 15, 288);
                doc.text(`CONFIDENCIAL - Reporte de Salud Financiera`, 195, 288, { align: 'right' });
            }

            doc.save(`Vaultly_Auditoria_Financiera_${selectedYear}.pdf`);
            toast.success("Informe Descargado", {
                description: `El informe PDF de auditoría financiera de ${selectedYear} se generó y descargó con éxito.`
            });
        } catch (error) {
            console.error(error);
            toast.error("Error de Generación", {
                description: "Ocurrió un problema al compilar los gráficos o exportar el reporte PDF."
            });
        } finally {
            setIsExporting(false);
        }
    };

    // --- Colors for Charts ---
    const COLORS = [
        '#6366f1', // Indigo 500
        '#10b981', // Emerald 500
        '#f43f5e', // Rose 500
        '#eab308', // Yellow 500
        '#f97316', // Orange 500
        '#8b5cf6', // Violet 500
        '#06b6d4', // Cyan 500
        '#d946ef', // Fuchsia 500
        '#64748b', // Slate 500
    ];

    return (
        <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Controls */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        Auditoría y Reportes <span className="text-indigo-500 font-medium text-lg hidden sm:inline-block">Vaultly 2.0</span>
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        Auditoría de salud monetaria, balances acumulados y constructor de informes.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-fit">
                    <button
                        onClick={() => {
                            const currentIndex = availableYears.indexOf(selectedYear);
                            if (currentIndex < availableYears.length - 1) setSelectedYear(availableYears[currentIndex + 1]);
                        }}
                        disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl disabled:opacity-30 transition-colors"
                        title="Año Anterior"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={18} className="text-indigo-500" />
                        <span className="text-lg font-black font-mono tracking-tight text-zinc-800 dark:text-zinc-100">{selectedYear}</span>
                    </div>

                    <button
                        onClick={() => {
                            const currentIndex = availableYears.indexOf(selectedYear);
                            if (currentIndex > 0) setSelectedYear(availableYears[currentIndex - 1]);
                        }}
                        disabled={availableYears.indexOf(selectedYear) === 0}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl disabled:opacity-30 transition-colors"
                        title="Año Siguiente"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            {/* SECTION 1: FINANCIAL HEALTH SCORE GAUGE & AUDIT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1.1 Left Side: Giant Grade Card */}
                <div className={clsx(
                    "theme-card rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden border transition-all duration-300 group",
                    healthScore.gradeBg,
                    healthScore.gradeGlow
                )}>
                    {/* Glow backgrounds */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-current opacity-10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>

                    <Award size={32} className={clsx("mb-2", healthScore.gradeColor)} />
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 dark:text-zinc-400">Salud Financiera</span>
                    
                    <div className="relative my-4 flex items-center justify-center">
                        {/* Grade Letter */}
                        <span className={clsx("text-8xl font-black tracking-tighter drop-shadow-lg", healthScore.gradeColor)}>
                            {healthScore.grade}
                        </span>
                    </div>

                    <p className="text-zinc-800 dark:text-zinc-200 font-black text-sm">{healthScore.totalScore} / 100 Puntos</p>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed px-4">{healthScore.feedback}</p>
                </div>

                {/* 1.2 Right Side: Subscores & Recommendations */}
                <div className="lg:col-span-2 theme-card rounded-3xl p-6 flex flex-col justify-between space-y-6">
                    <div>
                        <h3 className="text-sm uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                            <HeartPulse size={16} className="text-indigo-400" /> Desglose de Indicadores
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Score 1 */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Tasa de Ahorro</span>
                                    <span className="font-mono text-zinc-500">{healthScore.details.savingsRateScore}/35 pts</span>
                                </div>
                                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(healthScore.details.savingsRateScore / 35) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Score 2 */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Colchón de Emergencias</span>
                                    <span className="font-mono text-zinc-500">{healthScore.details.emergencyBufferScore}/30 pts</span>
                                </div>
                                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(healthScore.details.emergencyBufferScore / 30) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Score 3 */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Carga de Deuda</span>
                                    <span className="font-mono text-zinc-500">{healthScore.details.debtLoadScore}/20 pts</span>
                                </div>
                                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(healthScore.details.debtLoadScore / 20) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Score 4 */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Consistencia Mensual</span>
                                    <span className="font-mono text-zinc-500">{healthScore.details.consistencyScore}/15 pts</span>
                                </div>
                                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(healthScore.details.consistencyScore / 15) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-800/80 rounded-2xl p-4 space-y-2">
                        <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest block flex items-center gap-1.5">
                            <ShieldAlert size={12} /> Sugerencias de Auditoría
                        </span>
                        <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4">
                            {healthScore.tips.map((tip, idx) => (
                                <li key={idx} className="leading-relaxed">{tip}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* SECTION 2: ANNUAL KEY METRICS YTD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 2.1 Inflows */}
                <div className="theme-card rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800/80 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Ingresos Totales YTD</span>
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{currency}{ytdTotals.income.toLocaleString()}</h3>
                        </div>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-3">Flujo de entrada externo acumulado.</p>
                </div>

                {/* 2.2 Outflows */}
                <div className="theme-card rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800/80 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Gastos Totales YTD</span>
                            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{currency}{ytdTotals.expense.toLocaleString()}</h3>
                        </div>
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
                            <TrendingDown size={18} />
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-3">Flujo de salida externo acumulado.</p>
                </div>

                {/* 2.3 Net Surplus */}
                <div className="theme-card rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800/80 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Ahorro YTD</span>
                            <h3 className={clsx("text-2xl font-black mt-1", ytdTotals.savings >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-500")}>
                                {currency}{ytdTotals.savings.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <PiggyBank size={18} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                        <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-md", ytdTotals.savingsRate >= 20 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-500")}>
                            {ytdTotals.savingsRate.toFixed(1)}% tasa
                        </span>
                        <span className="text-[9px] text-zinc-400">excl. ahorros internos</span>
                    </div>
                </div>

                {/* 2.4 Net Worth */}
                <div className="theme-card rounded-2xl p-5 border border-zinc-150 dark:border-zinc-800/80 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Valor Neto Cierre</span>
                            <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">{currency}{netWorthAtYearEnd.toLocaleString()}</h3>
                        </div>
                        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl">
                            <Calendar size={18} />
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-3">Wallet + Ahorros - Deuda al cierre.</p>
                </div>
            </div>

            {/* SECTION 3: CHARTS EVOLUTION & CATEGORIES */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 3.1 Monthly Evolution Bar Chart */}
                <div className="xl:col-span-2 theme-card rounded-3xl p-6 border border-zinc-150 dark:border-zinc-800/80">
                    <h3 className="text-sm uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 mb-6 flex items-center gap-2">
                        <Calendar size={16} className="text-zinc-400" /> Evolución Mensual
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `${currency}${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        borderRadius: '12px',
                                        border: '1px solid #27272a',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                                        color: '#f4f4f5'
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                                <Bar
                                    dataKey="income"
                                    name="Ingresos"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={30}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="Gastos"
                                    fill="#f43f5e"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3.2 Category Breakdown Pie Chart */}
                <div className="xl:col-span-1 theme-card rounded-3xl p-6 border border-zinc-150 dark:border-zinc-800/80 flex flex-col">
                    <h3 className="text-sm uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                        Desglose de Gastos
                    </h3>
                    <p className="text-[10px] text-zinc-400 mb-6">Top categorías de consumo del año.</p>

                    <div className="flex-1 min-h-[200px] relative flex items-center justify-center">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any, name: any) => [
                                            `${currency}${(typeof value === 'number' ? value : 0).toLocaleString()}`,
                                            String(name)
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#18181b',
                                            borderRadius: '12px',
                                            border: '1px solid #27272a',
                                            color: '#f4f4f5'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-xs">
                                <AlertCircle size={20} className="text-zinc-600 mb-1" />
                                Sin datos de egresos en {selectedYear}
                            </div>
                        )}
                    </div>

                    {/* Scrollable Legend list */}
                    {categoryData.length > 0 && (
                        <div className="mt-4 space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar text-xs">
                            {categoryData.slice(0, 5).map((cat, index) => (
                                <div key={cat.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]" title={cat.name}>
                                            {cat.name}
                                        </span>
                                    </div>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-200">
                                        {currency}{cat.value.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 4: INTERACTIVE PDF CUSTOMIZER PANEL */}
            <div className="theme-card rounded-3xl p-6 border border-zinc-150 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Constructor de Informes PDF</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Personaliza el diseño, la paleta y los módulos antes de la descarga.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Module Toggles */}
                    <div className="space-y-4">
                        <span className="text-[10px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest block">1. Seleccionar Módulos</span>
                        
                        <div className="space-y-2.5">
                            {Object.entries({
                                health: 'Auditoría de Salud Financiera',
                                summary: 'Resumen YTD y Balance Consolidado',
                                categories: 'Desglose de Gastos por Categoría',
                                monthly: 'Historial de Desempeño Mensual',
                                goals: 'Metas de Ahorro y Hitos',
                                credits: 'Amortización de Deudas y Créditos'
                            }).map(([key, label]) => (
                                <label 
                                    key={key} 
                                    className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/30 hover:bg-zinc-100 dark:hover:bg-zinc-950/60 rounded-xl cursor-pointer border border-zinc-200 dark:border-zinc-800 transition-colors"
                                >
                                    <input 
                                        type="checkbox" 
                                        checked={(exportModules as any)[key]} 
                                        onChange={() => setExportModules(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                                        className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-500 bg-transparent border-zinc-300 dark:border-zinc-700 rounded focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Theme & Metadata */}
                    <div className="space-y-4">
                        <span className="text-[10px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest block">2. Estética del Documento</span>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Paleta de Colores Corporativa</label>
                                <select
                                    value={pdfTheme}
                                    onChange={(e: any) => setPdfTheme(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="obsidian">Obsidian (Oscuro Moderno)</option>
                                    <option value="emerald">Esmeralda (Mint Ecológico)</option>
                                    <option value="sapphire">Zafiro (Classic Corporativo)</option>
                                </select>
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
                                <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider block flex items-center gap-1.5">
                                    <FileText size={12} /> Especificaciones PDF
                                </span>
                                <ul className="text-[10px] text-zinc-500 space-y-1 list-disc pl-4">
                                    <li>Exportación en formato A4 estándar (210 x 297mm).</li>
                                    <li>Maquetación autoajustable con salto de página inteligente.</li>
                                    <li>Codificación de colores dinámica según rendimientos.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right: Notes & Action */}
                    <div className="space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest block">3. Comentarios del Auditor (Opcional)</span>
                            <textarea
                                value={customNotes}
                                onChange={e => setCustomNotes(e.target.value)}
                                placeholder="Escribe notas de auditoría, recomendaciones personalizadas o conclusiones del año fiscal para imprimir en la última sección..."
                                rows={4}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs text-zinc-800 dark:text-zinc-200 font-medium placeholder:text-zinc-450 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={isExporting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Generando Documento...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    <span>Exportar Informe PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
