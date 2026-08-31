import api from './api';

export const taskService = {
  // Get all tasks with optional filters
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get single task by ID
  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Update task
  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Fast toggle task completion
  toggleComplete: async (id) => {
    const response = await api.patch(`/tasks/${id}/toggle`);
    return response.data;
  },

  // Delete task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

export default taskService;
