import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole } from '../utils/authz';

function AdminRoute({ children }) {
  const { user, isAdmin, role, logout } = useAuth();

  // Se token existir mas role não for admin, força logout para evitar chamadas com token inválido
  // (isso costuma causar 401/403 em telas específicas).
  if (user && user.token && !isAdmin) {
    if (typeof logout === 'function') logout();
    return <Navigate to="/login" replace />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}


export default AdminRoute;
