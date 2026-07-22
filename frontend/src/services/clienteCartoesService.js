import api from './api';
import { fallbackClientCards } from '../mocks/fallbackData';

export async function listClientCards() {
  try {
    const response = await api.get('/cartoes');
    const cartoes = (response.data.cartoes || []).map((item) => ({
      id: item.id,
      identificacao: item.nome_cartao || `EV-${item.id}`,
      status: item.status || 'ATIVO',
      criadoEm: item.data_entrada || '',
      validade: item.data_saida || '',
      tipo: item.tipo_servico || 'INDIVIDUAL',
    }));

    return { cartoes, usingFallback: false };
  } catch {
    return { cartoes: fallbackClientCards, usingFallback: true };
  }
}
