import api from './api';

export const subjectService = {
  // Get subjects (browse = true gets full catalog for students to explore)
  getSubjects: async (browse = false, category = '') => {
    let url = `/subjects?browse=${browse}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get subject details by ID
  getSubjectById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  // Create subject (Admin or Teacher)
  createSubject: async (data) => {
    const response = await api.post('/subjects', data);
    return response.data;
  },

  // Update subject (Admin or assigned Teacher)
  updateSubject: async (id, data) => {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },

  // Delete subject (Admin only)
  deleteSubject: async (id) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  // Student enrolls in subject
  enroll: async (id) => {
    const response = await api.post(`/subjects/${id}/enroll`);
    return response.data;
  },

  // Student unenrolls from subject
  unenroll: async (id) => {
    const response = await api.post(`/subjects/${id}/unenroll`);
    return response.data;
  },

  // Get topics for a subject
  getTopics: async (subjectId) => {
    const response = await api.get(`/subjects/${subjectId}/topics`);
    return response.data;
  },
};

export default subjectService;
