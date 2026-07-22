import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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
