import api from './api';

export const adminService = {
  // Get aggregated dashboard metrics & system health
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  // Get paginated and filtered users list
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get user details with academic context
  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Admin create user
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  // Admin update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Admin toggle user account status (active / suspended)
  updateUserStatus: async (id, accountStatus) => {
    const response = await api.patch(`/admin/users/${id}/status`, { accountStatus });
    return response.data;
  },

  // Admin delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Get student directory with study stats
  getStudents: async (params = {}) => {
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  // Get faculty educator directory
  getTeachers: async (params = {}) => {
    const response = await api.get('/admin/teachers', { params });
    return response.data;
  },

  // Assign or reassign educator to course
  assignTeacher: async (subjectId, teacherId) => {
    const response = await api.patch(`/admin/subjects/${subjectId}/assign-teacher`, { teacherId });
    return response.data;
  },

  // Courseware material moderation
  getMaterials: async (params = {}) => {
    const response = await api.get('/admin/materials', { params });
    return response.data;
  },

  updateMaterialVisibility: async (id, isPublic) => {
    const response = await api.patch(`/admin/materials/${id}/visibility`, { isPublic });
    return response.data;
  },

  deleteMaterial: async (id) => {
    const response = await api.delete(`/admin/materials/${id}`);
    return response.data;
  },

  // Assessment & Quiz moderation
  getQuizzes: async (params = {}) => {
    const response = await api.get('/admin/quizzes', { params });
    return response.data;
  },

  deleteQuiz: async (id) => {
    const response = await api.delete(`/admin/quizzes/${id}`);
    return response.data;
  },

  // System Diagnostics & Settings
  getSystemHealth: async () => {
    const response = await api.get('/admin/system-health');
    return response.data;
  },

  // Platform Broadcast notification dispatcher
  broadcastNotification: async (broadcastData) => {
    const response = await api.post('/admin/broadcast', broadcastData);
    return response.data;
  },
};
