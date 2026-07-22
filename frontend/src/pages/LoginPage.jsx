import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole, getRoleFromSession } from '../utils/authz';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role, loginSession } = useAuth();

  useEffect(() => {
    if (user?.token) {
      navigate(getHomeRouteForRole(role), { replace: true });
    }
  }, [navigate, role, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, senha);
      const normalized = loginSession(data);
      const nextRole = getRoleFromSession(normalized);
      navigate(getHomeRouteForRole(nextRole), { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const backendError = err?.response?.data?.error || err?.response?.data?.message;

      if (status === 401) {
        setError('E-mail ou senha inválidos. Verifique suas credenciais.');
      } else if (backendError) {
        setError(backendError);
      } else if (err?.message?.includes('Network')) {
        setError('Não foi possível conectar à clínica. Verifique sua conexão e tente novamente.');
      } else {
        setError('Falha ao entrar. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-login">
      <div className="login-shell">
        <section className="login-preview" aria-label="Resumo da clínica">
          <div className="login-preview__pill">Espaço Vida • Clínica digital</div>
          <h1>Acesso rápido ao Espaço Vida</h1>
          <p>Agende, acompanhe e converse com a equipe em um só lugar.</p>
          <ul>
            <li>Gerencie consultas com praticidade</li>
            <li>Veja seu histórico e orientações</li>
            <li>Receba mensagens da equipe clínica</li>
          </ul>
        </section>

        <div className="login-card">
          <div className="login-branding-text">
            <h2>Bem-vindo ao Espaço Vida</h2>
            <p>Faça login para acessar sua clínica digital com segurança.</p>
          </div>
          <form onSubmit={handleSubmit} aria-describedby="login-error" noValidate>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
              aria-required="true"
            />

            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="********"
              required
              aria-required="true"
            />

            {error && (
              <p id="login-error" className="form-error" role="alert" aria-live="assertive">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} aria-busy={loading} className="button button-primary">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
