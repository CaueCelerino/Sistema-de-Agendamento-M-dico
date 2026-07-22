import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomeRouteForRole } from '../../utils/authz';

function Sidebar({ isOpen = false, onClose, onNavigate }) {
  const { role, isAdmin, staffAccess, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/cartoes', label: 'Cartões' },
    { path: '/agendamentos', label: 'Agendamentos' },
    { path: '/perfil', label: 'Perfil' },
  ];

  const adminLinks = [
    { path: '/admin/funcionarios', label: 'Funcionários' },
    { path: '/admin/agendas', label: 'Agendas' },
    { path: '/admin/cartoes', label: 'Cartões' },
    { path: '/admin/relatorios', label: 'Relatórios' },
  ];

  const filteredAdminLinks = staffAccess
    ? adminLinks.filter((item) => item.path !== '/admin/funcionarios')
    : adminLinks;

  const renderLink = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
      }
    >
      {item.label}
    </NavLink>
  );

  function handleLogout() {
    logout();
    onNavigate?.();
    navigate('/login');
  }

  function handleHomeClick() {
    onNavigate?.();
    navigate(getHomeRouteForRole(role));
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <button
          className="sidebar-close-button"
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <span />
          <span />
          <span />
        </button>
        <button className="sidebar-brand-text" type="button" onClick={handleHomeClick}>
          <span>Espaço Vida</span>
          <p className="sidebar-tagline">Nossa missão é cuidar de você</p>
        </button>
      </div>
      <nav className="sidebar-nav">
        {!isAdmin && links.map(renderLink)}

        {isAdmin && (
          <>
            <button
              className={`sidebar-link ${location.pathname === '/admin' ? 'sidebar-link-active' : ''}`}
              type="button"
              onClick={handleHomeClick}
            >
              Dashboard Admin
            </button>
            {filteredAdminLinks.map(renderLink)}
            {staffAccess && renderLink({ path: '/perfil', label: 'Perfil' })}
          </>
        )}

        <button className="sidebar-logout-button" type="button" onClick={handleLogout}>
          Sair
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
