import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [appName, setAppName] = useState('Invoice Generator');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api('/api/auth/me');
      setUser(data.user);
      if (data.appName) setAppName(data.appName);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    if (data.appName) setAppName(data.appName);
    return data;
  };

  const register = async (payload) => {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    setUser(data.user);
    if (data.appName) setAppName(data.appName);
    return data;
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      appName,
      loading,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
    }),
    [user, appName, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
