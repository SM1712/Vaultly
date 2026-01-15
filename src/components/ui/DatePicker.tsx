import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface DatePickerProps {
    value: string | Date;
    onChange: (date: string) => void;
    label?: string;
    className?: string;
    required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, className }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse value to Date object safely using date-fns parse to ensure local time
    const selectedDate = value ? (typeof value === 'string' ? parse(value, 'yyyy-MM-dd', new Date()) : new Date(value)) : undefined;

    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calendar Data
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleDayClick = (day: Date) => {
        // Return YYYY-MM-DD format
        const formatted = format(day, 'yyyy-MM-dd');
        onChange(formatted);
        setIsOpen(false);
    };

    return (
        <div className={twMerge("relative", className)} ref={containerRef}>
            {label && <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>}

            {/* Input Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left",
                    isOpen
                        ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                    !selectedDate && "text-zinc-400"
                )}
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon size={18} className={clsx("transition-colors", isOpen ? "text-indigo-500" : "text-zinc-400")} />
                    <span className={clsx("font-medium", selectedDate ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400")}>
                        {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
                    </span>
                </div>
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-900/10 border border-zinc-100 dark:border-zinc-800 p-4 animate-in fade-in zoom-in-95 duration-200">

                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                            <span key={d} className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{d}</span>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day) => {
                            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDate = isToday(day);

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => handleDayClick(day)}
                                    type="button"
                                    className={clsx(
                                        "h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all relative",
                                        !isCurrentMonth && "text-zinc-300 dark:text-zinc-700",
                                        isCurrentMonth && !isSelected && "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                                        isSelected && "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105 z-10",
                                        isTodayDate && !isSelected && "ring-1 ring-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10"
                                    )}
                                >
                                    {format(day, 'd')}
                                    {isTodayDate && !isSelected && (
                                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
