import api from './api';

export const studySessionService = {
  // Get study sessions
  getStudySessions: async (params = {}) => {
    const response = await api.get('/study-sessions', { params });
    return response.data;
  },

  // Get single session
  getStudySessionById: async (id) => {
    const response = await api.get(`/study-sessions/${id}`);
    return response.data;
  },

  // Create study session
  createStudySession: async (data) => {
    const response = await api.post('/study-sessions', data);
    return response.data;
  },

  // Update session
  updateStudySession: async (id, data) => {
    const response = await api.put(`/study-sessions/${id}`, data);
    return response.data;
  },

  // Fast toggle session complete
  completeStudySession: async (id) => {
    const response = await api.patch(`/study-sessions/${id}/complete`);
    return response.data;
  },

  // Delete session
  deleteStudySession: async (id) => {
    const response = await api.delete(`/study-sessions/${id}`);
    return response.data;
  },
};

export default studySessionService;
