import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { user, isAdmin, staffAccess, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && user.token && !isAdmin && typeof logout === 'function') {
      logout();
    }
  }, [isAdmin, logout, user]);

  if (user && user.token && !isAdmin) return <Navigate to="/login" replace />;

  if (!user) return <Navigate to="/login" replace />;

  if (staffAccess && location.pathname.startsWith('/admin/funcionarios')) {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}


export default AdminRoute;
