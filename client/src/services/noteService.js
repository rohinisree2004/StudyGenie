import api from './api';

const noteService = {
  /**
   * Get all personal notes with filters (subject, topic, isPinned, tag, search)
   */
  getNotes: async (params = {}) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  /**
   * Get single note by ID
   */
  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  /**
   * Create a new personal study note
   */
  createNote: async (data) => {
    const response = await api.post('/notes', data);
    return response.data;
  },

  /**
   * Update an existing note
   */
  updateNote: async (id, data) => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },

  /**
   * Toggle pinned status of a note
   */
  togglePin: async (id) => {
    const response = await api.patch(`/notes/${id}/pin`);
    return response.data;
  },

  /**
   * Delete a note
   */
  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },
};

export default noteService;
