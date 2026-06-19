import { useState, useEffect } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useCategories } from '../../../hooks/useCategories';
import { useData } from '../../../context/DataContext';
import { ShieldAlert, Coins, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { CategoryBudgetRule } from '../../../types';

export const SettingsLimits = () => {
    const { data } = useData();
    const { currency, spendingLimits, updateSpendingLimits } = useSettings();
    const { categories: expenseCats } = useCategories('expense');

    const [globalAmount, setGlobalAmount] = useState(spendingLimits.global.amount.toString());
    
    // Store category rules locally to avoid immediate Firestore sync during typing, 
    // then sync on blur or selection changes
    const [localRules, setLocalRules] = useState<Record<string, CategoryBudgetRule>>(spendingLimits.rules || {});

    // Keep local rules updated if cloud settings change
    useEffect(() => {
        setLocalRules(spendingLimits.rules || {});
    }, [spendingLimits.rules]);

    // Calculate current month's spending per category
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
    const categorySpentMap = (data.transactions || [])
        .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const totalSpentThisMonth = Object.values(categorySpentMap).reduce((sum, val) => sum + val, 0);

    const handleGlobalToggle = (enabled: boolean) => {
        updateSpendingLimits({
            global: {
                ...spendingLimits.global,
                enabled
            }
        });
    };

    const handleGlobalAmountBlur = () => {
        const amt = Number(globalAmount);
        if (!isNaN(amt) && amt >= 0) {
            updateSpendingLimits({
                global: {
                    ...spendingLimits.global,
                    amount: amt
                }
            });
        } else {
            setGlobalAmount(spendingLimits.global.amount.toString());
        }
    };

    const handleGlobalPeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
        updateSpendingLimits({
            global: {
                ...spendingLimits.global,
                period
            }
        });
    };

    const syncRuleToCloud = (category: string, rule: CategoryBudgetRule | null) => {
        const nextRules = { ...spendingLimits.rules };
        if (!rule || rule.value <= 0) {
            delete nextRules[category];
        } else {
            nextRules[category] = rule;
        }
        updateSpendingLimits({
            rules: nextRules
        });
    };

    const handleRuleTypeChange = (category: string, type: CategoryBudgetRule['type']) => {
        const currentVal = localRules[category]?.value || 0;
        const newRule: CategoryBudgetRule = { type, value: currentVal };
        
        setLocalRules(prev => ({
            ...prev,
            [category]: newRule
        }));

        syncRuleToCloud(category, newRule);
    };

    const handleRuleValueChange = (category: string, valStr: string) => {
        const val = valStr === '' ? 0 : Number(valStr);
        if (isNaN(val)) return;

        const currentType = localRules[category]?.type || 'fixed';
        const newRule: CategoryBudgetRule = { type: currentType, value: val };

        setLocalRules(prev => ({
            ...prev,
            [category]: newRule
        }));
    };

    const handleRuleValueBlur = (category: string) => {
        const rule = localRules[category];
        syncRuleToCloud(category, rule || null);
    };

    // Calculate Distribution segments
    const isGlobalActive = spendingLimits.global.enabled && spendingLimits.global.amount > 0;
    const globalLimitVal = isGlobalActive ? spendingLimits.global.amount : 0;

    const segments = Object.entries(spendingLimits.categories)
        .map(([cat, amt]) => ({
            category: cat,
            amount: amt,
            percent: globalLimitVal > 0 ? (amt / globalLimitVal) * 100 : 0
        }))
        .filter(s => s.percent > 0);

    const totalAllocatedAmount = segments.reduce((sum, s) => sum + s.amount, 0);
    const allocatedPercent = globalLimitVal > 0 ? (totalAllocatedAmount / globalLimitVal) * 100 : 0;
    const remainderAmount = Math.max(0, globalLimitVal - totalAllocatedAmount);
    const remainderPercent = Math.max(0, 100 - allocatedPercent);
    const isOverAllocated = totalAllocatedAmount > globalLimitVal;

    const segmentColors = [
        'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-sky-500', 
        'bg-amber-500', 'bg-purple-500', 'bg-teal-500', 'bg-pink-500'
    ];

    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-rose-500';
        if (percent >= 80) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Global Spending Limit Card */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Coins size={16} /> Límite de Gasto Global
                </h3>

                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100 text-sm">Habilitar Límite Global</span>
                            <span className="text-xs text-zinc-500">Recibir alertas en pantalla si tu gasto acumulado supera el tope.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={spendingLimits.global.enabled}
                                onChange={(e) => handleGlobalToggle(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {spendingLimits.global.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Monto Máximo ({currency})</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">{currency}</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                                        value={globalAmount}
                                        onChange={(e) => setGlobalAmount(e.target.value)}
                                        onBlur={handleGlobalAmountBlur}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Frecuencia de Evaluación</label>
                                <select
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                                    value={spendingLimits.global.period}
                                    onChange={(e) => handleGlobalPeriodChange(e.target.value as any)}
                                >
                                    <option value="daily">Diario</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensual</option>
                                    <option value="yearly">Anual</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {isGlobalActive && (
                        <div className="pt-2 border-t border-zinc-150 dark:border-zinc-850">
                            <div className="flex justify-between items-center text-xs text-zinc-500 mb-1.5">
                                <span>Gasto total de este mes</span>
                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                    {currency}{totalSpentThisMonth.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {currency}{globalLimitVal.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${getProgressColor((totalSpentThisMonth / globalLimitVal) * 100)}`}
                                    style={{ width: `${Math.min(100, (totalSpentThisMonth / globalLimitVal) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Distribution Visual Chart */}
            {isGlobalActive && (
                <div className="space-y-3 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-in fade-in duration-300">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        Distribución de tu Presupuesto Global
                    </h4>
                    
                    {/* Visual Segment Bar */}
                    <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden flex">
                        {segments.map((s, idx) => (
                            <div
                                key={s.category}
                                className={`h-full ${segmentColors[idx % segmentColors.length]} transition-all duration-300`}
                                style={{ width: `${s.percent}%` }}
                                title={`${s.category}: ${currency}${s.amount} (${s.percent.toFixed(1)}%)`}
                            />
                        ))}
                        {!isOverAllocated && remainderPercent > 0 && (
                            <div
                                className="h-full bg-zinc-200 dark:bg-zinc-750 transition-all duration-300"
                                style={{ width: `${remainderPercent}%` }}
                                title={`Fondo Libre: ${currency}${remainderAmount} (${remainderPercent.toFixed(1)}%)`}
                            />
                        )}
                    </div>

                    {/* Over-allocation warning banner */}
                    {isOverAllocated && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/25">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Presupuesto Asignado Excedido</span>
                                <p className="text-[10px] text-rose-450 mt-0.5">La suma de tus asignaciones ({currency}{totalAllocatedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}) supera tu límite global ({currency}{globalLimitVal.toLocaleString()}) por {currency}{(totalAllocatedAmount - globalLimitVal).toLocaleString(undefined, { maximumFractionDigits: 2 })}.</p>
                            </div>
                        </div>
                    )}

                    {/* Breakdown Legends grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 text-[10px] text-zinc-500">
                        {segments.map((s, idx) => (
                            <div key={s.category} className="flex items-center gap-1.5 truncate">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${segmentColors[idx % segmentColors.length]}`} />
                                <span className="truncate">{s.category}: <strong>{currency}{s.amount.toLocaleString()}</strong> ({s.percent.toFixed(0)}%)</span>
                            </div>
                        ))}
                        {!isOverAllocated && remainderAmount > 0 && (
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-zinc-200 dark:bg-zinc-700" />
                                <span className="truncate text-zinc-400">Fondo Libre: <strong>{currency}{remainderAmount.toLocaleString()}</strong> ({remainderPercent.toFixed(0)}%)</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Category spending limits (Budgets) Card */}
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldAlert size={16} /> Configuración de Presupuestos por Categoría
                </h3>
                <p className="text-xs text-zinc-500">Asigna montos fijos o utiliza un porcentaje del límite global para cada categoría. Las categorías sin límite configurado no tendrán tope de gasto asignado.</p>

                <div className="space-y-3">
                    {expenseCats.map(cat => {
                        const localRule = localRules[cat] || { type: 'fixed', value: 0 };
                        const resolvedLimit = spendingLimits.categories[cat] || 0;
                        const spent = categorySpentMap[cat] || 0;
                        const percentConsumed = resolvedLimit > 0 ? (spent / resolvedLimit) * 100 : 0;

                        return (
                            <div key={cat} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 hover:border-zinc-300 dark:hover:border-zinc-750 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Category Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{cat}</span>
                                            {resolvedLimit > 0 && spent > resolvedLimit && (
                                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-black border border-rose-500/20 flex items-center gap-0.5 animate-pulse">
                                                    <AlertTriangle size={10} /> SUPERADO
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 mt-1 space-y-0.5">
                                            <p>Gastado este mes: <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{currency}{spent.toLocaleString()}</span></p>
                                            {localRule.type !== 'fixed' && !isGlobalActive ? (
                                                <p className="text-amber-650 dark:text-amber-500 font-bold flex items-center gap-0.5">
                                                    ⚠️ Habilita el límite global para activar este %
                                                </p>
                                            ) : resolvedLimit > 0 ? (
                                                <p className="text-zinc-400 font-medium">Equivale a un tope absoluto de: <strong className="text-zinc-650 dark:text-zinc-300">{currency}{resolvedLimit.toLocaleString()}</strong></p>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Config controls */}
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        {/* Rule Selector Button Group */}
                                        <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 gap-0.5">
                                            {([
                                                { id: 'fixed', label: `${currency} Fijo` },
                                                { id: 'percent_global', label: '% Global' }
                                            ] as const).map(mode => (
                                                <button
                                                    key={mode.id}
                                                    type="button"
                                                    onClick={() => handleRuleTypeChange(cat, mode.id)}
                                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                                        localRule.type === mode.id
                                                            ? 'bg-white dark:bg-zinc-700 text-zinc-850 dark:text-zinc-100 shadow-sm'
                                                            : 'text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300'
                                                    }`}
                                                >
                                                    {mode.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Value Input */}
                                        <div className="relative w-28">
                                            {localRule.type === 'fixed' ? (
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">{currency}</span>
                                            ) : (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">%</span>
                                            )}
                                            <input
                                                type="number"
                                                className={`w-full py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold ${
                                                    localRule.type === 'fixed' 
                                                        ? 'pl-5 pr-2' 
                                                        : 'pl-2 pr-5'
                                                }`}
                                                value={localRule.value > 0 ? localRule.value : ''}
                                                onChange={(e) => handleRuleValueChange(cat, e.target.value)}
                                                onBlur={() => handleRuleValueBlur(cat)}
                                                placeholder={localRule.type === 'fixed' ? 'Sin límite' : '0'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Consumption gauge */}
                                {resolvedLimit > 0 && (
                                    <div className="space-y-1">
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${getProgressColor(percentConsumed)}`}
                                                style={{ width: `${Math.min(100, percentConsumed)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] text-zinc-400 font-mono">
                                            <span>Porcentaje consumido</span>
                                            <span>{percentConsumed.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
