import { Component, useState, useEffect, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { GamificationProvider } from './context/GamificationContext';
import { CollaborationProvider, useCollaboration } from './context/CollaborationContext';
import NicknameSetupModal from './components/onboarding/NicknameSetupModal';
import Layout from './layouts/Layout';
import Login from './pages/Login'; // Keep Login synchronous for fast initial paint

// Lazy loaded pages to reduce initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Income = lazy(() => import('./pages/Income'));
const Goals = lazy(() => import('./pages/Goals'));
const Projects = lazy(() => import('./pages/Projects'));
const Funds = lazy(() => import('./pages/Funds'));
const Credits = lazy(() => import('./pages/Credits'));
const Projections = lazy(() => import('./pages/Projections'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Reports = lazy(() => import('./pages/Reports'));
import { Toaster } from 'sonner';
import LoadingScreen from './components/ui/LoadingScreen';
import RouteLoader from './components/ui/RouteLoader';
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
  const { profile, loadingProfile, profileSkipped } = useCollaboration();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Reduced splash screen time for better optimization
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const isAppLoading = authLoading || dataLoading || loadingProfile || !minTimeElapsed;

  return (
    <AnimatePresence mode="wait">
      {isAppLoading ? (
        <LoadingScreen
          key="loading"
          message={authLoading ? 'AUTENTICANDO...' : loadingProfile ? 'VERIFICANDO IDENTIDAD...' : 'CARGANDO DATOS...'}
        />
      ) : !user ? (
        <Navigate key="login" to="/login" replace />
      ) : (!profile && !profileSkipped) ? (
        <NicknameSetupModal key="setup" />
      ) : (
        <motion.div
          key="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full"
        >
          <Outlet />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <GamificationProvider>
              <CollaborationProvider>
                <HashRouter>
                  <ViewTransitionHandler>
                    <Suspense fallback={<RouteLoader />}>
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
                            {/* Redirección por defecto */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Route>
                        </Route>

                        {/* Onboarding / Simulation Routes - Isolated Environment */}
                        <Route path="/onboarding" element={<OnboardingPage />}>
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
                          <Route path="*" element={<Navigate to="/onboarding" replace />} />
                        </Route>
                      </Routes>
                    </Suspense>
                    <Toaster richColors position="top-center" />
                    {/* <DebugFooter /> Removed per user request */}
                  </ViewTransitionHandler>
                </HashRouter>
              </CollaborationProvider>
            </GamificationProvider>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
