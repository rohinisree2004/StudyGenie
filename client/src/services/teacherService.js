import api from './api';

/**
 * Teacher Student Monitoring API Service
 */
export const teacherService = {
  /**
   * Get high-level teacher dashboard KPIs, alert metrics, and recent submissions
   */
  getDashboardStats: async () => {
    const response = await api.get('/teacher/dashboard-stats');
    return response.data;
  },

  /**
   * Get students enrolled in teacher's subjects with search, filter, and sort options
   * @param {Object} params - { subjectId, search, status, sort }
   */
  getStudents: async (params = {}) => {
    const response = await api.get('/teacher/students', { params });
    return response.data;
  },

  /**
   * Get detailed student performance deep-dive in teacher's courses
   * @param {string} studentId
   * @param {Object} params - Optional { subjectId }
   */
  getStudentPerformance: async (studentId, params = {}) => {
    const response = await api.get(`/teacher/students/${studentId}`, { params });
    return response.data;
  },

  /**
   * Get class roster and aggregate performance for a specific subject
   * @param {string} subjectId
   * @param {Object} params
   */
  getSubjectStudents: async (subjectId, params = {}) => {
    const response = await api.get(`/teacher/subjects/${subjectId}/students`, { params });
    return response.data;
  },
};

export default teacherService;
