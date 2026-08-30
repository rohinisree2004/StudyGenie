import api from './api';

const materialService = {
  /**
   * Get all study materials with optional query filters
   */
  getMaterials: async (params = {}) => {
    const response = await api.get('/materials', { params });
    return response.data;
  },

  /**
   * Get single material details by ID
   */
  getMaterial: async (id) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  /**
   * Upload / Create new study material (multipart/form-data)
   */
  createMaterial: async (formData) => {
    const response = await api.post('/materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update study material metadata or replace file
   */
  updateMaterial: async (id, data) => {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/materials/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  /**
   * Delete study material
   */
  deleteMaterial: async (id) => {
    const response = await api.delete(`/materials/${id}`);
    return response.data;
  },

  /**
   * Download material file
   */
  downloadMaterial: async (id, filename = 'study_material') => {
    const response = await api.get(`/materials/${id}/download`, {
      responseType: 'blob',
    });

    // Create a temporary link and trigger browser download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  },
};

export default materialService;
