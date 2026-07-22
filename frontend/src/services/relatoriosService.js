import api from './api';
import { fallbackReports } from '../mocks/fallbackData';

export async function listAdminReports() {
  try {
    const response = await api.get('/admin/relatorios');
    return { relatorios: response.data.relatorios || [], usingFallback: false };
  } catch {
    return { relatorios: fallbackReports, usingFallback: true };
  }
}

export async function createReport(payload) {
  const response = await api.post('/admin/relatorios', payload);
  return { relatorio: response.data.relatorio, usingFallback: false };
}

export async function updateReport(id, payload) {
  const response = await api.put(`/admin/relatorios/${id}`, payload);
  return { relatorio: response.data.relatorio, usingFallback: false };
}

export async function deleteReport(id) {
  const response = await api.delete(`/admin/relatorios/${id}`);
  return { ...response.data, usingFallback: false };
}

export async function generateQuickAdminReport(options = {}) {
  const payload = {
    autor: options.autor || undefined,
  };

  const response = await api.post('/admin/relatorios/gerar-rapido', payload);
  return {
    relatorio: response.data.relatorio,
    quickSummary: response.data.quickSummary || null,
    usingFallback: false,
  };
}

export async function listClientNotices() {
  const [notificacoesResult, relatoriosResult] = await Promise.allSettled([
    api.get('/notificacoes'),
    api.get('/relatorios/cliente'),
  ]);

  const notificacoes = notificacoesResult.status === 'fulfilled'
    ? (notificacoesResult.value.data.notificacoes || notificacoesResult.value.data.avisos || [])
    : [];

  const relatoriosCliente = relatoriosResult.status === 'fulfilled'
    ? (relatoriosResult.value.data.relatorios || [])
    : [];

  const avisosDeRelatorio = relatoriosCliente.map((item) => ({
    id: `relatorio-${item.id}`,
    titulo: item.titulo,
    mensagem: item.conteudo,
    tipo: item.tipo || 'RELATORIO',
    lida: 0,
    created_at: item.created_at || item.publicadoEm,
    canal: 'APP',
  }));

  const avisos = [...notificacoes, ...avisosDeRelatorio].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  if (avisos.length > 0) {
    return { avisos, usingFallback: false };
  }

  const allFailed = notificacoesResult.status === 'rejected' && relatoriosResult.status === 'rejected';
  if (allFailed) {
    return { avisos: [], usingFallback: true };
  }

  return { avisos: [], usingFallback: false };
}

