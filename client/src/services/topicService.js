import api from './api';

export const topicService = {
  // Get topics for a subject
  getTopicsBySubject: async (subjectId) => {
    const response = await api.get(`/subjects/${subjectId}/topics`);
    return response.data;
  },

  // Create topic in a subject
  createTopic: async (subjectId, topicData) => {
    const response = await api.post(`/subjects/${subjectId}/topics`, topicData);
    return response.data;
  },

  // Update topic
  updateTopic: async (id, topicData) => {
    const response = await api.put(`/topics/${id}`, topicData);
    return response.data;
  },

  // Delete topic
  deleteTopic: async (id) => {
    const response = await api.delete(`/topics/${id}`);
    return response.data;
  },

  // Student toggles completion
  toggleCompletion: async (id) => {
    const response = await api.post(`/topics/${id}/toggle-completion`);
    return response.data;
  },
};

export default topicService;
