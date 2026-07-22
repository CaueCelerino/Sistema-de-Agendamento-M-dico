import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AppDialog from '../../components/ui/AppDialog';
import adminService from '../../services/adminService';

function ManageFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const defaultRoleName = 'MEDICO';
  const [showModal, setShowModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [dialogState, setDialogState] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [novoCargo, setNovoCargo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: '',
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

  const loadCargos = async () => {
    try {
      const data = await adminService.getCargos();
      const normalized = (data.cargos || []).map((item) => String(item.nome).toUpperCase()).filter(Boolean);
      setCargos(normalized);
      setFormData((current) => {
        const currentRole = String(current.role || '').trim().toUpperCase();
        if (currentRole && normalized.includes(currentRole)) {
          return current;
        }
        return { ...current, role: normalized[0] || defaultRoleName };
      });
      return normalized;
    } catch (err) {
      console.error('Failed to load cargos', err);
      setFormData((current) => ({ ...current, role: current.role || defaultRoleName }));
      return [];
    }
  };

  useEffect(() => {
    loadFuncionarios();
    loadCargos();
  }, []);

  const handleOpenModal = (func = null) => {
    if (func) {
      setEditingId(func.id);
      setFormData({
        nome: func.nome,
        email: func.email,
        role: String(func.role || '').toUpperCase(),
        especialidade: func.especialidade || ''
      });
    } else {
      setEditingId(null);
      const roleToUse = String(cargos[0] || '').trim().toUpperCase() || defaultRoleName;
      setFormData({
        nome: '',
        email: '',
        role: roleToUse,
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

  const showDialog = (title, message, options = {}) => {
    setDialogState({
      title,
      message,
      onClose: () => setDialogState(null),
      ...options,
    });
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      showDialog('Atenção', 'Nome e email são obrigatórios.');
      return;
    }

    const roleToUse = String(formData.role || '').trim().toUpperCase() || defaultRoleName;
    if (!roleToUse) {
      showDialog('Atenção', 'Selecione um cargo válido.');
      return;
    }

    try {
      if (!editingId && !cargos.includes(roleToUse)) {
        await adminService.createCargo(roleToUse);
        await loadCargos();
      }

      const payload = { ...formData, role: roleToUse };

      if (editingId) {
        await adminService.updateFuncionario(editingId, payload);
      } else {
        const created = await adminService.createFuncionario(payload);
        if (created?.credenciais) {
          setCreatedCredentials({
            email: created.credenciais.email,
            senhaTemporaria: created.credenciais.senhaTemporaria,
          });
        }
      }
      handleCloseModal();
      await loadFuncionarios();
    } catch (err) {
      console.error('Failed to save funcionario', err);
      showDialog('Erro', 'Erro ao salvar: ' + (err.message || 'Tente novamente'));
    }
  };

  const handleDelete = async (id) => {
    showDialog('Confirmar remoção', 'Tem certeza que deseja remover este funcionário?', {
      confirmLabel: 'Remover',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await adminService.deleteFuncionario(id);
          await loadFuncionarios();
          setDialogState(null);
        } catch (err) {
          console.error('Failed to delete funcionario', err);
          showDialog('Erro', 'Erro ao remover: ' + (err.message || 'Tente novamente'));
        }
      },
    });
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) {
      showDialog('Atenção', 'Informe uma nova senha.');
      return;
    }

    try {
      await adminService.resetarSenhaUsuario(resetTarget.id, newPassword.trim());
      setShowResetPasswordModal(false);
      setResetTarget(null);
      setNewPassword('');
      showDialog('Sucesso', 'Senha redefinida com sucesso.');
    } catch (err) {
      showDialog('Erro', 'Erro ao redefinir senha: ' + (err.message || 'Tente novamente'));
    }
  };

  const handleCreateCargo = async () => {
    const nome = String(novoCargo || '').trim();
    if (!nome) {
      showDialog('Atenção', 'Informe um nome para o cargo.');
      return;
    }

    try {
      await adminService.createCargo(nome);
      setNovoCargo('');
      await loadCargos();
    } catch (err) {
      showDialog('Erro', 'Erro ao criar cargo: ' + (err?.response?.data?.error || err.message || 'Tente novamente'));
    }
  };

  const handleDeleteCargo = async (cargoNome) => {
    showDialog(`Excluir cargo ${cargoNome}`, `Deseja excluir o cargo ${cargoNome}?`, {
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const data = await adminService.getCargos();
          const cargo = (data.cargos || []).find((item) => String(item.nome).toUpperCase() === String(cargoNome).toUpperCase());
          if (!cargo?.id) {
            showDialog('Atenção', 'Cargo não encontrado.');
            return;
          }

          await adminService.deleteCargo(cargo.id);
          const updatedCargos = await loadCargos();
          setFormData((current) => {
            if (String(current.role).toUpperCase() !== String(cargoNome).toUpperCase()) {
              return current;
            }
            return { ...current, role: updatedCargos[0] || '' };
          });
          setDialogState(null);
        } catch (err) {
          showDialog('Erro', 'Erro ao excluir cargo: ' + (err?.response?.data?.error || err.message || 'Tente novamente'));
        }
      },
    });
  };

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Gerenciar Funcionários</h1>
          <p>Adicione, edite ou remova funcionários e gerencie permissões.</p>
        </section>

        {createdCredentials && (
          <p className="form-success">
            Conta de funcionário criada. Email: {createdCredentials.email} | Senha temporária: {createdCredentials.senhaTemporaria}
          </p>
        )}

        <div className="hero-grid funcionarios-grid">
          <Card title="Cargos">
            <p>Adicione e remova cargos disponíveis para novos funcionários.</p>
            <div className="form-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                placeholder="Ex: FISIOTERAPEUTA"
              />
              <Button variant="primary" onClick={handleCreateCargo}>Adicionar cargo</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {cargos.map((cargo) => (
                <button
                  key={cargo}
                  type="button"
                  className="slot-chip"
                  onClick={() => handleDeleteCargo(cargo)}
                  title="Clique para excluir este cargo"
                >
                  {cargo} ×
                </button>
              ))}
              {cargos.length === 0 && <p>Nenhum cargo cadastrado.</p>}
            </div>
          </Card>

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

        <AppDialog
          isOpen={Boolean(dialogState)}
          title={dialogState?.title || 'Atenção'}
          message={dialogState?.message || ''}
          onClose={dialogState?.onClose || (() => setDialogState(null))}
          onConfirm={dialogState?.onConfirm}
          confirmLabel={dialogState?.confirmLabel || 'Ok'}
          cancelLabel={dialogState?.cancelLabel || 'Fechar'}
          confirmVariant={dialogState?.confirmVariant || 'primary'}
        />

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
                {cargos.length === 0 ? (
                  <option value={defaultRoleName}>{defaultRoleName} (será criado automaticamente)</option>
                ) : (
                  cargos.map((cargo) => (
                    <option key={cargo} value={cargo}>{cargo}</option>
                  ))
                )}
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
