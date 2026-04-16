import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface LoadingContextValue {
  /** Whether the global spinner is visible */
  isLoading: boolean;
  /** Show the global spinner */
  showLoading: () => void;
  /** Hide the global spinner */
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);

  const showLoading = useCallback(() => setCount((c) => c + 1), []);
  const hideLoading = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const value = useMemo<LoadingContextValue>(
    () => ({ isLoading: count > 0, showLoading, hideLoading }),
    [count, showLoading, hideLoading],
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return ctx;
}
