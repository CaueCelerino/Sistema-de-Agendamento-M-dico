import api from './api';

export async function getProfile() {
  const response = await api.get('/usuarios/me');
  return response.data;
}

export async function updateProfile(data) {
  const response = await api.put('/usuarios/me', data);
  return response.data;
}

export async function changePassword(senhaAtual, novaSenha) {
  const response = await api.put('/usuarios/me/senha', { senhaAtual, novaSenha });
  return response.data;
}
