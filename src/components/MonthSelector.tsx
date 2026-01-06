import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const MonthSelector = () => {
    const { selectedDate, prevMonth, nextMonth, goToCurrentMonth } = useFinance();

    const formattedDate = new Intl.DateTimeFormat('es-ES', {
        month: 'long',
        year: 'numeric'
    }).format(selectedDate);

    // Capitalize first letter
    const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    const isCurrentMonth =
        selectedDate.getMonth() === new Date().getMonth() &&
        selectedDate.getFullYear() === new Date().getFullYear();

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button
                onClick={prevMonth}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                title="Mes Anterior"
            >
                <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
                <Calendar size={16} className="text-zinc-400" />
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm select-none">
                    {displayDate}
                </span>
            </div>

            <button
                onClick={nextMonth}
                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                title="Mes Siguiente"
            >
                <ChevronRight size={16} />
            </button>

            {!isCurrentMonth && (
                <button
                    onClick={goToCurrentMonth}
                    className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline px-2"
                >
                    Hoy
                </button>
            )}
        </div>
    );
};

export default MonthSelector;
