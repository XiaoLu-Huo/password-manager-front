import React, { useEffect, useState } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { useLoading } from './context/LoadingContext';
import { apiClient } from './api/api-client';
import AppLayout from './components/AppLayout';
import LoadingSpinner from './components/LoadingSpinner';

import SetupPage from './pages/SetupPage';
import UnlockPage from './pages/UnlockPage';
import VaultPage from './pages/VaultPage';
import CredentialDetailPage from './pages/CredentialDetailPage';
import CreateCredentialPage from './pages/CreateCredentialPage';

// ---- Placeholder pages (replaced by real implementations in later tasks) ----

const PasswordGeneratorPage: React.FC = () => <div>PasswordGeneratorPage</div>;
const SecurityReportPage: React.FC = () => <div>SecurityReportPage</div>;
const ImportExportPage: React.FC = () => <div>ImportExportPage</div>;
const SettingsPage: React.FC = () => <div>SettingsPage</div>;

// ---- Route guard: redirects to /unlock (or /setup) when locked ----

/**
 * Wraps protected routes. If the vault is locked the user is sent to
 * /unlock (or /setup when no master password has been configured yet).
 */
const ProtectedRoute: React.FC = () => {
  const { isUnlocked } = useAuth();
  const location = useLocation();

  if (!isUnlocked) {
    // Preserve the intended destination so we can redirect back after unlock
    return <Navigate to="/unlock" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

/**
 * Wraps public auth routes (/setup, /unlock). If the vault is already
 * unlocked, redirect straight to /vault so users don't see the auth
 * screens unnecessarily.
 */
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isUnlocked } = useAuth();

  if (isUnlocked) {
    return <Navigate to="/vault" replace />;
  }

  return children;
};

// ---- Setup check: determines whether master password exists ----

/**
 * On first load we need to know whether the backend already has a master
 * password configured. If not, redirect to /setup instead of /unlock.
 */
const SetupRedirect: React.FC = () => {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    let cancelled = false;
    showLoading();
    apiClient
      .get<boolean>('/auth/status')
      .then((initialized) => {
        if (!cancelled) setNeedsSetup(!initialized);
      })
      .catch(() => {
        if (!cancelled) setNeedsSetup(false);
      })
      .finally(() => {
        // Always hide loading regardless of cancelled — otherwise the
        // spinner stays visible after Navigate unmounts this component.
        hideLoading();
      });
    return () => { cancelled = true; };
  }, [showLoading, hideLoading]);

  if (needsSetup === null) {
    return null;
  }

  return <Navigate to={needsSetup ? '/setup' : '/unlock'} replace />;
};

// ---- App root ----

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root: check backend status and redirect */}
      <Route path="/" element={<SetupRedirect />} />

      {/* Public auth routes */}
      <Route
        path="/setup"
        element={
          <PublicRoute>
            <SetupPage />
          </PublicRoute>
        }
      />
      <Route
        path="/unlock"
        element={
          <PublicRoute>
            <UnlockPage />
          </PublicRoute>
        }
      />

      {/* Protected routes behind AppLayout (sidebar + content) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/vault/new" element={<CreateCredentialPage />} />
          <Route path="/vault/:id" element={<CredentialDetailPage />} />
          <Route path="/generator" element={<PasswordGeneratorPage />} />
          <Route path="/security-report" element={<SecurityReportPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all: redirect unknown paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <LoadingProvider>
          <LoadingSpinner />
          <AppRoutes />
        </LoadingProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
