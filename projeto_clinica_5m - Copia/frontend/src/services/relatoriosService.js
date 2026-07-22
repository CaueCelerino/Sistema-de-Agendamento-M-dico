import api from './api';
import { fallbackClientNotices, fallbackReports } from '../mocks/fallbackData';

// Endpoints sugeridos para backend futuro:
// GET /admin/relatorios
// POST /admin/relatorios
// PUT /admin/relatorios/:id
// DELETE /admin/relatorios/:id
// PATCH /admin/relatorios/:id/visibilidade
// GET /avisos/cliente

export async function listAdminReports() {
  return { relatorios: fallbackReports, usingFallback: true };
}

export async function createReport(payload) {
  return { relatorio: { ...payload, id: Date.now() }, usingFallback: true };
}

export async function updateReport(id, payload) {
  return { relatorio: { ...payload, id: Number(id) }, usingFallback: true };
}

export async function deleteReport(id) {
  return { id: Number(id), deleted: true, usingFallback: true };
}

export async function listClientNotices() {
  try {
    const response = await api.get('/notificacoes');
    // A API retorna 'avisos' e 'notificacoes', usamos 'avisos' para compatibilidade
    return { avisos: response.data.notificacoes || response.data.avisos || [], usingFallback: false };
  } catch (error) {
    console.warn('Falha ao buscar notificações reais, usando fallback:', error.message);
    return { avisos: fallbackClientNotices, usingFallback: true };
  }
}

