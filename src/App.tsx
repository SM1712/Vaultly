import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
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
// import DebugFooter from './components/DebugFooter';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: dataLoading } = useData();

  if (authLoading || dataLoading) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-emerald-500">
        <Loader2 className="animate-spin w-10 h-10" />
        <span className="font-mono text-sm tracking-wider animate-pulse">
          {authLoading ? 'AUTENTICANDO...' : 'CARGANDO DATOS...'}
        </span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
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
            {/* <DebugFooter /> Removed per user request */}
          </HashRouter>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
