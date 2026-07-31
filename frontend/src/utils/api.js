import axios from 'axios';

const configuredApiUrl = (process.env.REACT_APP_API_URL || 'https://filelock45.onrender.com').trim();
const apiUrl = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl
  : `${configuredApiUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: apiUrl,
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fl_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fl_token');
      localStorage.removeItem('fl_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
