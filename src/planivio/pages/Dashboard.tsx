import { usePlanivio } from '../context/PlanivioContext';
import { CheckSquare, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const Dashboard = () => {
    const { tasks, courses } = usePlanivio();

    // Derived State
    const todoTasks = tasks.filter(t => t.status !== 'done');
    const highPriorityTasks = todoTasks.filter(t => t.priority === 'high');
    const today = new Date();

    // Simple logic for classes (just showing count for now as schedule parsing is complex)
    const activeCourses = courses.length;

    return (
        <div className="space-y-8 animate-enter-app text-slate-900 dark:text-slate-200">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Panel Principal</h1>
                <p className="text-slate-500 dark:text-slate-400">Resumen de tu actividad académica.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/5 transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-indigo-500/10">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{todoTasks.length}</div>
                        <div className="text-sm text-slate-500 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">Tareas Pendientes</div>
                    </div>
                </div>

                <div className="group bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/5 transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-emerald-500/10">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeCourses}</div>
                        <div className="text-sm text-slate-500 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">Cursos Activos</div>
                    </div>
                </div>

                <div className="group bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/5 transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-orange-500/10">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{highPriorityTasks.length}</div>
                        <div className="text-sm text-slate-500 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">Prioridad Alta</div>
                    </div>
                </div>

                <div className="group bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/5 transition-colors duration-300 shadow-sm dark:shadow-none">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-blue-500/10">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white capitalize">{format(today, 'EEEE d', { locale: es })}</div>
                        <div className="text-sm text-slate-500 font-medium capitalize group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">Hoy</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tareas Urgentes</h2>
                    </div>

                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm dark:shadow-black/20">
                        {todoTasks.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p>¡Todo al día! No tienes tareas pendientes.</p>
                            </div>
                        ) : (
                            todoTasks.slice(0, 5).map(task => (
                                <div key={task.id} className="group p-4 border-b border-slate-200 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full shadow-lg ${task.priority === 'high' ? 'bg-orange-500 shadow-orange-500/50' : task.priority === 'medium' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-blue-500 shadow-blue-500/50'}`} />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-slate-900 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-white transition-colors">{task.title}</h3>
                                        <p className="text-xs text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex items-center gap-2 mt-1">
                                            <span className="bg-slate-200 dark:bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{task.courseId ? courses.find(c => c.id === task.courseId)?.name : 'General'}</span>
                                            {task.dueDate && `• ${format(new Date(task.dueDate), 'd MMM', { locale: es })}`}
                                        </p>
                                    </div>
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-xs font-medium capitalize border",
                                        task.status === 'in_progress'
                                            ? "bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                                            : "bg-slate-100 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/50"
                                    )}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Schedule / Next Classes */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Próximas Clases</h2>
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-sm dark:shadow-black/20">
                        {courses.slice(0, 3).map(course => (
                            <div key={course.id} className="group flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors">
                                <div className={`w-2 h-12 rounded-full ${course.color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-sm group-hover:text-primary dark:group-hover:text-white">{course.name}</h4>
                                    <p className="text-xs text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400">{course.schedule}</p>
                                    <p className="text-xs text-slate-500/80 mt-1 flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>2h</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
