import React, { useState } from 'react';
import { toast } from 'sonner';
import { useFunds } from '../hooks/useFunds';
import { useBalance } from '../hooks/useBalance';
import { useSettings } from '../context/SettingsContext';
import {
    Plus, Trash2, Gift, DollarSign, Heart, Flame,
    PiggyBank, Wallet, Star, Smile, Briefcase, Car,
    Plane, Home, Coffee, Gamepad2, Smartphone,
    MoreHorizontal, ArrowUpRight, ArrowDownLeft, Check,
    Pencil, Zap, Calendar, ChevronLeft, ChevronRight,
    TrendingUp, Info, Eye, EyeOff, ShieldAlert, Sparkles
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import { clsx } from 'clsx';
import type { Fund } from '../types';

// Icon Map for dynamic rendering
const ICON_MAP: Record<string, React.ElementType> = {
    'gift': Gift,
    'money': DollarSign,
    'heart': Heart,
    'phoenix': Flame,
    'piggy': PiggyBank,
    'wallet': Wallet,
    'star': Star,
    'smile': Smile,
    'briefcase': Briefcase,
    'car': Car,
    'plane': Plane,
    'home': Home,
    'coffee': Coffee,
    'game': Gamepad2,
    'phone': Smartphone,
    'other': MoreHorizontal
};

const TEXTURES = [
    { id: 'frost', label: 'Frost Boreal', description: 'Cristal translúcido con brillo auroral' },
    { id: 'obsidian', label: 'Obsidian Metal', description: 'Borde de acero con relieve pulido' },
    { id: 'neon', label: 'Neon Cyber', description: 'Borde de neón pulsante activo' }
];

const COLORS = [
    { id: 'emerald', class: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/20', solidClass: 'bg-emerald-500', glow: 'rgba(16,185,129,0.35)', text: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'blue', class: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-500/20', solidClass: 'bg-blue-500', glow: 'rgba(59,130,246,0.35)', text: 'text-blue-600 dark:text-blue-400' },
    { id: 'rose', class: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/20', solidClass: 'bg-rose-500', glow: 'rgba(244,63,94,0.35)', text: 'text-rose-600 dark:text-rose-400' },
    { id: 'amber', class: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/20', solidClass: 'bg-amber-500', glow: 'rgba(245,158,11,0.35)', text: 'text-amber-700 dark:text-amber-400' },
    { id: 'violet', class: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-500/20', solidClass: 'bg-violet-500', glow: 'rgba(139,92,246,0.35)', text: 'text-violet-600 dark:text-violet-400' },
    { id: 'zinc', class: 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800', solidClass: 'bg-zinc-400', glow: 'rgba(161,161,170,0.35)', text: 'text-zinc-600 dark:text-zinc-400' },
];

const Funds = () => {
    const { funds, addFund, deleteFund, addTransaction, updateFund } = useFunds();
    const { currency } = useSettings();
    const { currentBalance } = useBalance();

    // Create/Edit Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingFundId, setEditingFundId] = useState<string | null>(null);
    const [newFund, setNewFund] = useState<Partial<Fund> & { name: string, icon: string, color: string, texture: 'frost' | 'obsidian' | 'neon' }>({
        name: '',
        icon: 'piggy',
        description: '',
        color: 'emerald',
        texture: 'frost'
    });

    // Transaction Modal State
    const [txModal, setTxModal] = useState<{ open: boolean; type: 'deposit' | 'withdraw'; fundId: string }>({
        open: false, type: 'deposit', fundId: ''
    });
    const [txAmount, setTxAmount] = useState('');
    const [txNote, setTxNote] = useState('');

    // Collapsed histories state per card
    const [expandedFundId, setExpandedFundId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFund.name) return;

        const fundPayload = {
            name: newFund.name,
            icon: newFund.icon,
            description: newFund.description || '',
            color: newFund.color || 'emerald',
            texture: newFund.texture || 'frost',
            autoSaveConfig: newFund.autoSaveConfig
        };

        if (editingFundId) {
            updateFund(editingFundId, fundPayload);
            toast.success("Fondo Actualizado", {
                description: `Los datos del fondo "${newFund.name}" se modificaron correctamente.`
            });
        } else {
            addFund(fundPayload);
            toast.success("Fondo Creado", {
                description: `El fondo de reserva "${newFund.name}" ha sido habilitado.`
            });
        }

        setNewFund({ name: '', icon: 'piggy', description: '', color: 'emerald', texture: 'frost' });
        setEditingFundId(null);
        setIsCreateOpen(false);
    };

    const openCreate = () => {
        setEditingFundId(null);
        setNewFund({ name: '', icon: 'piggy', description: '', color: 'emerald', texture: 'frost' });
        setIsCreateOpen(true);
    };

    const openEdit = (fund: any) => {
        setEditingFundId(fund.id);
        setNewFund({
            name: fund.name,
            icon: fund.icon,
            description: fund.description || '',
            color: fund.color || 'emerald',
            texture: fund.texture || 'frost',
            autoSaveConfig: fund.autoSaveConfig
        });
        setIsCreateOpen(true);
    };

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(txAmount);
        if (!amount || amount <= 0) return;

        if (txModal.type === 'deposit' && amount > currentBalance) {
            toast.error("Fondos Insuficientes", {
                description: `Solo tienes ${currency}${currentBalance.toLocaleString()} disponible en Wallet.`
            });
            return;
        }

        addTransaction(txModal.fundId, amount, txModal.type, txNote);
        setTxModal({ ...txModal, open: false });
        setTxAmount('');
        setTxNote('');
    };

    const openTxModal = (type: 'deposit' | 'withdraw', fundId: string) => {
        setTxModal({ open: true, type, fundId });
    };

    const getIcon = (iconName: string) => {
        const Icon = ICON_MAP[iconName] || MoreHorizontal;
        return <Icon size={24} />;
    };

    // Card 3D tilt effects
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((centerY - y) / centerY) * 8; // Maximum 8 degrees for elegant rotation
        const rotateY = ((x - centerX) / centerX) * 8;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        card.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        card.style.transition = 'none';
    };    // Calculate aggregated savings
    const totalSavings = funds.reduce((sum, f) => sum + (f.currentAmount || 0), 0);

    return (
        <div className="space-y-8 pb-24 md:pb-6 min-h-screen text-zinc-800 dark:text-zinc-200">
            {/* Header Premium Obsidian & Aurora */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-zinc-50/50 to-zinc-100/30 dark:from-zinc-900 dark:via-zinc-950 dark:to-black border border-zinc-200 dark:border-zinc-800/80 shadow-md dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Aurora Background Effect */}
                <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[80%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[80%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse" />

                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 z-10">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                            <Sparkles size={14} /> Gestión de Bóvedas
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                            Fondos Compartimentados
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
                            Resguarda tu capital separándolo en bóvedas de ahorro con reglas automatizadas, historial detallado y texturas de cristal.
                        </p>
                    </div>

                    {/* Stats Widget */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-4">
                        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 px-5 py-3.5 rounded-2xl flex flex-col justify-center min-w-[150px]">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Total Protegido</span>
                            <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                {currency}{totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        
                        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 px-5 py-3.5 rounded-2xl flex flex-col justify-center min-w-[150px]">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Billetera Disponible</span>
                            <span className="text-2xl font-mono font-black text-zinc-800 dark:text-zinc-100 tracking-tighter">
                                {currency}{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <button
                            onClick={openCreate}
                            className="group relative flex items-center justify-center gap-2 bg-zinc-950 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 px-5 py-3.5 rounded-2xl font-bold transition-all shadow-md hover:scale-[1.03] active:scale-95 duration-300"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-xs uppercase tracking-wider font-extrabold">Crear Fondo</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Funds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {funds.length === 0 ? (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/10 dark:bg-zinc-950/20 backdrop-blur-sm">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/15 blur-3xl rounded-full" />
                            <div className="relative p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-2xl">
                                <PiggyBank size={48} strokeWidth={1.2} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-300 mb-2">No se encontraron bóvedas de ahorro</h3>
                        <p className="text-zinc-500 text-center max-w-sm px-6 text-sm">
                            Establece una bolsa separada para tu fondo de emergencia, vacaciones o compras planificadas. Todo sincronizado en el ledger central.
                        </p>
                    </div>
                ) : (
                    funds.map(fund => {
                        const colorObj = COLORS.find(c => c.id === fund.color) || COLORS[0];
                        const texture = fund.texture || 'frost';
                        
                        let cardClass = '';
                        let cardStyle: React.CSSProperties = {};
                        const isDarkCard = texture === 'obsidian';

                        if (texture === 'frost') {
                            cardClass = "bg-white/70 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]";
                            cardStyle = {
                                boxShadow: `0 8px 32px 0 rgba(0,0,0,0.03), 0 0 50px -10px ${colorObj.glow}`
                            };
                        } else if (texture === 'obsidian') {
                            cardClass = "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_15px_35px_rgba(0,0,0,0.7)] text-zinc-100 border-t border-b";
                            cardStyle = {
                                borderLeft: `4px solid ${colorObj.solidClass.replace('bg-', '') === 'emerald-500' ? '#10b981' : colorObj.solidClass.replace('bg-', '') === 'blue-500' ? '#3b82f6' : colorObj.solidClass.replace('bg-', '') === 'rose-500' ? '#f43f5e' : colorObj.solidClass.replace('bg-', '') === 'amber-500' ? '#f59e0b' : colorObj.solidClass.replace('bg-', '') === 'violet-500' ? '#8b5cf6' : '#a1a1aa'}`
                            };
                        } else if (texture === 'neon') {
                            const rgbColor = colorObj.solidClass.replace('bg-', '') === 'emerald-500' ? '16,185,129' : colorObj.solidClass.replace('bg-', '') === 'blue-500' ? '59,130,246' : colorObj.solidClass.replace('bg-', '') === 'rose-500' ? '244,63,94' : colorObj.solidClass.replace('bg-', '') === 'amber-500' ? '245,158,11' : colorObj.solidClass.replace('bg-', '') === 'violet-500' ? '139,92,246' : '161,161,170';
                            cardClass = "bg-white dark:bg-black border-2 shadow-[0_0_30px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(0,0,0,0.85)]";
                            cardStyle = {
                                borderColor: `rgba(${rgbColor}, 0.5)`,
                                boxShadow: `0 0 25px rgba(${rgbColor}, 0.1), inset 0 0 15px rgba(${rgbColor}, 0.04)`
                            };
                        }

                        const isHistoryExpanded = expandedFundId === fund.id;

                        // Text colors based on card type
                        const textTitleClass = isDarkCard ? 'text-zinc-100' : 'text-zinc-900 dark:text-zinc-50';
                        const textDescClass = isDarkCard ? 'text-zinc-400' : 'text-zinc-600 dark:text-zinc-400';
                        const textMutedClass = isDarkCard ? 'text-zinc-600' : 'text-zinc-400 dark:text-zinc-500';
                        const textLabelClass = isDarkCard ? 'text-zinc-500' : 'text-zinc-550 dark:text-zinc-400';
                        const textValueClass = isDarkCard ? 'text-zinc-50 font-mono' : 'text-zinc-900 dark:text-zinc-50 font-mono';

                        return (
                            <div
                                key={fund.id}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onMouseEnter={handleMouseEnter}
                                style={cardStyle}
                                className={clsx(
                                    "group relative flex flex-col rounded-[2rem] p-6 transition-all duration-500 overflow-hidden cursor-default border-t border-b",
                                    cardClass
                                )}
                            >
                                {/* Textured Diagonal Lines Overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.01)_50%,transparent_75%)] bg-[length:250px_250px] opacity-60 pointer-events-none" />

                                {/* Card Glowing Center */}
                                <div
                                    className="absolute -right-24 -top-24 w-52 h-52 rounded-full blur-[70px] opacity-20 group-hover:opacity-35 transition-opacity duration-700 pointer-events-none"
                                    style={{ backgroundColor: colorObj.glow.split('(')[1] ? `rgba(${colorObj.glow.split('(')[1].split(')')[0]})` : 'rgba(255,255,255,0.1)' }}
                                />

                                {/* Header: Icon & Edit Actions */}
                                <div className="relative flex justify-between items-start mb-6">
                                    <div className={clsx(
                                        "p-3.5 rounded-2xl border transition-all duration-500 group-hover:scale-110",
                                        colorObj.class
                                    )}>
                                        {getIcon(fund.icon)}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        <button
                                            onClick={() => openEdit(fund)}
                                            className={clsx(
                                                "p-2 rounded-xl transition-all shadow-sm border",
                                                isDarkCard 
                                                    ? "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
                                                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/85 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            )}
                                            title="Editar Fondo"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`¿Estás seguro de eliminar el fondo "${fund.name}"? El saldo acumulado se liberará a la billetera.`)) {
                                                    deleteFund(fund.id);
                                                }
                                            }}
                                            className={clsx(
                                                "p-2 rounded-xl transition-all shadow-sm border",
                                                isDarkCard 
                                                    ? "bg-zinc-900/90 hover:bg-rose-950/60 border-zinc-800 hover:border-rose-900/50 text-zinc-300 hover:text-rose-400"
                                                    : "bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-900/85 dark:hover:bg-rose-950/60 border-zinc-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/50 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                                            )}
                                            title="Eliminar Fondo"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="relative flex-1 space-y-2">
                                    <h3 className={clsx("text-2xl font-black tracking-tight transition-colors", textTitleClass)}>
                                        {fund.name}
                                    </h3>
                                    {fund.description ? (
                                        <p className={clsx("text-xs leading-relaxed", textDescClass)}>{fund.description}</p>
                                    ) : (
                                        <p className={clsx("text-xs italic", textMutedClass)}>Bóveda sin descripción asignada</p>
                                    )}
                                </div>

                                {/* Auto-Save Badge */}
                                {fund.autoSaveConfig?.enabled && (
                                    <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wider w-max">
                                        <Zap size={10} /> Auto: {fund.autoSaveConfig.type === 'fixed' ? `${currency}${fund.autoSaveConfig.amount}` : `${fund.autoSaveConfig.amount}%`} (Día {fund.autoSaveConfig.dayOfMonth})
                                    </div>
                                )}

                                {/* Balance */}
                                <div className="relative mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800/60">
                                    <p className={clsx("text-[9px] font-bold uppercase tracking-widest mb-0.5", textLabelClass)}>Saldo Reservado</p>
                                    <p className={clsx("text-4xl font-black tracking-tight", textValueClass)}>
                                        <span className="text-lg text-zinc-400 dark:text-zinc-500 font-sans mr-0.5">{currency}</span>
                                        {fund.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                {/* Collapsible History Section */}
                                {fund.history && fund.history.length > 0 && (
                                    <div className="mt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedFundId(isHistoryExpanded ? null : fund.id);
                                            }}
                                            className={clsx(
                                                "w-full py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider border-t border-b transition-colors",
                                                isDarkCard
                                                    ? "text-zinc-500 hover:text-zinc-300 border-zinc-800/60"
                                                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border-zinc-200 dark:border-zinc-800"
                                            )}
                                        >
                                            <span className="flex items-center gap-1 pointer-events-none">
                                                {isHistoryExpanded ? <EyeOff size={10} /> : <Eye size={10} />} Historial de Movimientos
                                            </span>
                                            <span className="pointer-events-none">{fund.history.length}</span>
                                        </button>

                                        {isHistoryExpanded && (
                                            <div className="mt-3 space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
                                                {fund.history.slice(0, 5).map(tx => (
                                                    <div 
                                                        key={tx.id} 
                                                        className={clsx(
                                                            "flex justify-between items-center text-xs py-1.5 px-2.5 rounded-xl border",
                                                            isDarkCard
                                                                ? "bg-zinc-950/60 border-zinc-900"
                                                                : "bg-zinc-100/60 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/50"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className={clsx("font-bold text-[11px]", isDarkCard ? "text-zinc-400" : "text-zinc-700 dark:text-zinc-300")}>{tx.note || (tx.type === 'deposit' ? 'Aporte' : 'Retiro')}</span>
                                                            <span className="text-[9px] text-zinc-500">{tx.date}</span>
                                                        </div>
                                                        <span className={clsx(
                                                            "font-mono font-bold text-xs",
                                                            tx.type === 'deposit' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-650 dark:text-rose-450"
                                                        )}>
                                                            {tx.type === 'deposit' ? '+' : '-'}{currency}{tx.amount}
                                                        </span>
                                                    </div>
                                                ))}
                                                {fund.history.length > 5 && (
                                                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 text-center italic mt-1 font-semibold">
                                                        Mostrando los últimos 5 movimientos
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <button
                                        onClick={() => openTxModal('deposit', fund.id)}
                                        className={clsx(
                                            "group/btn relative overflow-hidden py-3 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm",
                                            isDarkCard
                                                ? "bg-white hover:bg-zinc-100 text-zinc-950"
                                                : "bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-900 dark:hover:bg-white text-white dark:text-zinc-950"
                                        )}
                                    >
                                        <ArrowDownLeft size={14} className="transition-transform group-hover/btn:-translate-x-0.5 group-hover/btn:translate-y-0.5" />
                                        <span>Depositar</span>
                                    </button>
                                    <button
                                        onClick={() => openTxModal('withdraw', fund.id)}
                                        className={clsx(
                                            "group/btn relative py-3 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 border",
                                            isDarkCard
                                                ? "bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white"
                                                : "bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-850 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                        )}
                                    >
                                        <ArrowUpRight size={14} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                        <span>Retirar</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={editingFundId ? "Configurar Bóveda" : "Crear Nueva Bóveda"}>
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    
                    {/* Live Preview Header */}
                    <div className="flex flex-col items-center">
                        <div className={clsx(
                            "w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-all duration-500 border",
                            COLORS.find(c => c.id === newFund.color)?.class || COLORS[0].class
                        )}>
                            {getIcon(newFund.icon)}
                        </div>

                        <div className="w-full relative">
                            <input
                                autoFocus
                                type="text"
                                required
                                className="w-full text-center text-2xl font-black bg-transparent border-b border-zinc-200 dark:border-zinc-800 py-2 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                                placeholder="Nombre de la Bóveda"
                                value={newFund.name}
                                onChange={e => setNewFund({ ...newFund, name: e.target.value })}
                            />
                            <label className="block text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1.5">
                                Identificador del Fondo
                            </label>
                        </div>
                    </div>

                    {/* Texture Option Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Aspecto / Textura</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TEXTURES.map(tex => (
                                <button
                                    key={tex.id}
                                    type="button"
                                    onClick={() => setNewFund({ ...newFund, texture: tex.id as any })}
                                    className={clsx(
                                        "px-3 py-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1",
                                        newFund.texture === tex.id
                                            ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-950 shadow-md scale-[1.03]"
                                            : "bg-zinc-55 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                                    )}
                                >
                                    <span className="text-xs font-bold">{tex.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Glow de Borde y Fondo</label>
                        <div className="flex justify-center gap-2.5">
                            {COLORS.map(color => (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setNewFund({ ...newFund, color: color.id })}
                                    className={clsx(
                                        "w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110",
                                        color.solidClass,
                                        newFund.color === color.id
                                            ? "ring-2 ring-zinc-400 dark:ring-zinc-600 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 scale-110 shadow-lg"
                                            : "opacity-45 hover:opacity-100"
                                    )}
                                >
                                    {newFund.color === color.id && <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Icon Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Iconografía</label>
                        <div className="grid grid-cols-8 gap-1.5">
                            {Object.keys(ICON_MAP).map(key => {
                                const Icon = ICON_MAP[key];
                                const isSelected = newFund.icon === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setNewFund({ ...newFund, icon: key })}
                                        className={clsx("aspect-square rounded-xl flex items-center justify-center transition-all duration-300",
                                            isSelected
                                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md scale-105"
                                                : "bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-300 border border-zinc-200 dark:border-zinc-900"
                                        )}
                                    >
                                        <Icon size={16} strokeWidth={isSelected ? 2.5 : 2} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-semibold">Propósito del Ahorro</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-3 text-xs text-zinc-800 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            placeholder="Ej. Resguardo para emergencias del hogar..."
                            value={newFund.description || ''}
                            onChange={e => setNewFund({ ...newFund, description: e.target.value })}
                        />
                    </div>

                    {/* Auto-Save Configuration Section */}
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={clsx(
                                    "p-2 rounded-lg transition-colors border",
                                    newFund.autoSaveConfig?.enabled 
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                                        : "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-500"
                                )}>
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-300">Regla de Ahorro Automático</h4>
                                    <p className="text-[10px] text-zinc-500">Inyectar saldo mensualmente de forma automatizada</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNewFund({
                                    ...newFund,
                                    autoSaveConfig: {
                                        enabled: !newFund.autoSaveConfig?.enabled,
                                        type: newFund.autoSaveConfig?.type || 'fixed',
                                        amount: newFund.autoSaveConfig?.amount || 0,
                                        dayOfMonth: newFund.autoSaveConfig?.dayOfMonth || 1
                                    }
                                })}
                                className={clsx("w-10 h-5 rounded-full transition-colors relative", newFund.autoSaveConfig?.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-800")}
                            >
                                <div className={clsx("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300", newFund.autoSaveConfig?.enabled ? "left-5.5" : "left-0.5")} />
                            </button>
                        </div>

                        {newFund.autoSaveConfig?.enabled && (
                            <div className="space-y-3 p-3.5 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-900/80 animate-in fade-in slide-in-from-top-1">
                                {/* Type Selector */}
                                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-200 dark:bg-zinc-900 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig!, type: 'fixed' } })}
                                        className={clsx("py-1 text-[10px] font-black rounded-md transition-all uppercase tracking-wider",
                                            newFund.autoSaveConfig.type === 'fixed'
                                                ? "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        Monto Fijo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig!, type: 'percentage' } })}
                                        className={clsx("py-1 text-[10px] font-black rounded-md transition-all uppercase tracking-wider",
                                            newFund.autoSaveConfig.type === 'percentage'
                                                ? "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        Porcentaje (%)
                                    </button>
                                </div>

                                {/* Day Selector (Stepper Style) */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Día de Transferencia</label>
                                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = newFund.autoSaveConfig?.dayOfMonth || 1;
                                                const prev = current === 1 ? 31 : current - 1;
                                                setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig!, dayOfMonth: prev } });
                                            }}
                                            className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        <div className="flex-1 flex flex-col items-center">
                                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Se ejecuta el día</span>
                                            <span className="text-lg font-black text-zinc-800 dark:text-zinc-200">{newFund.autoSaveConfig?.dayOfMonth}</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const current = newFund.autoSaveConfig?.dayOfMonth || 1;
                                                const next = current === 31 ? 1 : current + 1;
                                                setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig!, dayOfMonth: next } });
                                            }}
                                            className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 active:scale-95 transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                                        {newFund.autoSaveConfig.type === 'fixed' ? `Monto a debitar (${currency})` : 'Porcentaje de saldo disponible'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-900 rounded-xl px-3 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-700"
                                            placeholder="0"
                                            value={newFund.autoSaveConfig.amount === 0 ? '' : newFund.autoSaveConfig.amount}
                                            onChange={e => setNewFund({ ...newFund, autoSaveConfig: { ...newFund.autoSaveConfig!, amount: e.target.value === '' ? 0 : Number(e.target.value) } })}
                                        />
                                        {newFund.autoSaveConfig.type === 'percentage' && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold text-xs">%</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 dark:text-zinc-400 italic px-1 pt-1 font-semibold">
                                    <Info size={11} className="text-zinc-500" />
                                    <span>
                                        {newFund.autoSaveConfig.type === 'fixed'
                                            ? `Transfiere automáticamente ${currency}${newFund.autoSaveConfig.amount} cada mes el día ${newFund.autoSaveConfig.dayOfMonth}.`
                                            : `Ahorra el ${newFund.autoSaveConfig.amount}% del disponible en wallet el día ${newFund.autoSaveConfig.dayOfMonth}.`
                                        }
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-2xl font-black text-sm bg-zinc-950 hover:bg-zinc-850 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-2"
                    >
                        {editingFundId ? <Pencil size={16} /> : <Plus size={16} />}
                        <span>{editingFundId ? 'Guardar Cambios' : 'Inicializar Bóveda'}</span>
                    </button>
                </form>
            </Modal>

            {/* Transaction Modal (Deposit/Withdrawal) */}
            <Modal isOpen={txModal.open} onClose={() => setTxModal({ ...txModal, open: false })} title={txModal.type === 'deposit' ? 'Aporte a Bóveda' : 'Retiro de Bóveda'}>
                <form onSubmit={handleTransaction} className="space-y-5">
                    <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-900 flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-450 font-bold uppercase tracking-wider">Disponible en Wallet</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">
                            {currency}{currentBalance.toLocaleString()}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Monto del Movimiento</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-mono font-bold">{currency}</span>
                            <input
                                autoFocus
                                type="number"
                                step="any"
                                required
                                className="w-full bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl pl-9 pr-4 py-3 text-zinc-800 dark:text-zinc-200 font-mono font-bold focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800"
                                placeholder="0.00"
                                value={txAmount}
                                onChange={e => setTxAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nota descriptiva (Opcional)</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-55 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl px-4 py-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-650"
                            placeholder={txModal.type === 'deposit' ? 'Ej. Excedente del mes...' : 'Ej. Para pago de reparaciones...'}
                            value={txNote}
                            onChange={e => setTxNote(e.target.value)}
                        />
                    </div>

                    {txModal.type === 'deposit' && Number(txAmount) > currentBalance && (
                        <div className="flex items-start gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-xl text-xs">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span>El monto solicitado excede tu saldo disponible en la billetera. No se guardará el registro.</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={txModal.type === 'deposit' && Number(txAmount) > currentBalance}
                        className={clsx(
                            "w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center",
                            txModal.type === 'deposit' 
                                ? "bg-emerald-500 hover:bg-emerald-450 text-emerald-950 font-black" 
                                : "bg-rose-500 hover:bg-rose-400 text-rose-950 font-black"
                        )}
                    >
                        Confirmar {txModal.type === 'deposit' ? 'Depósito' : 'Retiro'}
                    </button>
                </form>
            </Modal>
        </div >
    );
};

export default Funds;
