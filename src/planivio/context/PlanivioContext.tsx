import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Task, Course } from '../types';

interface PlanivioContextType {
    tasks: Task[];
    courses: Course[];
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    addCourse: (course: Omit<Course, 'id'>) => void;
    updateCourse: (id: string, updates: Partial<Course>) => void;
    deleteCourse: (id: string) => void;
}

const PlanivioContext = createContext<PlanivioContextType | undefined>(undefined);

// Dummy Data for Protoyping
const INITIAL_COURSES: Course[] = [
    { id: 'c1', name: 'Matemáticas Avanzadas', code: 'MAT-201', color: 'bg-blue-500', professor: 'Dr. Smith', schedule: 'Lun/Mie 10:00' },
    { id: 'c2', name: 'Historia del Arte', code: 'ART-101', color: 'bg-purple-500', professor: 'Prof. Garcia', schedule: 'Mar/Jue 14:00' },
    { id: 'c3', name: 'Programación Web', code: 'CS-305', color: 'bg-emerald-500', professor: 'Ing. Turing', schedule: 'Vie 09:00' },
];

const INITIAL_TASKS: Task[] = [
    { id: 't1', title: 'Resolver ejercicios de cálculo', dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), status: 'todo', priority: 'high', courseId: 'c1' },
    { id: 't2', title: 'Ensayo sobre el Renacimiento', dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), status: 'in_progress', priority: 'medium', courseId: 'c2' },
    { id: 't3', title: 'Proyecto Final: Web App', dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), status: 'todo', priority: 'high', courseId: 'c3' },
    { id: 't4', title: 'Comprar libros', status: 'done', priority: 'low' },
];

export const PlanivioProvider = ({ children }: { children: ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);

    const addTask = (task: Omit<Task, 'id'>) => {
        const newTask = { ...task, id: crypto.randomUUID() };
        setTasks(prev => [...prev, newTask]);
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const addCourse = (course: Omit<Course, 'id'>) => {
        const newCourse = { ...course, id: crypto.randomUUID() };
        setCourses(prev => [...prev, newCourse]);
    };

    const updateCourse = (id: string, updates: Partial<Course>) => {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCourse = (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
    };

    return (
        <PlanivioContext.Provider value={{
            tasks,
            courses,
            addTask,
            updateTask,
            deleteTask,
            addCourse,
            updateCourse,
            deleteCourse
        }}>
            {children}
        </PlanivioContext.Provider>
    );
};

export const usePlanivio = () => {
    const context = useContext(PlanivioContext);
    if (!context) {
        throw new Error('usePlanivio must be used within a PlanivioProvider');
    }
    return context;
};
