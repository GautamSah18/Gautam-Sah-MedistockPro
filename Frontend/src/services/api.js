import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 6000, //  60 seconds — handles Render free tier cold start
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;

    // Handle timeout specifically — Render cold start
    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        ...error,
        response: {
          data: {
            error:
              "Server is waking up, please wait 30 seconds and try again.",
          },
        },
      });
    }

    // Handle no response at all (network error)
    if (!error.response) {
      return Promise.reject({
        ...error,
        response: {
          data: {
            error: "Network error. Please check your connection and try again.",
          },
        },
      });
    }

    if (error.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/api/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);

          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;
          originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalConfig);
        }
      } catch (refreshError) {
        // Redirect to login if refresh fails
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;