import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getCartoes } from '../services/cartoesService';

function CartoesPage() {
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCartoes() {
      try {
        const data = await getCartoes();
        setCartoes(data.cartoes || []);
      } catch (err) {
        setError('Não foi possível carregar os cartões no momento.');
      } finally {
        setLoading(false);
      }
    }

    loadCartoes();
  }, []);

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Cartões</h1>
          <p>Aqui você poderá ver os cartões de acesso e seus status.</p>
          {error && <p className="form-error">{error}</p>}
        </section>

        {loading ? (
          <div className="hero-grid">
            <Card title="Carregando">
              <p>Carregando cartões...</p>
            </Card>
          </div>
        ) : cartoes.length > 0 ? (
          <div className="hero-grid">
            {cartoes.map((cartao) => (
              <Card key={cartao.id} title={cartao.nome_cartao || 'Cartão'}>
                <p>Tipo: {cartao.tipo_servico || '—'}</p>
                <p>Validade: {cartao.data_saida || '—'}</p>
                <Badge
                  text={cartao.status === 'ATIVO' ? 'Ativo' : 'Vencido'}
                  variant={cartao.status === 'ATIVO' ? 'success' : 'danger'}
                />
              </Card>
            ))}
          </div>
        ) : (
          <div className="hero-grid">
            <Card title="Sem cartões">
              <p>Cadastre um cartão para começar a acompanhar.</p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CartoesPage;
