import { Routes, Route, Navigate } from 'react-router-dom';
import PlanivioLayout from './layouts/PlanivioLayout';
import { PlanivioProvider } from './context/PlanivioContext';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Courses from './pages/Courses';

// Placeholders for unimplemented modules
const Calendar = () => <div className="p-8"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendar (Coming Soon)</h1></div>;
const Projects = () => <div className="p-8"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects (Coming Soon)</h1></div>;
const Notes = () => <div className="p-8"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notes (Coming Soon)</h1></div>;

const PlanivioApp = () => {
    return (
        <PlanivioProvider>
            <Routes>
                <Route element={<PlanivioLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="calendar" element={<Calendar />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="notes" element={<Notes />} />
                    <Route path="*" element={<Navigate to="" replace />} />
                </Route>
            </Routes>
        </PlanivioProvider>
    );
};

export default PlanivioApp;
