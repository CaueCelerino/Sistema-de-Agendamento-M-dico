const ADMIN_ROLES = ['ADM', 'SUPER_ADM'];

export function normalizeRole(role) {
  if (!role) return 'USER';

  const upper = String(role).trim().toUpperCase();

  if (upper === 'ADMIN') return 'ADM';
  if (upper === 'SUPERADMIN' || upper === 'SUPER-ADM') return 'SUPER_ADM';
  if (upper === 'FUNCIONARIO') return 'ADM';

  if (upper === 'ADM' || upper === 'SUPER_ADM' || upper === 'USER') {
    return upper;
  }

  return 'USER';
}

export function getRoleFromSession(session) {
  return normalizeRole(session?.usuario?.role || session?.user?.role || session?.role);
}

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(normalizeRole(role));
}

export function isAdminSession(session) {
  return isAdminRole(getRoleFromSession(session));
}

export function getHomeRouteForRole(role) {
  return isAdminRole(role) ? '/admin' : '/';
}

export function normalizeSessionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const token = payload.token || null;
  const rawUsuario = payload.usuario || payload.user || payload;

  if (!rawUsuario || !token) {
    return null;
  }

  const usuario = {
    ...rawUsuario,
    role: normalizeRole(rawUsuario.role),
  };

  return {
    ...payload,
    token,
    usuario,
  };
}
