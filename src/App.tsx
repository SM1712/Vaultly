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

// Eager loaded pages for instant navigation
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Goals from './pages/Goals';
import Projects from './pages/Projects';
import Funds from './pages/Funds';
import Credits from './pages/Credits';
import Projections from './pages/Projections';
import OnboardingPage from './pages/OnboardingPage';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import GamificationPage from './pages/GamificationPage';
import { Toaster } from 'sonner';
import LoadingScreen from './components/ui/LoadingScreen';
import RouteLoader from './components/ui/RouteLoader';
import { ViewTransitionHandler } from './components/ui/ViewTransitionHandler';

// Lazy loaded mobile parallel views
const MobileLayout = lazy(() => import('./layouts/MobileLayout'));
const MobileDashboard = lazy(() => import('./pages/mobile/MobileDashboard'));
const MobileTransactions = lazy(() => import('./pages/mobile/MobileTransactions'));
const MobileSavings = lazy(() => import('./pages/mobile/MobileSavings'));
const MobileCredits = lazy(() => import('./pages/mobile/MobileCredits'));
const MobileStats = lazy(() => import('./pages/mobile/MobileStats'));
const MobileSettings = lazy(() => import('./pages/mobile/MobileSettings'));
const MobileGamification = lazy(() => import('./pages/mobile/MobileGamification'));
const MobileProjects = lazy(() => import('./pages/mobile/MobileProjects'));

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
    // Extended splash screen time to allow premium boot animations to finish gracefully
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1600);
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
                          {/* Desktop Layout & Pages */}
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
                            <Route path="gamification" element={<GamificationPage />} />
                            {/* Redirección por defecto para escritorio */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Route>

                          {/* Mobile Layout & Pages (Parallel App) */}
                          <Route path="/m" element={<MobileLayout />}>
                            <Route index element={<MobileDashboard />} />
                            <Route path="transactions" element={<MobileTransactions />} />
                            <Route path="savings" element={<MobileSavings />} />
                            <Route path="credits" element={<MobileCredits />} />
                            <Route path="stats" element={<MobileStats />} />
                            <Route path="settings" element={<MobileSettings />} />
                            <Route path="gamification" element={<MobileGamification />} />
                            <Route path="projects" element={<MobileProjects />} />
                            {/* Redirección por defecto para móvil */}
                            <Route path="*" element={<Navigate to="/m" replace />} />
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
                    <Toaster 
                        richColors 
                        position="bottom-right" 
                        visibleToasts={3}
                        expand={false}
                        duration={3000}
                        closeButton
                        toastOptions={{
                            className: 'glass-toast glass-toast-animated',
                        }}
                    />
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
