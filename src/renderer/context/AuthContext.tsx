import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { apiClient } from '../api/api-client';

// ---- State ----

export interface AuthState {
  isUnlocked: boolean;
  sessionToken: string | null;
  mfaRequired: boolean;
}

const initialState: AuthState = {
  isUnlocked: false,
  sessionToken: null,
  mfaRequired: false,
};

// ---- Actions ----

export type AuthAction =
  | { type: 'UNLOCK'; sessionToken: string }
  | { type: 'MFA_REQUIRED' }
  | { type: 'LOCK' };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'UNLOCK':
      return { isUnlocked: true, sessionToken: action.sessionToken, mfaRequired: false };
    case 'MFA_REQUIRED':
      return { ...state, mfaRequired: true };
    case 'LOCK':
      return { ...initialState };
    default:
      return state;
  }
}

// ---- Context ----

export interface AuthContextValue extends AuthState {
  unlock: (sessionToken: string) => void;
  requireMfa: () => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- Provider ----

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const unlock = useCallback((sessionToken: string) => {
    apiClient.setSessionToken(sessionToken);
    dispatch({ type: 'UNLOCK', sessionToken });
  }, []);

  const requireMfa = useCallback(() => {
    dispatch({ type: 'MFA_REQUIRED' });
  }, []);

  const lock = useCallback(() => {
    apiClient.setSessionToken(null);
    dispatch({ type: 'LOCK' });
    // Force navigation to unlock page — works with HashRouter
    window.location.hash = '#/unlock';
  }, []);

  // Register the lock handler so 401 responses auto-lock the app
  useEffect(() => {
    apiClient.setOnLock(lock);
    return () => apiClient.setOnLock(null);
  }, [lock]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, unlock, requireMfa, lock }),
    [state, unlock, requireMfa, lock],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---- Hook ----

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
