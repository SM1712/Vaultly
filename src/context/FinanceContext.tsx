import { createContext, useContext, useState, type ReactNode } from 'react';

interface FinanceContextType {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    prevMonth: () => void;
    nextMonth: () => void;
    goToCurrentMonth: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const prevMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    };

    const goToCurrentMonth = () => {
        setSelectedDate(new Date());
    };

    return (
        <FinanceContext.Provider value={{ selectedDate, setSelectedDate, prevMonth, nextMonth, goToCurrentMonth }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};
