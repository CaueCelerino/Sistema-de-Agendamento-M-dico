import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getAgendamentos } from '../services/agendamentosService';
import { listClientAvailability } from '../services/agendaDisponibilidadeService';

function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disponibilidades, setDisponibilidades] = useState([]);

  useEffect(() => {
    async function loadAgendamentos() {
      try {
        const data = await getAgendamentos();
        setAgendamentos(data.agendamentos || []);
      } catch (err) {
        setError('Não foi possível carregar os agendamentos.');
      } finally {
        setLoading(false);
      }
    }

    loadAgendamentos();
  }, []);

  useEffect(() => {
    async function loadDisponibilidades() {
      try {
        const res = await listClientAvailability();
        setDisponibilidades(res.disponibilidades || []);
      } catch (e) {
        // não bloquear funcionalidade principal
      }
    }

    loadDisponibilidades();
  }, []);

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Agendamentos</h1>
          <p>Visualize agendamentos futuros, pendentes e históricos.</p>
          {error && <p className="form-error">{error}</p>}
        </section>

        {loading ? (
          <div className="hero-grid">
            <Card title="Carregando">
              <p>Carregando agendamentos...</p>
            </Card>
          </div>
        ) : agendamentos.length > 0 ? (
          <div className="hero-grid">
            {agendamentos.map((item) => (
              <Card key={item.id} title={item.funcionario || 'Agendamento'}>
                <p>Tipo: {item.tipo || '—'}</p>
                <p>Data: {item.data || item.data_agendamento || '—'}</p>
                <p>Horário: {item.horario || item.horario_agendamento || '—'}</p>
                <p>Profissional: {item.funcionario || '—'}{item.funcionario_especialidade ? ` (${item.funcionario_especialidade})` : ''}</p>
                <Badge
                  text={item.status || 'Pendente'}
                  variant={
                    item.status === 'REALIZADO'
                      ? 'success'
                      : item.status === 'CANCELADO'
                      ? 'danger'
                      : 'info'
                  }
                />
              </Card>
            ))}
          </div>
        ) : (
          <div className="hero-grid">
            <Card title="Sem agendamentos">
              <p>Agende uma consulta ou exame para preencher esta lista.</p>
            </Card>
          </div>
        )}
      </div>
      {disponibilidades.length > 0 && (
        <section style={{ marginTop: '1rem' }}>
          <h3>Horários disponíveis (próximos dias)</h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {disponibilidades.slice(0, 6).map((d) => (
              <Card key={d.data} title={d.data}>
                <p><strong>Horários:</strong> {d.horarios.join(', ')}</p>
                {d.porProfissionais && d.porProfissionais.length > 0 && (
                  <div>
                    <strong>Por profissional:</strong>
                    <ul>
                      {d.porProfissionais.map((p) => (
                        <li key={p.funcionario_id}>{p.funcionario}{p.especialidade ? ` (${p.especialidade})` : ''}: {p.horarios.join(', ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}

export default AgendamentosPage;
