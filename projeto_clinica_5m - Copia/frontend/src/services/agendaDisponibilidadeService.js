import api from './api';

export async function listAdminAvailability(params = {}) {
  const response = await api.get('/agendamentos/disponibilidades', { params });
  return response.data;
}

export async function saveAvailability(payload) {
  const response = await api.post('/agendamentos/disponibilidades', payload);
  return response.data;
}

export async function removeAvailability(data) {
  const response = await api.delete(`/agendamentos/disponibilidades/${encodeURIComponent(data)}`);
  return response.data;
}

export async function removeSpecificHorarios(data, funcionario_id, horarios) {
  const response = await api.post(`/agendamentos/disponibilidades/${encodeURIComponent(data)}/remover-horarios`, {
    funcionario_id,
    horarios,
  });
  return response.data;
}

export async function listClientAvailability(params = {}) {
  const response = await api.get('/agendamentos/disponibilidades', { params });
  return response.data;
}

export async function requestAppointment(payload) {
  const response = await api.post('/agendamentos', payload);
  return response.data;
}

export async function listHorarioProfissionais({ data } = {}) {
  const response = await api.get(`/agendamentos/disponibilidades/${encodeURIComponent(data)}/horarios-profissionais`);
  return response.data;
}

