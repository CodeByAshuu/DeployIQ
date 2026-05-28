import axios from 'axios';

// Detect environment to handle local dev multi-port mapping vs docker-compose reverse proxy
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  // If Vite API URL points directly to Node backend on 3001, we talk directly to Spring Boot on 8080
  if (apiUrl.includes(':3001')) {
    return 'http://localhost:8080/api/analytics';
  }
  // Otherwise route via Nginx reverse proxy
  return '/api/analytics';
};

const analyticsApi = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token from localStorage if available (same as api.js)
analyticsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getDashboardStats = async () => {
  const response = await analyticsApi.get('/dashboard');
  return response.data;
};

export const getTrends = async () => {
  const response = await analyticsApi.get('/trends');
  return response.data;
};

export const getStatusBreakdown = async () => {
  const response = await analyticsApi.get('/status-breakdown');
  return response.data;
};

export const getAnalyticsHealth = async () => {
  const response = await analyticsApi.get('/health');
  return response.data;
};

export default analyticsApi;
