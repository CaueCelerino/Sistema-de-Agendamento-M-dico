import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import adminService from '../../services/adminService';

function ManageFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'funcionario',
    especialidade: ''
  });

  const loadFuncionarios = async () => {
    try {
      const data = await adminService.getFuncionarios();
      setFuncionarios(data.funcionarios || data);
      setError(null);
    } catch (err) {
      console.error('Failed to load funcionarios', err);
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const handleOpenModal = (func = null) => {
    if (func) {
      setEditingId(func.id);
      setFormData({
        nome: func.nome,
        email: func.email,
        role: func.role || 'funcionario',
        especialidade: func.especialidade || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: '',
        email: '',
        role: 'funcionario',
        especialidade: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      if (editingId) {
        // Update
        await adminService.updateFuncionario(editingId, formData);
      } else {
        // Create
        await adminService.createFuncionario(formData);
      }
      handleCloseModal();
      await loadFuncionarios();
    } catch (err) {
      console.error('Failed to save funcionario', err);
      alert('Erro ao salvar: ' + (err.message || 'Tente novamente'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover?')) return;
    try {
      await adminService.deleteFuncionario(id);
      await loadFuncionarios();
    } catch (err) {
      console.error('Failed to delete funcionario', err);
      alert('Erro ao remover: ' + (err.message || 'Tente novamente'));
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) {
      alert('Informe uma nova senha');
      return;
    }

    try {
      await adminService.resetarSenhaUsuario(resetTarget.id, newPassword.trim());
      setShowResetPasswordModal(false);
      setResetTarget(null);
      setNewPassword('');
      alert('Senha redefinida com sucesso');
    } catch (err) {
      alert('Erro ao redefinir senha: ' + (err.message || 'Tente novamente'));
    }
  };

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Gerenciar Funcionários</h1>
          <p>Adicione, edite ou remova funcionários e gerencie permissões.</p>
        </section>

        <div className="hero-grid funcionarios-grid">
          <Card title="Equipe">
            {loading && <p>Carregando funcionários…</p>}
            {error && <p className="text-error">Erro: {error}</p>}
            {!loading && !error && (
              <>
                <div className="funcionarios-table-wrap">
                  <table className="funcionarios-table w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-2 font-semibold">Nome</th>
                      <th className="text-left py-2 px-2 font-semibold">Email</th>
                      <th className="text-left py-2 px-2 font-semibold">Cargo</th>
                      <th className="text-left py-2 px-2 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-500">
                          Nenhum funcionário encontrado.
                        </td>
                      </tr>
                    )}
                    {funcionarios.map((f) => (
                      <tr key={f.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-2 funcionario-cell">{f.nome}</td>
                        <td className="py-3 px-2 funcionario-cell">{f.email}</td>
                        <td className="py-3 px-2 funcionario-cell">{f.role}</td>
                        <td className="py-3 px-2">
                          <div className="funcionario-table-actions">
                          <button
                            className="funcionario-table-action funcionario-table-action-edit"
                            onClick={() => handleOpenModal(f)}
                          >
                            Editar
                          </button>

                          <button
                            className="funcionario-table-action funcionario-table-action-delete"
                            onClick={() => handleDelete(f.id)}
                          >
                            Deletar
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>

                {funcionarios.length === 0 ? (
                  <p className="funcionarios-mobile-empty">Nenhum funcionario encontrado.</p>
                ) : (
                  <div className="funcionarios-mobile-list">
                    {funcionarios.map((f) => (
                      <article className="funcionario-mobile-card" key={f.id}>
                        <div className="funcionario-mobile-header">
                          <h4>{f.nome}</h4>
                          <span>{f.role}</span>
                        </div>
                        <dl className="funcionario-mobile-details">
                          <div>
                            <dt>Email</dt>
                            <dd>{f.email}</dd>
                          </div>
                          <div>
                            <dt>Cargo</dt>
                            <dd>{f.role}</dd>
                          </div>
                        </dl>
                        <div className="funcionario-mobile-actions">
                          <button
                            className="funcionario-mobile-button funcionario-mobile-button-edit"
                            onClick={() => handleOpenModal(f)}
                          >
                            Editar
                          </button>

                          <button
                            className="funcionario-mobile-button funcionario-mobile-button-delete"
                            onClick={() => handleDelete(f.id)}
                          >
                            Deletar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="funcionarios-add-action mt-4">
                  <Button variant="primary" onClick={() => handleOpenModal()}>
                    + Adicionar Funcionário
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        <Modal
          isOpen={showResetPasswordModal}
          title="Redefinir senha"
          onClose={() => {
            setShowResetPasswordModal(false);
            setResetTarget(null);
            setNewPassword('');
          }}
          onSubmit={handleResetPassword}
          submitLabel="Salvar senha"
        >
          <div className="form-group">
            <label htmlFor="newPassword">Nova senha</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
            />
          </div>
        </Modal>

        <Modal
          isOpen={showModal}
          title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Atualizar' : 'Criar'}
        >
          <form className="space-y-4">
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Dr. João Silva"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ex: joao@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Cargo</label>
              <select name="role" id="role" value={formData.role} onChange={handleInputChange}>
                <option value="funcionario">Funcionário</option>
                <option value="medico">Médico</option>
                <option value="enfermeiro">Enfermeiro</option>
                <option value="recepcionista">Recepcionista</option>
                <option value="ADM">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="especialidade">Especialidade</label>
              <input
                id="especialidade"
                type="text"
                name="especialidade"
                value={formData.especialidade}
                onChange={handleInputChange}
                placeholder="Ex: Cardiologia"
              />
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

export default ManageFuncionarios;
