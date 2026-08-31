import api from './api';

export const calendarService = {
  // Get aggregated calendar events
  getCalendarEvents: async (params = {}) => {
    const response = await api.get('/calendar/events', { params });
    return response.data;
  },
};

export default calendarService;
