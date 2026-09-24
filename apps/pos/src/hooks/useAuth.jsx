// File: apps/pos/src/hooks/useAuth.js
/**
 * useAuth — manages authentication state for the POS app.
 * Persists token in localStorage and provides login/logout helpers.
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import api from '../lib/api.js';

const AUTH_KEY = 'pos_auth';

// ── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const { token: t, user: u } = JSON.parse(stored);
        if (t && u) {
          setToken(t);
          setUser(u);
          // Inject into Axios default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data: res } = await api.post('/auth/login', { email, password });
    if (!res.success) throw new Error(res.message);

    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: t, user: u }));
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore network errors on logout */ }
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
