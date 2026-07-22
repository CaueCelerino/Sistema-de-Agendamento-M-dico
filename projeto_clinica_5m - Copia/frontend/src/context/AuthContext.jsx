import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import {
  getRoleFromSession,
  isAdminRole,
  normalizeSessionPayload,
  getHomeRouteForRole,
} from '../utils/authz';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('espacoVida_user');
    if (!storedUser) return null;

    try {
      return normalizeSessionPayload(JSON.parse(storedUser));
    } catch {
      return null;
    }
  });

  const role = getRoleFromSession(user);
  const isAdmin = isAdminRole(role);

  useEffect(() => {
    if (user?.token) {
      api.defaults.headers.common.Authorization = `Bearer ${user.token}`;
      localStorage.setItem('espacoVida_user', JSON.stringify(user));
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem('espacoVida_user');
    }
  }, [user]);

  function loginSession(userInfo) {
    const normalized = normalizeSessionPayload(userInfo);
    setUser(normalized);
    return normalized;
  }

  function updateProfile(changes) {
    setUser((current) => {
      if (!current?.usuario) {
        return current;
      }

      const updatedUser = {
        ...current,
        usuario: {
          ...current?.usuario,
          ...changes,
          role: current?.usuario?.role,
        },
      };
      localStorage.setItem('espacoVida_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }

  function logout() {
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        loginSession,
        updateProfile,
        logout,
        getHomeRoute: () => getHomeRouteForRole(role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
