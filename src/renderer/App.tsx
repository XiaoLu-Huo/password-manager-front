import React from 'react';
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
import AppLayout from './components/AppLayout';
import LoadingSpinner from './components/LoadingSpinner';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import VaultPage from './pages/VaultPage';
import CredentialDetailPage from './pages/CredentialDetailPage';
import CreateCredentialPage from './pages/CreateCredentialPage';
import PasswordGeneratorPage from './pages/PasswordGeneratorPage';
import SecurityReportPage from './pages/SecurityReportPage';
import ImportExportPage from './pages/ImportExportPage';
import SettingsPage from './pages/SettingsPage';

// ---- Route guard: redirects to /unlock (or /setup) when locked ----

/**
 * Wraps protected routes. If the vault is locked the user is sent to
 * /login when not authenticated.
 */
const ProtectedRoute: React.FC = () => {
  const { isUnlocked } = useAuth();
  const location = useLocation();

  if (!isUnlocked) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

/**
 * Wraps public auth routes (/register, /login). If the vault is already
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
 * On first load, always redirect to /login (multi-user: no setup flow).
 */
const SetupRedirect: React.FC = () => {
  return <Navigate to="/login" replace />;
};

// ---- App root ----

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root: check backend status and redirect */}
      <Route path="/" element={<SetupRedirect />} />

      {/* Public auth routes */}
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
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
