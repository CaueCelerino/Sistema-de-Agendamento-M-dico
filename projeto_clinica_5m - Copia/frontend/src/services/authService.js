import api from './api';

export async function login(email, senha) {
  const response = await api.post('/auth/login', { email, senha });
  return response.data;
}

export async function register(data) {
  const response = await api.post('/auth/register', data);
  return response.data;
}
