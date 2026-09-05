import api from './api';

export const dashboardService = {
  // Get consolidated Student dashboard data
  getStudentDashboard: async () => {
    const response = await api.get('/dashboard/student');
    return response.data;
  },

  // Get consolidated Teacher dashboard data
  getTeacherDashboard: async (params = {}) => {
    const response = await api.get('/dashboard/teacher', { params });
    return response.data;
  },

  // Get consolidated Admin dashboard data with date-range filter
  getAdminDashboard: async (params = {}) => {
    const response = await api.get('/dashboard/admin', { params });
    return response.data;
  },
};

export default dashboardService;
