import api from './api';

export const userService = {
  // Get current user profile and preferences
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update profile info (name, bio, institution, gradeLevel, phone, avatar)
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Update study & learning preferences
  updatePreferences: async (preferencesData) => {
    const response = await api.put('/users/preferences', preferencesData);
    return response.data;
  },

  // Get active teacher accounts (for admin assignment)
  getTeachers: async () => {
    const response = await api.get('/users/teachers');
    return response.data;
  },

  // Upload user profile photo to Cloudinary
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove profile photo from Cloudinary
  removeAvatar: async () => {
    const response = await api.delete('/users/avatar');
    return response.data;
  },
};
