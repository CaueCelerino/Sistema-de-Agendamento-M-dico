import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/ui/Modal';
import {
  createReport,
  deleteReport,
  listAdminReports,
  updateReport,
} from '../../services/relatoriosService';
import { REPORT_TYPES, REPORT_VISIBILITY } from '../../types/domain';

const emptyForm = {
  titulo: '',
  conteudo: '',
  tipo: REPORT_TYPES.AVISO,
  visibilidade: REPORT_VISIBILITY.ADMIN,
};

function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await listAdminReports();
        setReports(data.relatorios || []);
        setUsingFallback(Boolean(data.usingFallback));
      } catch {
        setError('Não foi possível carregar relatórios e avisos.');
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  function openCreate() {
    setEditingReport({ mode: 'create' });
    setFormData(emptyForm);
  }

  function openEdit(report) {
    setEditingReport({ mode: 'edit', id: report.id });
    setFormData({
      titulo: report.titulo,
      conteudo: report.conteudo,
      tipo: report.tipo,
      visibilidade: report.visibilidade,
    });
  }

  async function handleSaveReport() {
    if (editingReport?.mode === 'edit') {
      const result = await updateReport(editingReport.id, formData);
      setReports((current) =>
        current.map((item) => (item.id === editingReport.id ? { ...item, ...result.relatorio } : item))
      );
    } else {
      const result = await createReport({
        ...formData,
        autor: 'Admin Visual',
        publicadoEm: new Date().toISOString().slice(0, 10),
      });
      setReports((current) => [result.relatorio, ...current]);
    }
    setEditingReport(null);
  }

  async function handleDeleteReport() {
    if (!deleteTarget) return;
    await deleteReport(deleteTarget.id);
    setReports((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Relatórios Administrativos</h1>
          <p>Publique relatórios, avisos e comunicados internos ou visíveis para clientes.</p>
        </section>

        {usingFallback && (
          <p className="fallback-note">
            Conteúdo temporário. Integração futura sugerida em /admin/relatorios.
          </p>
        )}
        {error && <p className="text-error">{error}</p>}

        <div className="hero-grid funcionarios-grid">
          <section className="small-card">
            <div className="calendar-header-row">
              <h3>Relatórios e avisos</h3>
              <button className="button button-primary" type="button" onClick={openCreate}>
                Novo aviso
              </button>
            </div>
            {loading ? (
              <p>Carregando relatórios...</p>
            ) : reports.length === 0 ? (
              <p>Nenhum relatório cadastrado.</p>
            ) : (
              <div className="report-list">
                {reports.map((report) => (
                  <article className="detail-item" key={report.id}>
                    <span>{report.publicadoEm} - {report.autor}</span>
                    <strong>{report.titulo}</strong>
                    <div className="table-actions">
                      <span className="type-chip">{report.tipo}</span>
                      <span className="visibility-chip">
                        {report.visibilidade === REPORT_VISIBILITY.CLIENTES ? 'Visível para clientes' : 'Interno'}
                      </span>
                    </div>
                    <div className="table-actions">
                      <button className="link-button" type="button" onClick={() => setViewReport(report)}>Visualizar</button>
                      <button className="link-button" type="button" onClick={() => openEdit(report)}>Editar</button>
                      <button className="link-button link-button-danger" type="button" onClick={() => setDeleteTarget(report)}>Excluir</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <Modal
          isOpen={Boolean(viewReport)}
          title="Visualizar aviso"
          onClose={() => setViewReport(null)}
          onSubmit={() => setViewReport(null)}
          submitLabel="Fechar"
        >
          {viewReport && (
            <div className="form-grid">
              <div className="detail-item"><span>Título</span><strong>{viewReport.titulo}</strong></div>
              <p>{viewReport.conteudo}</p>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={Boolean(editingReport)}
          title={editingReport?.mode === 'edit' ? 'Editar aviso' : 'Novo aviso'}
          onClose={() => setEditingReport(null)}
          onSubmit={handleSaveReport}
          submitLabel="Salvar"
        >
          <div className="form-grid">
            <label>Título<input value={formData.titulo} onChange={(event) => setFormData({ ...formData, titulo: event.target.value })} /></label>
            <label>Conteúdo<textarea value={formData.conteudo} onChange={(event) => setFormData({ ...formData, conteudo: event.target.value })} /></label>
            <label>Tipo<select value={formData.tipo} onChange={(event) => setFormData({ ...formData, tipo: event.target.value })}>
              <option value={REPORT_TYPES.RELATORIO}>Relatório</option>
              <option value={REPORT_TYPES.AVISO}>Aviso</option>
              <option value={REPORT_TYPES.COMUNICADO}>Comunicado</option>
            </select></label>
            <label>Visibilidade<select value={formData.visibilidade} onChange={(event) => setFormData({ ...formData, visibilidade: event.target.value })}>
              <option value={REPORT_VISIBILITY.ADMIN}>Apenas administradores</option>
              <option value={REPORT_VISIBILITY.CLIENTES}>Também clientes</option>
            </select></label>
          </div>
        </Modal>

        <Modal
          isOpen={Boolean(deleteTarget)}
          title="Excluir aviso"
          onClose={() => setDeleteTarget(null)}
          onSubmit={handleDeleteReport}
          submitLabel="Excluir"
        >
          <p>Confirme a exclusão de <strong>{deleteTarget?.titulo}</strong>.</p>
        </Modal>
      </div>
    </Layout>
  );
}

export default AdminReportsPage;
