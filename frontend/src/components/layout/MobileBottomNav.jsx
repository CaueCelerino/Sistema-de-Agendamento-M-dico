import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function MobileBottomNav() {
  const { isAdmin } = useAuth();

  const items = isAdmin
    ? [
        { to: '/admin', label: 'Painel', icon: '⌂' },
        { to: '/admin/agendas', label: 'Agenda', icon: '🗓' },
        { to: '/admin/cartoes', label: 'Cartões', icon: '💳' },
        { to: '/admin/funcionarios', label: 'Equipe', icon: '👥' },
      ]
    : [
        { to: '/', label: 'Início', icon: '⌂' },
        { to: '/agendamentos', label: 'Agenda', icon: '🗓' },
        { to: '/cartoes', label: 'Cartões', icon: '💳' },
        { to: '/perfil', label: 'Perfil', icon: '👤' },
      ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegação rápida">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-bottom-nav__item ${isActive ? 'mobile-bottom-nav__item--active' : ''}`}>
          <span className="mobile-bottom-nav__icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileBottomNav;
