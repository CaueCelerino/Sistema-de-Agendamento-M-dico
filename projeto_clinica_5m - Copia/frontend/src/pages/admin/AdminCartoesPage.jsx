import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  activateAdminCard,
  deactivateAdminCard,
  listAdminCards,
  updateAdminCard,
} from '../../services/adminCartoesService';
import adminService from '../../services/adminService';
import api from '../../services/api';


function statusVariant(status) {
  return status === 'ATIVO' ? 'success' : 'danger';
}

function AdminCartoesPage() {
  const [cartoes, setCartoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCard, setNewCard] = useState({
    clienteNome: '',
    email: '',
    identificacao: '',
    tipo: 'Individual',
    criadoEm: new Date().toISOString().slice(0, 10),
    validade: '',
    status: 'ATIVO',
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [editCard, setEditCard] = useState(null);
  const [editForm, setEditForm] = useState({
    clienteNome: '',
    email: '',
    identificacao: '',
    tipo: 'Individual',
    validade: '',
    senha: '',
  });

  const [resetPasswordAction, setResetPasswordAction] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetCredentials, setResetCredentials] = useState(null);


  useEffect(() => {
    async function loadCards() {
      try {
        const data = await listAdminCards();
        // Normalize backend response to include `clienteNome` for display.
        const normalized = (data.cartoes || []).map((c) => ({
          ...c,
          clienteNome: c.clienteNome || c.usuario_nome || c.nome || c.nome_cartao || null,
          identificacao: c.identificacao || c.nome_cartao || c.id,
          criadoEm: c.criadoEm || c.data_entrada || c.created_at || '',
          validade: c.validade || c.data_saida || '',
        }));

        setCartoes(normalized);
        setUsingFallback(Boolean(data.usingFallback));
      } catch {
        setError('Não foi possível carregar os cartões administrativos.');
      } finally {
        setLoading(false);
      }
    }

    loadCards();
  }, []);

  async function handleConfirmStatusChange() {
    if (!confirmAction) return;

    const nextStatus = confirmAction.type === 'activate' ? 'ATIVO' : 'DESATIVADO';
    if (confirmAction.type === 'activate') {
      await activateAdminCard(confirmAction.cartao.id);
    } else {
      await deactivateAdminCard(confirmAction.cartao.id);
    }

    setCartoes((current) =>
      current.map((item) =>
        item.id === confirmAction.cartao.id ? { ...item, status: nextStatus } : item
      )
    );
    setConfirmAction(null);
  }

  async function handleSaveEditCard() {
    if (!editCard?.id) return;

    try {
      const payload = {
        clienteNome: editForm.clienteNome,
        email: editForm.email,
        identificacao: editForm.identificacao,
        tipo: editForm.tipo,
        validade: editForm.validade,
        ...(editForm.senha ? { senha: editForm.senha } : {}),
      };

      if (editCard.localOnly) {
        const updatedCard = {
          ...editCard,
          clienteNome: editForm.clienteNome,
          email: editForm.email,
          identificacao: editForm.identificacao,
          tipo: editForm.tipo,
          validade: editForm.validade,
        };

        setCartoes((current) => current.map((item) => (item.id === editCard.id ? updatedCard : item)));
        if (editForm.senha && editCard.usuario_id) {
          await adminService.resetarSenhaUsuario(editCard.usuario_id, editForm.senha);
        }

        setEditCard(null);
        setError('');
        return;
      }

      const response = await updateAdminCard(editCard.id, payload);
      const updatedCard = {
        ...editCard,
        ...response.cartao,
        clienteNome: response.usuario?.nome || response.cartao?.usuario_nome || editForm.clienteNome,
        email: response.usuario?.email || response.cartao?.usuario_email || editForm.email,
        identificacao: response.cartao?.nome_cartao || editForm.identificacao,
        tipo: response.cartao?.tipo_servico || editForm.tipo,
        validade: response.cartao?.data_saida || editForm.validade,
        usuario_id: response.cartao?.usuario_id || editCard.usuario_id,
      };

      setCartoes((current) => current.map((item) => (item.id === editCard.id ? updatedCard : item)));
      setEditCard(null);
      setError('');
    } catch (e) {
      const backendMessage = e?.response?.data?.error || e?.message;
      setError(`Não foi possível salvar as alterações do cliente. ${backendMessage || ''}`.trim());
    }
  }

  async function handleCreateCard() {
    const email = String(newCard.email || '').trim();
    if (!email) {
      setError('Email do cliente é obrigatório.');
      return;
    }

    if (!newCard.clienteNome || !String(newCard.clienteNome).trim()) {
      setError('Nome do cliente é obrigatório.');
      return;
    }

    const randomPwd = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 90 + 10);

    try {
      // Cria a conta do cliente
      const registerRes = await api.post('/auth/register', {
        email,
        senha: randomPwd,
        nome: newCard.clienteNome || email.split('@')[0],
      });

      setCreatedCredentials({
        email,
        senha: randomPwd,
        usuario: registerRes.data.usuario,
      });

      // Cria o cartão no banco
      // OBS: os endpoints de criação/edição de cartoes ainda não existem no backend desse projeto.
      // Por enquanto, mantemos o fallback visual local; a conta já fica criada.
      const fallbackCard = {
        id: Date.now(),
        usuario_id: registerRes.data.usuario?.id,
        clienteNome: newCard.clienteNome,
        identificacao: newCard.identificacao || `EV-${Date.now()}`,
        tipo: newCard.tipo,
        criadoEm: newCard.criadoEm,
        validade: newCard.validade || 'A definir',
        status: newCard.status,
        email,
        telefone: null,
        nome_cartao: newCard.identificacao || `EV-${Date.now()}`,
        localOnly: true,
      };

      setCartoes((current) => [fallbackCard, ...current]);
      setShowCreateModal(false);
      setError('');
      setNewCard({
        clienteNome: '',
        email: '',
        identificacao: '',
        tipo: 'Individual',
        criadoEm: new Date().toISOString().slice(0, 10),
        validade: '',
        status: 'ATIVO',
      });
    } catch (e) {
      setCreatedCredentials({
        email,
        senha: randomPwd,
        error: 'Falha ao criar conta (pode já existir).',
      });
    }
  }


  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Controle de Cartões</h1>
          <p>Gerencie cartões de clientes, renovações anuais, cancelamentos e reativações.</p>
        </section>

        {resetCredentials?.error && <p className="text-error">{resetCredentials.error}</p>}
        {createdCredentials?.error && <p className="text-error">{createdCredentials.error}</p>}


        {usingFallback && (
          <p className="fallback-note">
            Dados temporários de frontend. Integração futura sugerida em /admin/cartoes.
          </p>
        )}
        {error && <p className="text-error">{error}</p>}

        <div className="hero-grid funcionarios-grid">
          <section className="small-card" aria-labelledby="admin-cards-title">
            <div className="calendar-header-row">
              <h3 id="admin-cards-title">Cartões de clientes</h3>
              <button className="button button-primary" type="button" onClick={() => setShowCreateModal(true)}>
                + Registrar cartão
              </button>
            </div>
            {loading ? (
              <p>Carregando cartões...</p>
            ) : cartoes.length === 0 ? (
              <p>Nenhum cartão encontrado.</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Cartão</th>
                      <th>Status</th>
                      <th>Criação</th>
                      <th>Validade</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartoes.map((cartao) => (
                      <tr key={cartao.id}>
                        <td>{cartao.clienteNome}</td>
                        <td>
                          <strong>{cartao.identificacao}</strong>
                          <br />
                          <span>{cartao.tipo}</span>
                        </td>
                        <td>
                          <Badge text={cartao.status} variant={statusVariant(cartao.status)} />
                        </td>
                        <td>{cartao.criadoEm}</td>
                        <td>{cartao.validade}</td>
                        <td>
                          <div className="table-actions">
                            <button className="link-button" type="button" onClick={() => setSelectedCard(cartao)}>
                              Detalhes
                            </button>
                            <button
                              className="link-button"
                              type="button"
                              disabled={cartao.localOnly}
                              title={cartao.localOnly ? 'Cartão criado localmente e não pode ser editado no backend.' : undefined}
                              onClick={() => {
                                setEditCard(cartao);
                                setEditForm({
                                  clienteNome: cartao.clienteNome || cartao.usuario_nome || cartao.nome_cartao || '',
                                  email: cartao.email || cartao.usuario_email || '',
                                  identificacao: cartao.identificacao || cartao.nome_cartao || '',
                                  tipo: cartao.tipo || cartao.tipo_servico || 'Individual',
                                  validade: cartao.validade || '',
                                  senha: '',
                                });
                              }}
                            >
                              Editar
                            </button>


                            {cartao.status === 'ATIVO' ? (
                              <button
                                className="link-button link-button-danger"
                                type="button"
                                onClick={() => setConfirmAction({ type: 'deactivate', cartao })}
                              >
                                Desativar
                              </button>
                            ) : (
                              <button
                                className="link-button"
                                type="button"
                                onClick={() => setConfirmAction({ type: 'activate', cartao })}
                              >
                                Ativar
                              </button>
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
        </div>

        <Modal
          isOpen={Boolean(selectedCard)}
          title="Detalhes do cartão"
          onClose={() => setSelectedCard(null)}
          onSubmit={() => setSelectedCard(null)}
          submitLabel="Fechar"
        >
          {selectedCard && (
            <div className="detail-grid">
              <div className="detail-item"><span>Cliente</span><strong>{selectedCard.clienteNome}</strong></div>
              <div className="detail-item"><span>Identificação</span><strong>{selectedCard.identificacao}</strong></div>
              <div className="detail-item"><span>Status</span><strong>{selectedCard.status}</strong></div>
              <div className="detail-item"><span>Validade</span><strong>{selectedCard.validade}</strong></div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="link-button"
                  type="button"
                  onClick={() => {
                    setEditCard(selectedCard);
                    setEditForm({
                      clienteNome: selectedCard.clienteNome || '',
                      email: selectedCard.email || '',
                      identificacao: selectedCard.identificacao || selectedCard.nome_cartao || '',
                      tipo: selectedCard.tipo || selectedCard.tipo_servico || 'Individual',
                      validade: selectedCard.validade || '',
                      senha: '',
                    });
                  }}
                >
                  Editar dados
                </button>

                <button
                  className="link-button"
                  type="button"
                  onClick={() => {
                    setResetPasswordAction(selectedCard);
                    setNewPassword('');
                    setResetCredentials(null);
                  }}
                >
                  Alterar senha
                </button>
              </div>
            </div>
          )}
        </Modal>


        <Modal
          isOpen={Boolean(confirmAction)}
          title={confirmAction?.type === 'activate' ? 'Ativar cartão' : 'Desativar cartão'}
          onClose={() => setConfirmAction(null)}
          onSubmit={handleConfirmStatusChange}
          submitLabel={confirmAction?.type === 'activate' ? 'Ativar' : 'Desativar'}
        >
          <p>
            Confirme a alteração do cartão <strong>{confirmAction?.cartao.identificacao}</strong> de{' '}
            <strong>{confirmAction?.cartao.clienteNome}</strong>.
          </p>
        </Modal>

        <Modal
          isOpen={showCreateModal}
          title="Registrar cartão"
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCard}
          submitLabel="Registrar"
        >
          <div className="form-grid">
            <label>Cliente<input value={newCard.clienteNome} onChange={(event) => setNewCard({ ...newCard, clienteNome: event.target.value })} /></label>
            <label>Email do cliente<input value={newCard.email} onChange={(event) => setNewCard({ ...newCard, email: event.target.value })} placeholder="cliente@dominio.com" /></label>

            <label>Identificação do cartão<input value={newCard.identificacao} onChange={(event) => setNewCard({ ...newCard, identificacao: event.target.value })} /></label>
            <label>Tipo do cartão<select value={newCard.tipo} onChange={(event) => setNewCard({ ...newCard, tipo: event.target.value })}>
              <option>Individual</option>
              <option>Familiar</option>
              <option>Empresarial</option>
              <option>Dependente</option>
            </select></label>
            <label>Data de criação<input type="date" value={newCard.criadoEm} onChange={(event) => setNewCard({ ...newCard, criadoEm: event.target.value })} /></label>
            <label>Data de validade/renovação<input type="date" value={newCard.validade} onChange={(event) => setNewCard({ ...newCard, validade: event.target.value })} /></label>
            <label>Status inicial<select value={newCard.status} onChange={(event) => setNewCard({ ...newCard, status: event.target.value })}>
              <option value="ATIVO">Ativo</option>
              <option value="DESATIVADO">Desativado</option>
            </select></label>
          </div>
        </Modal>

        <Modal
          isOpen={Boolean(createdCredentials)}
          title="Conta do cliente criada"
          onClose={() => setCreatedCredentials(null)}
          onSubmit={() => setCreatedCredentials(null)}
          submitLabel="Fechar"
        >
          {createdCredentials && (
            <div className="form-grid">
              <div className="detail-item"><span>Email</span><strong>{createdCredentials.email}</strong></div>
              <div className="detail-item"><span>Senha temporária</span><strong>{createdCredentials.senha}</strong></div>
              {createdCredentials.error && <p className="form-error">{createdCredentials.error}</p>}
              {!createdCredentials.error && (
                <p>Oriente o cliente a alterar a senha na área do perfil após o primeiro acesso.</p>
              )}
            </div>
          )}
        </Modal>

        <Modal
          isOpen={Boolean(editCard)}
          title="Editar dados do cliente"
          onClose={() => setEditCard(null)}
          onSubmit={handleSaveEditCard}
          submitLabel="Salvar"
        >
          {editCard && (
            <div className="form-grid">
              <label>
                Nome do cliente
                <input value={editForm.clienteNome} onChange={(e) => setEditForm((prev) => ({ ...prev, clienteNome: e.target.value }))} />
              </label>
              <label>
                Email
                <input value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
              </label>
              <label>
                Identificação do cartão
                <input value={editForm.identificacao} onChange={(e) => setEditForm((prev) => ({ ...prev, identificacao: e.target.value }))} />
              </label>
              <label>
                Tipo do cartão
                <select value={editForm.tipo} onChange={(e) => setEditForm((prev) => ({ ...prev, tipo: e.target.value }))}>
                  <option>Individual</option>
                  <option>Familiar</option>
                  <option>Empresarial</option>
                  <option>Dependente</option>
                </select>
              </label>
              <label>
                Validade/renovação
                <input type="date" value={editForm.validade} onChange={(e) => setEditForm((prev) => ({ ...prev, validade: e.target.value }))} />
              </label>
              <label>
                Nova senha do cliente
                <input
                  type="password"
                  value={editForm.senha}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, senha: e.target.value }))}
                  placeholder="Deixe em branco para manter a mesma senha"
                />
              </label>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={Boolean(resetPasswordAction)}
          title="Alterar senha do cliente"
          onClose={() => setResetPasswordAction(null)}
          onSubmit={async () => {
            if (!resetPasswordAction?.usuario_id) {
              setResetCredentials({ error: 'Não foi possível localizar o cliente para alterar a senha.' });
              return;
            }
            try {
              await adminService.resetarSenhaUsuario(resetPasswordAction.usuario_id, newPassword);
              setResetCredentials({ message: 'Senha alterada com sucesso.' });
            } catch (e) {
              setResetCredentials({ error: 'Falha ao alterar senha.' });
            }
          }}
          submitLabel="Alterar"
          submitDisabled={!newPassword}
        >
          {resetPasswordAction && (
            <div className="form-grid">
              <div className="detail-item"><span>Cliente</span><strong>{resetPasswordAction.clienteNome || resetPasswordAction.nome_cartao || 'Cliente'}</strong></div>
              <div className="detail-item"><span>Email</span><strong>{resetPasswordAction.email || resetPasswordAction.usuario_email || ''}</strong></div>

              <label>
                Nova senha
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Digite uma senha" />
              </label>

              <div>
                {resetCredentials?.message && <p className="form-success">{resetCredentials.message}</p>}
                {resetCredentials?.error && <p className="form-error">{resetCredentials.error}</p>}
              </div>
            </div>
          )}
        </Modal>

      </div>
    </Layout>
  );
}

export default AdminCartoesPage;
