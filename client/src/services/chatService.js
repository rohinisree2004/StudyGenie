import api from './api';

const chatService = {
  // Send a message to the AI assistant
  sendMessage: async (payload) => {
    const response = await api.post('/chat/message', payload);
    return response.data;
  },

  // Get user's conversations list
  getConversations: async (params = {}) => {
    const response = await api.get('/chat/conversations', { params });
    return response.data;
  },

  // Get a specific conversation by ID
  getConversationById: async (id) => {
    const response = await api.get(`/chat/conversations/${id}`);
    return response.data;
  },

  // Update conversation (title, pin, subject/topic)
  updateConversation: async (id, data) => {
    const response = await api.patch(`/chat/conversations/${id}`, data);
    return response.data;
  },

  // Delete a conversation
  deleteConversation: async (id) => {
    const response = await api.delete(`/chat/conversations/${id}`);
    return response.data;
  },

  // Clear all conversations
  clearConversations: async () => {
    const response = await api.delete('/chat/conversations');
    return response.data;
  },
};

export default chatService;
