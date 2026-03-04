import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kinevie_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true); setError(null);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('kinevie_token', data.token);
      localStorage.setItem('kinevie_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const register = useCallback(async (fields) => {
    setLoading(true); setError(null);
    try {
      const data = await api.register(fields);
      if (data.pending) return { pending: true, message: data.message };
      localStorage.setItem('kinevie_token', data.token);
      localStorage.setItem('kinevie_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('kinevie_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kinevie_token');
    localStorage.removeItem('kinevie_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
