import axios from 'axios';

// Get base URL from environment or default to localhost:5000/api
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Bearer JWT Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studygenie_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch global 401 unauthenticated errors and format clean error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      status: error.response?.status,
      message:
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please check your network connection.',
    };

    // If unauthorized or token expired on private routes, clear storage
    if (error.response?.status === 401 && localStorage.getItem('studygenie_token')) {
      // Don't auto-redirect if it's already on login/register endpoints
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('studygenie_token');
        localStorage.removeItem('studygenie_user');
        window.location.href = '/login?session=expired';
      }
    }

    return Promise.reject(customError);
  }
);

export default api;
