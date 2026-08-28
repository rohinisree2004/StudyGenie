import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('studygenie_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on initial load if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('studygenie_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.user);
        } catch (err) {
          console.error('Failed to load user profile on boot:', err.message);
          localStorage.removeItem('studygenie_token');
          localStorage.removeItem('studygenie_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Helper to determine dashboard path based on role
  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
      default:
        return '/student/dashboard';
    }
  };

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email, password });
      localStorage.setItem('studygenie_token', res.token);
      localStorage.setItem('studygenie_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setLoading(false);
      return { success: true, user: res.user, dashboardPath: getDashboardPath(res.user.role) };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  // Register handler
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.register(userData);
      localStorage.setItem('studygenie_token', res.token);
      localStorage.setItem('studygenie_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setLoading(false);
      return { success: true, user: res.user, dashboardPath: getDashboardPath(res.user.role) };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  // Forgot password handler
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.forgotPassword(email);
      setLoading(false);
      return { success: true, message: res.message, devResetToken: res.devResetToken, resetUrl: res.resetUrl };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  // Reset password handler
  const resetPassword = async (resetToken, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.resetPassword(resetToken, password);
      localStorage.setItem('studygenie_token', res.token);
      localStorage.setItem('studygenie_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      setLoading(false);
      return { success: true, user: res.user, dashboardPath: getDashboardPath(res.user.role) };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('studygenie_token');
    localStorage.removeItem('studygenie_user');
    setToken(null);
    setUser(null);
  };

  // Update local user state (e.g. avatar, name, profile fields)
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('studygenie_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
        getDashboardPath,
        isAuthenticated: !!token && !!user,
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
