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
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import LoadingScreen from './components/ui/LoadingScreen';

const ProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: dataLoading } = useData();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Ensure splash screen is visible for at least 2.5s to show full animation
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || dataLoading || !minTimeElapsed) {
    return <LoadingScreen message={authLoading ? 'AUTENTICANDO...' : 'CARGANDO DATOS...'} />;
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
