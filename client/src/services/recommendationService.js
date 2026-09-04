import api from './api';

/**
 * AI Study Recommendations API Service
 */
export const recommendationService = {
  /**
   * Get personalized study recommendations for student
   * @param {boolean} force - Whether to bypass 24h cache and regenerate fresh advice
   * @param {string} studentId - Optional student ID (for teachers or admins)
   */
  getRecommendations: async (force = false, studentId = null) => {
    const params = {};
    if (force) params.force = 'true';
    if (studentId) params.studentId = studentId;

    const response = await api.get('/recommendations', {
      params,
      timeout: 25000, // Gemini generation may take a few seconds
    });
    return response.data;
  },

  /**
   * Explicitly regenerate fresh AI study recommendations
   * @param {string} studentId - Optional student ID
   */
  regenerateRecommendations: async (studentId = null) => {
    const body = {};
    if (studentId) body.studentId = studentId;

    const response = await api.post('/recommendations/generate', body, {
      timeout: 25000,
    });
    return response.data;
  },

  /**
   * Get recommendation by ID
   * @param {string} id
   */
  getRecommendationById: async (id) => {
    const response = await api.get(`/recommendations/${id}`);
    return response.data;
  },
};

export default recommendationService;
