import api from './api';

const quizService = {
  // Generate a new AI quiz with Gemini
  generateQuiz: async (payload) => {
    const response = await api.post('/quizzes/generate', payload);
    return response.data;
  },

  // Get available quizzes list
  getQuizzes: async (params = {}) => {
    const response = await api.get('/quizzes', { params });
    return response.data;
  },

  // Get single quiz by ID (can pass mode='take' or mode='review')
  getQuizById: async (id, mode = '') => {
    const url = mode ? `/quizzes/${id}?mode=${mode}` : `/quizzes/${id}`;
    const response = await api.get(url);
    return response.data;
  },

  // Submit student attempt
  submitAttempt: async (quizId, data) => {
    const response = await api.post(`/quizzes/${quizId}/attempt`, data);
    return response.data;
  },

  // Get attempt review by ID
  getAttemptById: async (attemptId) => {
    const response = await api.get(`/quizzes/attempts/${attemptId}`);
    return response.data;
  },

  // Get all past attempts of current user
  getUserAttempts: async (params = {}) => {
    const response = await api.get('/quizzes/attempts', { params });
    return response.data;
  },

  // Update quiz details / publish toggle (Teacher/Creator)
  updateQuiz: async (id, data) => {
    const response = await api.patch(`/quizzes/${id}`, data);
    return response.data;
  },

  // Delete quiz
  deleteQuiz: async (id) => {
    const response = await api.delete(`/quizzes/${id}`);
    return response.data;
  },
};

export default quizService;
