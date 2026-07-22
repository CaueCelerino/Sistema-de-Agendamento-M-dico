import api from './api';

export async function getCartoes() {
  const response = await api.get('/cartoes');
  return response.data;
}
