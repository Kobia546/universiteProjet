import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('syfic_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('syfic_access_token');
      localStorage.removeItem('syfic_user');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  },
);
