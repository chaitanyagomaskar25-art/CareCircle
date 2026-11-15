import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Pre-configured Axios instance for CareCircle backend communication.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: inject auth token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carecircle_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize error format
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = {
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || [],
      raw: error,
    };
    return Promise.reject(errorResponse);
  }
);

/**
 * Health check service method.
 */
export const checkHealth = async () => {
  return await api.get('/health');
};

export default api;
