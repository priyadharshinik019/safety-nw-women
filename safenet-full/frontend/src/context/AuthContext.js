import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem('safenet_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const saved = localStorage.getItem('safenet_token');
      if (!saved) { setLoading(false); return; }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.user);
        setToken(saved);
        connectSocket(saved);
      } catch {
        localStorage.removeItem('safenet_token');
        localStorage.removeItem('safenet_user');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('safenet_token', data.token);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('safenet_token', data.token);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('safenet_token');
    localStorage.removeItem('safenet_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
