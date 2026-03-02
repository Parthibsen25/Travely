import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';

export const AuthContext = createContext();

function normalizeSessionUser(payload) {
  if (!payload) return null;
  return {
    id: payload.id,
    name: payload.name || payload.businessName || '',
    email: payload.email,
    role: payload.role,
    businessName: payload.businessName || null,
    createdAt: payload.createdAt || null,
    referralCode: payload.referralCode || null
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      setUser(normalizeSessionUser(data.user));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback((userData) => {
    setUser(normalizeSessionUser(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout API errors and clear local state anyway
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshSession
    }),
    [user, loading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
