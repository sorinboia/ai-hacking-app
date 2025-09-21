import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setFlags(data.flags || []);
      setError(null);
    } catch (err) {
      setUser(null);
      setFlags([]);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.user);
    setFlags(data.flags || []);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    setFlags([]);
  }, []);

  const appendFlags = useCallback((awarded = []) => {
    setFlags((prev) => {
      if (!awarded.length) return prev;
      const map = new Map(prev.map((flag) => [flag.vuln_code, flag]));
      awarded.forEach((flag) => {
        if (!flag?.vuln_code || map.has(flag.vuln_code)) return;
        map.set(flag.vuln_code, flag);
      });
      return Array.from(map.values()).sort((a, b) => a.vuln_code.localeCompare(b.vuln_code));
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      flags,
      loading,
      error,
      login,
      logout,
      refresh,
      appendFlags,
    }),
    [user, flags, loading, error, login, logout, refresh, appendFlags]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

