import { CalendarClock, History, Trash2, PlayCircle, PauseCircle } from 'lucide-react';
import { useScheduledTransactions } from '../../../hooks/useScheduledTransactions';
import { useSettings } from '../../../context/SettingsContext'; // For currency

export const SettingsScheduled = () => {
    const { scheduled, toggleActive, deleteScheduled } = useScheduledTransactions();
    const { currency } = useSettings();

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-6">
                <p className="text-sm text-zinc-500">
                    Las transacciones programadas se generan automáticamente el día seleccionado de cada mes.
                </p>
            </div>

            {scheduled.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-full mb-3">
                        <CalendarClock className="text-zinc-300 dark:text-zinc-600" size={32} />
                    </div>
                    <p className="text-zinc-500 font-medium">No hay reglas programadas</p>
                    <p className="text-zinc-400 text-sm mt-1">Crea una al añadir una nueva transacción.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {scheduled.map(item => (
                        <div key={item.id} className={`p-4 rounded-xl border transition-all hover:shadow-md ${!item.active ? 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800 opacity-60 grayscale'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                            } `}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            } `}>
                                            {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <History size={10} /> Día {item.dayOfMonth}
                                        </span>
                                    </div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.description || 'Sin descripción'}</p>
                                    <p className="text-sm text-zinc-500">{item.category} • {currency}{item.amount.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => deleteScheduled(item.id)}
                                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <span className="text-xs text-zinc-400">
                                    Última: {item.lastProcessedDate || 'Nunca'}
                                </span>
                                <button
                                    onClick={() => toggleActive(item.id, item.active)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.active
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                                        } `}
                                >
                                    {item.active ? (
                                        <> <PauseCircle size={14} /> Pausar </>
                                    ) : (
                                        <> <PlayCircle size={14} /> Activar </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
