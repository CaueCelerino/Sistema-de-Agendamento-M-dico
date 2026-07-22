import { fallbackClientCards } from '../mocks/fallbackData';

// Endpoint sugerido para backend futuro:
// GET /cliente/cartoes

export async function listClientCards() {
  return { cartoes: fallbackClientCards, usingFallback: true };
}
