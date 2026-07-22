import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/userService';
import { changePassword } from '../services/userService';

function PerfilPage() {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState(user?.usuario?.nome || '');
  const [email, setEmail] = useState(user?.usuario?.email || '');
  const [telefone, setTelefone] = useState(user?.usuario?.telefone || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setNome(data.usuario?.nome || nome);
        setEmail(data.usuario?.email || email);
        setTelefone(data.usuario?.telefone || telefone);
      } catch {
        setError('Não foi possível carregar seu perfil.');
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateProfile({ nome, telefone });
      updateAuthProfile({ nome: updated.usuario?.nome, telefone: updated.usuario?.telefone });
      setSuccess('Perfil atualizado com sucesso.');
    } catch {
      setError('Falha ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');

    try {
      await changePassword(currentPwd, newPwd);
      setPwdSuccess('Senha alterada com sucesso.');
      setCurrentPwd('');
      setNewPwd('');
    } catch (err) {
      setPwdError('Falha ao alterar senha. Verifique a senha atual e tente novamente.');
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <section className="hero-card">
          <h1>Perfil</h1>
          <p>Atualize suas informações pessoais e preferências.</p>
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <form onSubmit={handleSubmit} className="profile-form">
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input label="Email" type="email" value={email} disabled />
            <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <div style={{ display: 'flex', gap: 12 }}>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              <Button type="button" onClick={() => navigate('/agendamentos')}>
                Iniciar agendamento
              </Button>
            </div>
          </form>

          <hr />

          <h3>Alterar senha</h3>
          {pwdError && <p className="form-error">{pwdError}</p>}
          {pwdSuccess && <p className="form-success">{pwdSuccess}</p>}
          <form onSubmit={handleChangePassword} className="profile-form">
            <Input label="Senha atual" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required />
            <Input label="Nova senha" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
            <Button type="submit" disabled={pwdLoading}>
              {pwdLoading ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </form>
        </section>
      </div>
    </Layout>
  );
}

export default PerfilPage;
