import api from './api';

const summaryService = {
  // Generate an AI summary from a note, material, or custom text
  generateSummary: async (payload) => {
    const response = await api.post('/summaries/generate', payload);
    return response.data;
  },

  // Save a summary to library
  saveSummary: async (data) => {
    const response = await api.post('/summaries', data);
    return response.data;
  },

  // Get user's saved summaries list with filters
  getSummaries: async (params = {}) => {
    const response = await api.get('/summaries', { params });
    return response.data;
  },

  // Get single summary by ID
  getSummaryById: async (id) => {
    const response = await api.get(`/summaries/${id}`);
    return response.data;
  },

  // Delete a saved summary
  deleteSummary: async (id) => {
    const response = await api.delete(`/summaries/${id}`);
    return response.data;
  },

  // Export summary to a new Note
  exportToNote: async (id) => {
    const response = await api.post(`/summaries/${id}/export-to-note`);
    return response.data;
  },
};

export default summaryService;
