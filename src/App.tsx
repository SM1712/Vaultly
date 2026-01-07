import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Goals from './pages/Goals';
import Projects from './pages/Projects';
import Funds from './pages/Funds';
import Credits from './pages/Credits';
import Projections from './pages/Projections';
import Login from './pages/Login';
import { Toaster } from 'sonner';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-emerald-500">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="income" element={<Income />} />
                <Route path="goals" element={<Goals />} />
                <Route path="funds" element={<Funds />} />
                <Route path="credits" element={<Credits />} />
                <Route path="projections" element={<Projections />} />
                <Route path="projects" element={<Projects />} />
                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
          <Toaster richColors position="top-center" />
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
