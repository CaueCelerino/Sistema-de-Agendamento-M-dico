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
  const agendamentosHoje = agendamentos.filter((item) => {
    const today = new Date().toISOString().split('T')[0];
    const data = item.data || item.data_agendamento || item.data_consulta;
    return data?.startsWith(today);
  }).length;

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Dashboard</h1>
          <p>Visualize status rápido de cartões, agendamentos e notificações.</p>
          {error && <p className="form-error">{error}</p>}
        </section>

        {loading ? (
          <div className="hero-grid">
            <Card title="Carregando">
              <p>Carregando dados do dashboard...</p>
            </Card>
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

            <Card title="Funcionários">
              <p>Use página de funcionários para ver o time</p>
              <Badge text="Entrada manual" variant="info" />
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DashboardPage;
