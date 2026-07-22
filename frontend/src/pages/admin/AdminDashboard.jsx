import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import AppDialog from '../../components/ui/AppDialog';
import adminService from '../../services/adminService';
import { generateQuickAdminReport } from '../../services/relatoriosService';

function AdminDashboard() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = todos, 'PENDENTE', 'AGENDADO', 'CANCELADO'
  const [reportMessage, setReportMessage] = useState('');
  const [dialogState, setDialogState] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  async function loadAgendamentos() {
    try {
      const data = await adminService.getAgendamentos();
      // Ordena por data mais recente
      const sorted = (data.agendamentos || []).sort(
        (a, b) => new Date(b.data) - new Date(a.data) || b.horario.localeCompare(a.horario)
      );
      setAgendamentos(sorted);
      setError('');
    } catch {
      setError('Não foi possível carregar os agendamentos.');
    } finally {
      setLoading(false);
    }
  }

  // Filtra agendamentos por status
  const filteredAgendamentos = statusFilter
    ? agendamentos.filter((item) => item.status === statusFilter)
    : agendamentos;

  useEffect(() => {
    loadAgendamentos();
  }, []);

  async function handleDecision(id, action) {
    try {
      if (action === 'accept') {
        await adminService.aceitarAgendamento(id);
      } else if (action === 'reject') {
        await adminService.rejeitarAgendamento(id);
      } else if (action === 'compareceu') {
        await adminService.marcarCompareceu(id);
      } else if (action === 'naoCompareceu') {
        await adminService.marcarNaoCompareceu(id);
      }
      await loadAgendamentos();
    } catch {
      setError('Não foi possível atualizar o agendamento.');
    }
  }

  async function handleRequestReagendamento(id) {
    setDialogState({
      title: 'Solicitar reagendamento',
      message: 'Enviar solicitação de reagendamento para o cliente? O cliente receberá uma notificação.',
      confirmLabel: 'Enviar',
      onClose: () => setDialogState(null),
      onConfirm: async () => {
        try {
          await adminService.requestReagendamento(id);
          await loadAgendamentos();
          setDialogState({
            title: 'Sucesso',
            message: 'Solicitação de reagendamento enviada.',
            confirmLabel: 'Fechar',
            onClose: () => setDialogState(null),
            onConfirm: () => setDialogState(null),
          });
        } catch (e) {
          setError('Não foi possível enviar solicitação de reagendamento.');
          setDialogState({
            title: 'Erro',
            message: 'Não foi possível enviar solicitação de reagendamento.',
            confirmLabel: 'Fechar',
            onClose: () => setDialogState(null),
            onConfirm: () => setDialogState(null),
          });
        }
      },
    });
  }

  async function handleGenerateQuickReport() {
    setReportMessage('');
    setGeneratingReport(true);
    try {
      const result = await generateQuickAdminReport({ autor: 'Admin Visual' });
      const operationLabel = result?.quickSummary?.operation === 'updated' ? 'atualizado' : 'criado';
      const metricas = result?.quickSummary?.metricas;
      const metricsMessage = metricas
        ? ` Pendências: ${metricas.pendencias} | Cartões ativos: ${metricas.cartoesAtivos} | Não lidas: ${metricas.notificacoesNaoLidas}.`
        : '';

      setReportMessage(`Relatório ${operationLabel}: ${result?.relatorio?.titulo || 'Resumo rápido'}.${metricsMessage}`);
    } catch {
      setError('Não foi possível gerar relatório rápido.');
    } finally {
      setGeneratingReport(false);
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Admin Dashboard</h1>
          <p>Visão geral administrativa: aprovações, agendamentos e ações rápidas.</p>
        </section>

        {error && <p className="text-error">{error}</p>}
        {reportMessage && <p className="form-success">{reportMessage}</p>}

        <div className="hero-grid">
          <Card title="Aprovações pendentes">
            <p>{agendamentos.filter((item) => item.status === 'PENDENTE').length} itens pendentes</p>
            <Badge text={agendamentos.some((item) => item.status === 'PENDENTE') ? 'Ação necessária' : 'Sem pendências'} variant={agendamentos.some((item) => item.status === 'PENDENTE') ? 'info' : 'success'} />
            <div style={{ marginTop: '0.75rem' }}>
              <button className="button button-primary" type="button" onClick={() => setStatusFilter('PENDENTE')}>
                Ver pendências
              </button>
            </div>
          </Card>

          <Card title="Relatórios rápidos">
            <p>Visão consolidada das métricas internas da clínica.</p>
            <Badge text="Somente administração" variant="info" />
            <div style={{ marginTop: '0.75rem' }}>
              <button
                className="button button-primary"
                type="button"
                onClick={handleGenerateQuickReport}
                disabled={generatingReport}
              >
                {generatingReport ? 'Gerando...' : 'Gerar resumo rápido'}
              </button>
            </div>
          </Card>
        </div>

        <section className="small-card" style={{ marginTop: '1rem' }}>
          <h3>Agendamentos de clientes</h3>
          
          {/* Filtro de status */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold' }}>Filtrar por status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '0.95rem',
              }}
            >
              <option value="">Todos</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="AGENDADO">Agendados</option>
              <option value="CANCELADO">Cancelados</option>
              <option value="REALIZADO">Realizados</option>
              <option value="NAO_COMPARECEU">Não compareceu</option>
            </select>
          </div>

          {loading ? (
            <p>Carregando agendamentos...</p>
          ) : filteredAgendamentos.length === 0 ? (
            <p>Nenhum agendamento encontrado.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Status</th>
                    <th>Profissional</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgendamentos.map((item) => (
                    <tr key={item.id}>
                      <td>{item.usuario_nome || item.usuario_email || 'Cliente'}</td>
                      <td>{item.data}</td>
                      <td>{item.horario}</td>
                      <td><Badge text={item.status || 'PENDENTE'} variant={item.status === 'AGENDADO' ? 'success' : item.status === 'CANCELADO' ? 'danger' : 'info'} /></td>
                      <td>{item.funcionario || '—'}</td>
                      <td>
                        <div className="table-actions">
                          {item.status === 'PENDENTE' ? (
                            <>
                              <button className="link-button" type="button" onClick={() => handleDecision(item.id, 'accept')}>Aceitar</button>
                              <button className="link-button link-button-danger" type="button" onClick={() => handleDecision(item.id, 'reject')}>Rejeitar</button>
                            </>
                          ) : item.status === 'AGENDADO' ? (
                            <>
                              <button className="link-button" type="button" onClick={() => handleRequestReagendamento(item.id)}>Solicitar reagendamento</button>
                              <button className="link-button" type="button" onClick={() => handleDecision(item.id, 'compareceu')}>Compareceu</button>
                              <button className="link-button link-button-warning" type="button" onClick={() => handleDecision(item.id, 'naoCompareceu')}>Não compareceu</button>
                              <button className="link-button link-button-danger" type="button" onClick={() => handleDecision(item.id, 'reject')}>Cancelar</button>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <AppDialog
          isOpen={Boolean(dialogState)}
          title={dialogState?.title || 'Atenção'}
          message={dialogState?.message || ''}
          onClose={dialogState?.onClose || (() => setDialogState(null))}
          onConfirm={dialogState?.onConfirm}
          confirmLabel={dialogState?.confirmLabel || 'Ok'}
          cancelLabel="Cancelar"
        />
      </div>
    </Layout>
  );
}

export default AdminDashboard;
