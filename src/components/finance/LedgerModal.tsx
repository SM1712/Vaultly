import { useState, useMemo } from 'react';
import { useLedger } from '../../hooks/useLedger';
import type { LedgerEntry } from '../../hooks/useLedger';
import { useFinance } from '../../context/FinanceContext';
import { useSettings } from '../../context/SettingsContext';
import Modal from '../ui/Modal';
import MonthSelector from '../MonthSelector';
import {
    ArrowUpLeft,
    ArrowDownRight,
    Search,
    Briefcase,
    Landmark,
    CreditCard,
    Wallet,
    Download
} from 'lucide-react';
import { clsx } from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface LedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SourceFilter = 'all' | 'transaction' | 'fund' | 'credit' | 'project';

const LedgerModal = ({ isOpen, onClose }: LedgerModalProps) => {
    const { ledgerEntries } = useLedger();
    const { selectedDate } = useFinance();
    const { currency } = useSettings();

    // Local filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
    const [isExporting, setIsExporting] = useState(false);

    // 1. Filter by Date and Search/Source
    const filteredEntries = useMemo(() => {
        return ledgerEntries.filter(t => {
            const [year, month] = t.date.split('-').map(Number);
            const isSameMonth = month === (selectedDate.getMonth() + 1) && year === selectedDate.getFullYear();

            if (!isSameMonth) return false;
            if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;

            const searchLower = searchTerm.toLowerCase();
            return (
                t.description.toLowerCase().includes(searchLower) ||
                t.category.toLowerCase().includes(searchLower) ||
                (t.fundName && t.fundName.toLowerCase().includes(searchLower)) ||
                (t.creditName && t.creditName.toLowerCase().includes(searchLower)) ||
                (t.projectName && t.projectName.toLowerCase().includes(searchLower))
            );
        });
    }, [ledgerEntries, selectedDate, sourceFilter, searchTerm]);

    // 2. Stats Calculation
    const stats = useMemo(() => {
        const income = filteredEntries.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = filteredEntries.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const balance = income - expense;
        return { income, expense, balance };
    }, [filteredEntries]);

    // 3. Group by Date
    const groupedEntries = useMemo(() => {
        const groups: { [key: string]: LedgerEntry[] } = {};

        filteredEntries.forEach(entry => {
            if (!groups[entry.date]) {
                groups[entry.date] = [];
            }
            groups[entry.date].push(entry);
        });

        // Entries are already sorted by date desc in useLedger, but keys iteration order isn't guaranteed.
        // We'll sort keys desc.
        return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
    }, [filteredEntries]);


    // Helper functions
    const getIconForSource = (source: string) => {
        switch (source) {
            case 'fund': return <Landmark size={14} className="text-amber-500" />;
            case 'credit': return <CreditCard size={14} className="text-purple-500" />;
            case 'project': return <Briefcase size={14} className="text-blue-500" />;
            default: return <Wallet size={14} className="text-zinc-500" />;
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'fund': return 'Fondo';
            case 'credit': return 'Crédito';
            case 'project': return 'Proyecto';
            default: return 'Billetera';
        }
    };

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(`${dateStr}T00:00:00`);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset times for accurate comparison
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) return 'Hoy';
        if (date.getTime() === yesterday.getTime()) return 'Ayer';

        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const getDateNet = (entries: LedgerEntry[]) => {
        return entries.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);
    };

    const handleDownloadPDF = () => {
        try {
            setIsExporting(true);
            const doc = new jsPDF();
            const monthName = selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            const fileName = `Libro_Contable_${selectedDate.getFullYear()}_${String(selectedDate.getMonth() + 1).padStart(2, '0')}.pdf`;

            // Title
            doc.setFontSize(22);
            doc.setTextColor(40, 40, 40);
            doc.text("Libro Contable Unificado", 14, 20);

            // Subtitle
            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);
            doc.text(`Periodo: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 30);

            // Summary Box
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(14, 40, 180, 25, 3, 3, 'F');

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("ENTRADAS", 25, 48);
            doc.text("SALIDAS", 90, 48);
            doc.text("NETO", 155, 48);

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(16, 185, 129); // Emerald
            doc.text(`+${currency}${stats.income.toFixed(2)}`, 25, 58);

            doc.setTextColor(225, 29, 72); // Rose
            doc.text(`-${currency}${stats.expense.toFixed(2)}`, 90, 58);

            doc.setTextColor(stats.balance >= 0 ? 40 : 225, stats.balance >= 0 ? 40 : 29, stats.balance >= 0 ? 40 : 72);
            doc.text(`${stats.balance >= 0 ? '+' : ''}${currency}${Math.abs(stats.balance).toFixed(2)}`, 155, 58);

            // Table Data Preparation
            const tableData = filteredEntries.map(t => [
                new Date(t.date).toLocaleDateString('es-ES'),
                t.description,
                t.category,
                getSourceLabel(t.source),
                t.type === 'income' ? `+${currency}${t.amount.toFixed(2)}` : `-${currency}${t.amount.toFixed(2)}`
            ]);

            // Table
            autoTable(doc, {
                startY: 75,
                head: [['Fecha', 'Descripción', 'Categoría', 'Origen', 'Monto']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [24, 24, 27], // Zinc 900
                    textColor: 255,
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    // Colorize Amount Column
                    if (data.section === 'body' && data.column.index === 4) {
                        const type = filteredEntries[data.row.index].type;
                        if (type === 'income') {
                            data.cell.styles.textColor = [16, 185, 129];
                        } else {
                            data.cell.styles.textColor = [225, 29, 72];
                        }
                    }
                }
            });

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} - Vaultly`, 14, doc.internal.pageSize.height - 10);
                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
            }

            doc.save(fileName);
            toast.success("PDF descargado correctamente");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Error al generar el PDF");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Libro Contable Unificado"
            maxWidth="max-w-2xl"
            headerActions={
                <button
                    onClick={handleDownloadPDF}
                    disabled={isExporting || filteredEntries.length === 0}
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Descargar PDF"
                >
                    <Download size={18} />
                </button>
            }
        >
            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="w-full sm:w-auto self-start">
                            <MonthSelector />
                        </div>
                        <div className="flex gap-4 sm:ml-auto">
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Ingresos</p>
                                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">+{currency}{stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="w-px bg-zinc-200 dark:bg-zinc-800" />
                            <div className="text-left">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Gastos</p>
                                <p className="text-rose-600 dark:text-rose-400 font-bold text-sm">-{currency}{stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Balance del periodo</span>
                        <span className={clsx("font-bold text-lg", stats.balance >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-500')}>
                            {stats.balance >= 0 ? '+' : ''}{currency}{Math.abs(stats.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar movimientos..."
                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide shrink-0 items-center">
                        {(['all', 'transaction', 'fund', 'credit', 'project'] as SourceFilter[]).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setSourceFilter(filter)}
                                className={clsx(
                                    "px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border",
                                    sourceFilter === filter
                                        ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-md"
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                )}
                            >
                                {filter === 'all' ? 'Todo' :
                                    filter === 'transaction' ? 'Billetera' :
                                        filter === 'fund' ? 'Fondos' :
                                            filter === 'credit' ? 'Créditos' : 'Proyectos'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grouped List */}
                <div className="space-y-6 min-h-[300px] max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 opacity-60">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} />
                            </div>
                            <p className="font-medium">No se encontraron movimientos</p>
                            <p className="text-xs">Intenta cambiar los filtros o el mes</p>
                        </div>
                    ) : (
                        groupedEntries.map(([date, entries]) => {
                            const dailyNet = getDateNet(entries);
                            return (
                                <div key={date} className="relative pt-2">
                                    {/* Date Header Header Block */}
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize flex items-center gap-2">
                                            {formatDateHeader(date)}
                                        </h3>
                                        <span className={clsx("text-xs font-bold",
                                            dailyNet > 0 ? "text-emerald-600 dark:text-emerald-400" :
                                                dailyNet < 0 ? "text-rose-600 dark:text-rose-400" :
                                                    "text-zinc-500 dark:text-zinc-400"
                                        )}>
                                            {dailyNet > 0 ? '+' : ''}{currency}{Math.abs(dailyNet).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    {/* Transactions List */}
                                    <div className="flex flex-col gap-px bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80">
                                        {entries.map(t => (
                                            <div key={t.id} className="relative bg-white dark:bg-zinc-900 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between gap-3">

                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white shadow-inner",
                                                        t.type === 'income'
                                                            ? 'bg-emerald-500'
                                                            : 'bg-zinc-800 dark:bg-zinc-700'
                                                    )}>
                                                        {t.type === 'income' ? <ArrowDownRight size={18} strokeWidth={2.5} /> : <ArrowUpLeft size={18} strokeWidth={2.5} />}
                                                    </div>

                                                    <div className="min-w-0 flex flex-col justify-center">
                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">{t.description}</span>
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mt-0.5">
                                                            <span className="flex items-center gap-1 font-medium">
                                                                {getIconForSource(t.source)}
                                                                {getSourceLabel(t.source)}
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                            <span className="truncate max-w-[120px]">{t.category}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <p className={clsx("font-bold text-sm",
                                                        t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
                                                    )}>
                                                        {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default LedgerModal;
