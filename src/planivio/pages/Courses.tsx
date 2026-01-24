import { usePlanivio } from '../context/PlanivioContext';
import { BookOpen, User, Clock, MapPin } from 'lucide-react';

const Courses = () => {
    const { courses } = usePlanivio();

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Mis Cursos</h1>
                <p className="text-slate-500 dark:text-slate-400">Listado de materias inscritas.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 shadow-sm">
                        {/* Top Color Banner */}
                        <div className={`h-2 w-full ${course.color}`} />

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-lg ${course.color} bg-opacity-20 flex items-center justify-center text-white`}>
                                    <BookOpen size={20} />
                                </div>
                                {course.code && (
                                    <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                        {course.code}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                                {course.name}
                            </h3>

                            <div className="space-y-3 mt-6">
                                {course.professor && (
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                        <User size={16} />
                                        <span>{course.professor}</span>
                                    </div>
                                )}
                                {course.schedule && (
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                        <Clock size={16} />
                                        <span>{course.schedule}</span>
                                    </div>
                                )}
                                {course.location && (
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                        <MapPin size={16} />
                                        <span>{course.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Courses;
