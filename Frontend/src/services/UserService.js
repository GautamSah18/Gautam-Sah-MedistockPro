import api from './api';

export const fetchUserData = async () => {
  try {
    const response = await api.get('/api/dashboard/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

// Add other user-related API calls here
export const updateUserProfile = async (userData) => {
  // Implementation for updating user profile
};