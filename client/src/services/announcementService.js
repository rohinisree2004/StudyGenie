import api from './api';

const announcementService = {
  /**
   * Get announcements list (filtered by subject, priority, search)
   */
  getAnnouncements: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  /**
   * Get single announcement by ID
   */
  getAnnouncementById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Create new announcement (Teacher, Admin)
   */
  createAnnouncement: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  /**
   * Update announcement (Author teacher, Admin)
   */
  updateAnnouncement: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  /**
   * Delete announcement
   */
  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },

  /**
   * Toggle pinned state
   */
  togglePin: async (id) => {
    const response = await api.patch(`/announcements/${id}/pin`);
    return response.data;
  },
};

export default announcementService;
