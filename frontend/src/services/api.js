import axios from 'axios';

const fallbackApiUrl = 'https://tournaments-label-circumstances-that.trycloudflare.com/api';
const configuredApiUrl = import.meta.env?.VITE_API_URL?.replace(/\/$/, '');
const apiBaseUrl = configuredApiUrl || fallbackApiUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('espacoVida_user');

  if (storedUser) {
    try {
      const session = JSON.parse(storedUser);
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    } catch {
      localStorage.removeItem('espacoVida_user');
    }
  }

  return config;
});

export default api;
