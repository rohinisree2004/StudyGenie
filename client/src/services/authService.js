import api from './api';

export const authService = {
  // Register (Student or Teacher)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current authenticated user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Forgot password request
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgotpassword', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetToken, password) => {
    const response = await api.put(`/auth/resetpassword/${resetToken}`, { password });
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Suppress server logout error if token was already cleared
    }
  },
};
