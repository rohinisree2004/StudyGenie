import api from './api';

export const studyPlanService = {
  // Generate a new AI study plan using Gemini
  generatePlan: async (data) => {
    const response = await api.post('/study-plans/generate', data);
    return response.data;
  },

  // Get all study plans for current student
  getPlans: async () => {
    const response = await api.get('/study-plans');
    return response.data;
  },

  // Get single plan by ID
  getPlanById: async (id) => {
    const response = await api.get(`/study-plans/${id}`);
    return response.data;
  },

  // Update plan metadata or sessions
  updatePlan: async (id, data) => {
    const response = await api.put(`/study-plans/${id}`, data);
    return response.data;
  },

  // Apply plan sessions to the Calendar as real StudySessions
  applyToCalendar: async (id) => {
    const response = await api.post(`/study-plans/${id}/apply-to-calendar`);
    return response.data;
  },

  // Toggle completion of an individual session
  toggleSessionComplete: async (planId, sessionId) => {
    const response = await api.patch(`/study-plans/${planId}/sessions/${sessionId}/toggle`);
    return response.data;
  },

  // Regenerate plan with updated constraints
  regeneratePlan: async (id, data = {}) => {
    const response = await api.post(`/study-plans/${id}/regenerate`, data);
    return response.data;
  },

  // Delete plan
  deletePlan: async (id) => {
    const response = await api.delete(`/study-plans/${id}`);
    return response.data;
  },
};

export default studyPlanService;
