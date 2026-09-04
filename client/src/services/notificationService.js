import api from './api';

const notificationService = {
  /**
   * Get paginated notifications with filtering
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get unread notifications count for badge
   */
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Delete single notification
   */
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Clear all read notifications
   */
  clearReadNotifications: async () => {
    const response = await api.delete('/notifications/clear-read');
    return response.data;
  },

  /**
   * Trigger auto-scan for upcoming deadline & study session reminders
   */
  checkReminders: async () => {
    const response = await api.post('/notifications/check-reminders');
    return response.data;
  },
};

export default notificationService;
