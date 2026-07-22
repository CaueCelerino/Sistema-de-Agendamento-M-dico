import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole, getRoleFromSession } from '../utils/authz';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, role, loginSession } = useAuth();
  const [loading, setLoading] = useState(false);

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
      const role = getRoleFromSession(normalized);
      navigate(getHomeRouteForRole(role), { replace: true });
    } catch (err) {
      setError('Falha ao logar. Verifique email e senha.');
    }
    setLoading(false);
  }

  return (
    <div className="page-login">
      <div className="login-card">
        <div className="login-branding-text">
          <h2>Bem-vindo ao Espaço Vida</h2>
          <p>Faça login para acessar sua clínica digital com segurança.</p>
        </div>
        <form onSubmit={handleSubmit} aria-describedby="login-error" noValidate>
          <label htmlFor="email">Email</label>
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
  );
}

export default LoginPage;
