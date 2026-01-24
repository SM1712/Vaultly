import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { GamificationProvider } from './context/GamificationContext';
import { CollaborationProvider, useCollaboration } from './context/CollaborationContext';
import NicknameSetupModal from './components/onboarding/NicknameSetupModal';
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
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import DownloadPage from './pages/Download';
import { Component, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import LoadingScreen from './components/ui/LoadingScreen';
import { ViewTransitionHandler } from './components/ui/ViewTransitionHandler';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-rose-500 bg-rose-50 h-screen overflow-auto">
          <h1 className="text-2xl font-bold mb-4">¡Algo salió mal!</h1>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-rose-200">
            <p className="font-bold mb-2">{this.state.error?.message}</p>
            <pre className="text-xs overflow-auto font-mono text-zinc-600">
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: dataLoading } = useData();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const { profile, loadingProfile, profileSkipped } = useCollaboration();

  useEffect(() => {
    // Ensure splash screen is visible for at least 2.5s to show full animation
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading || dataLoading || !minTimeElapsed || loadingProfile) {
    return <LoadingScreen message={authLoading ? 'AUTENTICANDO...' : loadingProfile ? 'VERIFICANDO IDENTIDAD...' : 'CARGANDO DATOS...'} />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!profile && !profileSkipped) return <NicknameSetupModal />;

  return <Outlet />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <GamificationProvider>
              <CollaborationProvider>
                <ThemeProvider>
                  <HashRouter>
                    <ViewTransitionHandler>
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
                            <Route path="calendar" element={<Calendar />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="download" element={<DownloadPage />} />
                            {/* Redirección por defecto */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Route>
                        </Route>
                      </Routes>
                      <Toaster richColors position="top-center" />
                      {/* <DebugFooter /> Removed per user request */}
                    </ViewTransitionHandler>
                  </HashRouter>
                </ThemeProvider>
              </CollaborationProvider>
            </GamificationProvider>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
