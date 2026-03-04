'use client';

import type { ApiError } from '@/lib/api';
import React, { createContext, useCallback, useContext, useState } from 'react';

type ApiErrorContextValue = {
  error: ApiError | null;
  retry: (() => void) | null;
  setError: (error: ApiError | null, retry?: () => void) => void;
  clearError: () => void;
};

const ApiErrorContext = createContext<ApiErrorContextValue | null>(null);

export function ApiErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setErrorState] = useState<ApiError | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);

  const setError = useCallback((err: ApiError | null, retryFn?: () => void) => {
    setErrorState(err);
    setRetry(err && retryFn ? retryFn : null);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setRetry(null);
  }, []);

  const value: ApiErrorContextValue = {
    error,
    retry,
    setError,
    clearError,
  };

  return (
    <ApiErrorContext.Provider value={value}>
      {children}
    </ApiErrorContext.Provider>
  );
}

export function useApiError() {
  const ctx = useContext(ApiErrorContext);
  if (!ctx) throw new Error('useApiError must be used within ApiErrorProvider');
  return ctx;
}
