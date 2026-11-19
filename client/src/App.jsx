import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TrialsListPage from './pages/TrialsListPage';
import TrialDetailPage from './pages/TrialDetailPage';
import ParticipantsListPage from './pages/ParticipantsListPage';
import ParticipantDetailPage from './pages/ParticipantDetailPage';
import AtRiskWorklistPage from './pages/AtRiskWorklistPage';
import SafetyReportsPage from './pages/SafetyReportsPage';
import AlertsCenterPage from './pages/AlertsCenterPage';
import ExportsPage from './pages/ExportsPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gov-blue/20 border-t-gov-blue rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-text-muted">Loading NexTrial CTMS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page p-6">
        <div className="bg-white border border-border-default rounded p-8 max-w-md text-center shadow-subtle">
          <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-text-main mb-2">Access Restricted (403)</h2>
          <p className="text-xs text-text-muted mb-6">
            Your role (<span className="font-semibold">{user?.role}</span>) does not have sufficient permissions to access this clinical module.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-gov-blue text-white text-xs font-semibold rounded hover:bg-gov-blueDark"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Protected Core Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trials"
              element={
                <ProtectedRoute>
                  <TrialsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trials/:id"
              element={
                <ProtectedRoute>
                  <TrialDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/participants"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator', 'investigator']}>
                  <ParticipantsListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/participants/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator', 'investigator']}>
                  <ParticipantDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/at-risk"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator', 'investigator']}>
                  <AtRiskWorklistPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/safety"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator', 'investigator', 'pv_officer', 'dsmb']}>
                  <SafetyReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertsCenterPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/exports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'coordinator', 'investigator', 'dsmb']}>
                  <ExportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Default & Catch-all */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
