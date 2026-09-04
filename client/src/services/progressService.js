import api from './api';

const progressService = {
  // Get main student dashboard progress
  getDashboardProgress: async (period = 'daily') => {
    const response = await api.get('/progress/dashboard', { params: { period } });
    return response.data;
  },

  // Get single subject detailed progress
  getSubjectProgress: async (subjectId, studentId = null) => {
    const params = studentId ? { studentId } : {};
    const response = await api.get(`/progress/subjects/${subjectId}`, { params });
    return response.data;
  },

  // Get periodic time-series analytics (daily, weekly, monthly)
  getPeriodicAnalytics: async (period = 'daily', subjectId = null, studentId = null) => {
    const params = { period };
    if (subjectId) params.subjectId = subjectId;
    if (studentId) params.studentId = studentId;
    const response = await api.get('/progress/analytics', { params });
    return response.data;
  },

  // Teacher: Get cohort progress of enrolled students
  getTeacherCohortProgress: async (subjectId = null) => {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get('/progress/teacher/students', { params });
    return response.data;
  },

  // Teacher: Get single student deep-dive progress
  getTeacherStudentDetail: async (studentId) => {
    const response = await api.get(`/progress/teacher/students/${studentId}`);
    return response.data;
  },

  // Admin: Get platform-wide learning statistics
  getAdminPlatformProgress: async () => {
    const response = await api.get('/progress/admin/overview');
    return response.data;
  },
};

export default progressService;
