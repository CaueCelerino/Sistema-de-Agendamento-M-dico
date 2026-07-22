import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole } from '../utils/authz';

function ProtectedRoute({ children }) {
  const { user, isAdmin, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to={getHomeRouteForRole(role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
