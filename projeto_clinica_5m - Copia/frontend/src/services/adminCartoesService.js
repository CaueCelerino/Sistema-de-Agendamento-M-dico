import api from './api';

// Back-end (real):
// GET    /admin/cartoes
// GET    /admin/cartoes/:id
// PATCH  /admin/cartoes/:id/ativar
// PATCH  /admin/cartoes/:id/desativar

export async function listAdminCards() {
  const res = await api.get('/admin/cartoes');
  return res.data;
}

export async function getAdminCardDetails(id) {
  const res = await api.get(`/admin/cartoes/${id}`);
  return res.data;
}

export async function activateAdminCard(id) {
  const res = await api.patch(`/admin/cartoes/${id}/ativar`);
  return res.data;
}

export async function deactivateAdminCard(id) {
  const res = await api.patch(`/admin/cartoes/${id}/desativar`);
  return res.data;
}

export async function updateAdminCard(id, payload) {
  const res = await api.patch(`/admin/cartoes/${id}`, payload);
  return res.data;
}

