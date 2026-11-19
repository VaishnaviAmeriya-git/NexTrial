import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nextrial_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nextrial_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('nextrial_token');
      if (!storedToken) {
        // No token at all — go straight to login, don't hang
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('nextrial_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        // Token invalid/expired — clear everything cleanly
        console.warn('Session verification failed, clearing credentials:', err.message);
        setUser(null);
        setToken(null);
        localStorage.removeItem('nextrial_token');
        localStorage.removeItem('nextrial_user');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.data) {
      const { token: newToken, user: newUser } = res.data.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('nextrial_token', newToken);
      localStorage.setItem('nextrial_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error('Invalid login response');
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('nextrial_token');
    localStorage.removeItem('nextrial_user');
  };

  const hasRole = (roles = []) => {
    if (!user) return false;
    if (roles.length === 0) return true;
    return roles.includes(user.role);
  };

  const canAccessTrial = (trialId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const assigned = (user.assignedTrials || []).map(t => (typeof t === 'string' ? t : t._id));
    return assigned.includes(trialId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
        canAccessTrial,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
