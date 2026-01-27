import { useSettings } from '../../../context/SettingsContext';

export const SettingsPreferences = () => {
    const { currency, setCurrency, goalPreferences, setGoalPreferences } = useSettings();
    const currencies = ['$', '€', '£', '¥', 'COP', 'MXN', 'ARS', 'S/'];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Currency Section */}
            <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Configuración Regional</h3>
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Moneda Principal</label>
                    <div className="flex gap-2 flex-wrap">
                        {currencies.map(c => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold transition-all ${currency === c
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    } `}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Goal Calculation Method */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Cálculo de Cuota Mensual</h3>
                <div className="space-y-4">
                    <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultCalculationMethod === 'dynamic' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'} `}>
                        <input
                            type="radio"
                            name="calculationMethod"
                            checked={goalPreferences.defaultCalculationMethod === 'dynamic'}
                            onChange={() => setGoalPreferences({ ...goalPreferences, defaultCalculationMethod: 'dynamic' })}
                            className="mt-1"
                        />
                        <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100">Dinámico (Recomendado)</span>
                            <p className="text-sm text-zinc-500 mt-1">La cuota se ajusta automáticamente cada mes. Si ahorras de más, la cuota baja. Si te atrasas, sube. Ideal para mantener el objetivo final fijo.</p>
                        </div>
                    </label>
                    <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultCalculationMethod === 'static' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'} `}>
                        <input
                            type="radio"
                            name="calculationMethod"
                            checked={goalPreferences.defaultCalculationMethod === 'static'}
                            onChange={() => setGoalPreferences({ ...goalPreferences, defaultCalculationMethod: 'static' })}
                            className="mt-1"
                        />
                        <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100">Estático</span>
                            <p className="text-sm text-zinc-500 mt-1">La cuota es fija (Monto / Total Meses). No cambia aunque adelantes pagos. Ideal si prefieres previsibilidad total y terminar antes si pagas extra.</p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Recovery Strategy */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Estrategia de Recuperación (Default)</h3>
                <div className="space-y-4">
                    <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultRecoveryStrategy === 'spread' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'} `}>
                        <input
                            type="radio"
                            name="recoveryStrategy"
                            checked={goalPreferences.defaultRecoveryStrategy === 'spread'}
                            onChange={() => setGoalPreferences({ ...goalPreferences, defaultRecoveryStrategy: 'spread' })}
                            className="mt-1"
                        />
                        <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100">Redistribuir (Spread)</span>
                            <p className="text-sm text-zinc-500 mt-1">Si retiras dinero, el faltante se divide entre todos los meses restantes.</p>
                        </div>
                    </label>
                    <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${goalPreferences.defaultRecoveryStrategy === 'catch_up' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'} `}>
                        <input
                            type="radio"
                            name="recoveryStrategy"
                            checked={goalPreferences.defaultRecoveryStrategy === 'catch_up'}
                            onChange={() => setGoalPreferences({ ...goalPreferences, defaultRecoveryStrategy: 'catch_up' })}
                            className="mt-1"
                        />
                        <div>
                            <span className="block font-bold text-zinc-900 dark:text-zinc-100">Pagar Próximo Mes (Catch Up)</span>
                            <p className="text-sm text-zinc-500 mt-1">Si retiras dinero, se suma todo a la cuota del mes siguiente para recuperar el ritmo inmediatamente.</p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
};
