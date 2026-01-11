// src/context/AuthContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Function to refresh access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/token/refresh/', {
        refresh: refreshToken
      });

      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        // Update the API instance with the new token
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        return response.data.access;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, log out the user
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      window.location.href = '/login';
      return null;
    }
  };

  // Interceptor to handle token refresh automatically
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    // Clean up interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Load user data on app start
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Fetch complete profile data
      const fetchUserProfile = async () => {
        try {
          // Set the token in the API headers before making the request
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const profileRes = await api.get('/api/auth/profile/');
          const profileData = profileRes.data;
          
          const userData = {
            id: localStorage.getItem('userId'),
            email: profileData.email,
            role: profileData.role,
            profilePicture: profileData.profile_picture,
            fullName: profileData.first_name && profileData.last_name 
              ? `${profileData.first_name} ${profileData.last_name}`
              : profileData.first_name || profileData.last_name || profileData.email.split('@')[0],
          };
          
          setUser(userData);
        } catch (error) {
          console.error('Error fetching profile on app start:', error);
          // Fallback to basic user data from localStorage
          const userData = {
            id: localStorage.getItem('userId'),
            email: localStorage.getItem('userEmail'),
            role: localStorage.getItem('userRole'),
            profilePicture: localStorage.getItem('userProfilePicture'),
            fullName: localStorage.getItem('userFullName'),
          };
          
          if (userData.email && userData.role) {
            setUser(userData);
          }
        }
      };
      
      fetchUserProfile();
    }
  }, []);

  const login = async (credentials) => {
    try {
      const res = await api.post('/api/auth/login/', credentials);
      
      if (res.data.access && res.data.refresh) {
        // Store tokens
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        
        // Store user data
        const userData = res.data.user;
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userFullName', userData.fullName || userData.email.split('@')[0]);
        
        // Fetch complete profile including profile picture
        try {
          const profileRes = await api.get('/api/auth/profile/');
          const profileData = profileRes.data;
          
          if (profileData.profile_picture) {
            localStorage.setItem('userProfilePicture', profileData.profile_picture);
          }
          
          // Set user in context with profile picture
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role,
            profilePicture: profileData.profile_picture,
            fullName: profileData.first_name && profileData.last_name 
              ? `${profileData.first_name} ${profileData.last_name}`
              : profileData.first_name || profileData.last_name || userData.email.split('@')[0],
          });
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          // Fallback to basic user data
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role,
            profilePicture: null,
            fullName: userData.fullName || userData.email.split('@')[0],
          });
        }
        
        return res.data;
      }
      
      throw new Error(res.data.error || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/api/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userFullName');
      localStorage.removeItem('userProfilePicture'); // Clear profile picture
      
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      window.location.href = '/login';
    }
  };
  
  // Function to update user profile picture
  const updateUserProfile = (profileData) => {
    setUser(prev => ({
      ...prev,
      ...profileData
    }));
    
    // Update localStorage
    Object.keys(profileData).forEach(key => {
      localStorage.setItem(`user${key.charAt(0).toUpperCase() + key.slice(1)}`, profileData[key]);
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);