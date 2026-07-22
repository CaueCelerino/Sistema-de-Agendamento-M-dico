import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Badge from '../components/ui/Badge';
import { listClientCards } from '../services/clienteCartoesService';

function ClientCartoesPage() {
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function loadCards() {
      try {
        const data = await listClientCards();
        setCartoes(data.cartoes || []);
        setUsingFallback(Boolean(data.usingFallback));
      } catch {
        setError('Não foi possível carregar seus cartões.');
      } finally {
        setLoading(false);
      }
    }

    loadCards();
  }, []);

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Meus Cartões</h1>
          <p>Consulte os cartões vinculados ao seu cadastro e acompanhe a validade.</p>
        </section>

        {usingFallback && (
          <p className="fallback-note">Dados temporários. Integração futura sugerida em /cliente/cartoes.</p>
        )}
        {error && <p className="text-error">{error}</p>}

        {loading ? (
          <div className="hero-grid"><section className="small-card"><h3>Carregando</h3><p>Carregando cartões...</p></section></div>
        ) : cartoes.length === 0 ? (
          <div className="hero-grid"><section className="small-card"><h3>Nenhum cartão</h3><p>Nenhum cartão vinculado ao seu usuário.</p></section></div>
        ) : (
          <div className="client-card-list">
            {cartoes.map((cartao) => (
              <section className="small-card" key={cartao.id}>
                <h3>{cartao.identificacao}</h3>
                <div className="detail-grid">
                  <div className="detail-item"><span>Status</span><strong><Badge text={cartao.status} variant={cartao.status === 'ATIVO' ? 'success' : 'danger'} /></strong></div>
                  <div className="detail-item"><span>Tipo</span><strong>{cartao.tipo}</strong></div>
                  <div className="detail-item"><span>Criação</span><strong>{cartao.criadoEm}</strong></div>
                  <div className="detail-item"><span>Validade</span><strong>{cartao.validade}</strong></div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ClientCartoesPage;
