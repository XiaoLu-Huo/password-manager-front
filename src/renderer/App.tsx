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
import { apiClient } from './api/api-client';
import AppLayout from './components/AppLayout';

// ---- Placeholder pages (replaced by real implementations in later tasks) ----

const SetupPage: React.FC = () => <div>SetupPage</div>;
const UnlockPage: React.FC = () => <div>UnlockPage</div>;
const VaultPage: React.FC = () => <div>VaultPage</div>;
const CredentialDetailPage: React.FC = () => <div>CredentialDetailPage</div>;
const CreateCredentialPage: React.FC = () => <div>CreateCredentialPage</div>;
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

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<boolean>('/auth/status')
      .then((initialized) => {
        if (!cancelled) setNeedsSetup(!initialized);
      })
      .catch(() => {
        // If the status endpoint fails, default to showing unlock page
        if (!cancelled) setNeedsSetup(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (needsSetup === null) {
    // Still loading – show nothing (LoadingSpinner will be added in task 2.5)
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
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
