import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/': 'Dashboard',
  '/cartoes': 'Cartões',
  '/agendamentos': 'Agendamentos',
  '/funcionarios': 'Funcionários',
  '/relatorios': 'Relatórios',
  '/perfil': 'Perfil',
  '/admin': 'Dashboard Admin',
  '/admin/funcionarios': 'Gerenciar Funcionários',
  '/admin/agendas': 'Gerenciar Agendas',
  '/admin/cartoes': 'Controle de Cartões',
  '/admin/relatorios': 'Relatórios',
};

function Header({ isMenuOpen, onMenuClick }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Espaço Vida';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout-header layout-header-no-logo">
      <button
        className="mobile-menu-button"
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menu"
        aria-expanded={isMenuOpen}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="layout-header-title">
        <span className={`environment-pill ${isAdmin ? 'environment-pill-admin' : 'environment-pill-client'}`}>
          {isAdmin ? 'Ambiente administrativo' : 'Área do cliente'}
        </span>
        <h2>{title}</h2>
        <p>Bem-vindo, {user?.usuario?.nome || 'Usuário'}</p>
      </div>
      <button className="logout-button" onClick={handleLogout}>
        Sair
      </button>
    </div>
  );
}

export default Header;
