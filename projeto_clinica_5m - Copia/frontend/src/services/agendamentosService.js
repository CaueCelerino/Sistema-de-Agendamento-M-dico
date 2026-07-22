import api from './api';

export async function getAgendamentos(params = {}) {
  const response = await api.get('/agendamentos', { params });
  return response.data;
}
