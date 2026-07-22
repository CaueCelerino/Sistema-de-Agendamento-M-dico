import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getCartoes } from '../services/cartoesService';
import { getAgendamentos } from '../services/agendamentosService';

function DashboardPage() {
  const [cartoes, setCartoes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [cartoesResponse, agendamentosResponse] = await Promise.all([
          getCartoes(),
          getAgendamentos(),
        ]);

        setCartoes(cartoesResponse.cartoes || []);
        setAgendamentos(agendamentosResponse.agendamentos || []);
      } catch (err) {
        setError('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalCartoes = cartoes.length;
  const cartoesAtivos = cartoes.filter((cartao) => cartao.status === 'ATIVO').length;
  const cartoesVencidos = cartoes.filter((cartao) => cartao.status !== 'ATIVO').length;
  const totalAgendamentos = agendamentos.length;
  const agendamentosPendentes = agendamentos.filter((item) => item.status === 'PENDENTE').length;
  const agendamentosHoje = agendamentos.filter((item) => {
    const today = new Date().toISOString().split('T')[0];
    const data = item.data || item.data_agendamento || item.data_consulta;
    return data?.startsWith(today);
  }).length;

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <div className="hero-card__eyebrow">Painel operacional</div>
          <h1>Dashboard</h1>
          <p>Visualize status rápido de cartões, agendamentos e pendências em uma visão consolidada da operação.</p>
          {error && <p className="form-error">{error}</p>}
        </section>

        {loading ? (
          <div className="hero-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="skeleton-card" key={index}>
                <div className="skeleton-card__line skeleton-card__line--title" />
                <div className="skeleton-card__line" />
                <div className="skeleton-card__line skeleton-card__line--short" />
              </div>
            ))}
          </div>
        ) : (
          <div className="hero-grid">
            <Card title="Cartões ativos">
              <p>{cartoesAtivos} de {totalCartoes} cartões</p>
              <Badge text={cartoesVencidos > 0 ? `${cartoesVencidos} vencidos` : 'Tudo ativo'} variant={cartoesVencidos > 0 ? 'danger' : 'success'} />
            </Card>

            <Card title="Agendamentos">
              <p>{totalAgendamentos} agendamentos</p>
              <Badge text={agendamentosHoje > 0 ? `${agendamentosHoje} hoje` : 'Nenhum para hoje'} variant={agendamentosHoje > 0 ? 'info' : 'default'} />
            </Card>

            <Card title="Notificações">
              <p>{cartoesVencidos > 0 ? `${cartoesVencidos} cartões vencidos` : 'Sem notificações urgentes'}</p>
              <Badge text="Validade" variant={cartoesVencidos > 0 ? 'danger' : 'success'} />
            </Card>

            <Card title="Acompanhamento">
              <p>{agendamentosPendentes} solicitações aguardando aprovação</p>
              <Badge text={agendamentosPendentes > 0 ? 'Em análise pela clínica' : 'Sem pendências'} variant={agendamentosPendentes > 0 ? 'warning' : 'success'} />
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DashboardPage;
