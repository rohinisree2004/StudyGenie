import api from './api';

export const assignmentService = {
  // Get assignments based on role
  getAssignments: async (params = {}) => {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  // Get single assignment detail
  getAssignmentById: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  // Create new assignment (Teacher/Admin)
  createAssignment: async (data) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  // Update assignment (Teacher/Admin)
  updateAssignment: async (id, data) => {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  // Delete assignment (Teacher/Admin)
  deleteAssignment: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  // Submit / mark complete (Student)
  submitAssignment: async (id, data = {}) => {
    const response = await api.post(`/assignments/${id}/submit`, data);
    return response.data;
  },

  // Grade student submission (Teacher/Admin)
  gradeSubmission: async (id, data) => {
    const response = await api.patch(`/assignments/${id}/grade`, data);
    return response.data;
  },
};

export default assignmentService;
