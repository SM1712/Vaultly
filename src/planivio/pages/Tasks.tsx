import { usePlanivio } from '../context/PlanivioContext';
import { Circle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Tasks = () => {
    const { tasks, courses, updateTask } = usePlanivio();

    const toggleTask = (id: string, currentStatus: string) => {
        updateTask(id, { status: currentStatus === 'done' ? 'todo' : 'done' });
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Tareas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona tus entregas y pendientes.</p>
                </div>
            </header>

            <div className="grid gap-4">
                {tasks.map(task => {
                    const course = courses.find(c => c.id === task.courseId);

                    return (
                        <div key={task.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 group hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none">
                            <button
                                onClick={() => toggleTask(task.id, task.status)}
                                className={clsx(
                                    "text-slate-500 transition-colors",
                                    task.status === 'done' ? "text-emerald-500" : "hover:text-indigo-400"
                                )}
                            >
                                {task.status === 'done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                            </button>

                            <div className="flex-1">
                                <h3 className={clsx(
                                    "font-medium transition-all text-lg",
                                    task.status === 'done' ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"
                                )}>
                                    {task.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                    {course && (
                                        <span className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-xs font-medium")}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${course.color}`} />
                                            {course.name}
                                        </span>
                                    )}
                                    {task.dueDate && (
                                        <span>{format(new Date(task.dueDate), 'd MMMM', { locale: es })}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "text-xs px-2 py-1 rounded font-medium",
                                    task.priority === 'high' ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                                        task.priority === 'medium' ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                                            "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                )}>
                                    {task.priority.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Tasks;
