const jwt = require('jsonwebtoken');
const { isAdminRole, normalizeRole } = require('../utils/authz');

const JWT_SECRET = process.env.JWT_SECRET || 'clinica-5m-dev-secret';

// Debug: permite chamadas em ambiente local sem token
// (mantém o comportamento original quando não estiver setado).
const ALLOW_LOCAL_NO_AUTH = process.env.ALLOW_LOCAL_NO_AUTH === '1';


function parseLegacyToken(token) {
  const parts = String(token || '').split(':');
  if (parts.length !== 3) return null;

  const [, rawRole, rawUserId] = parts;
  const userId = Number(rawUserId);
  if (!Number.isFinite(userId)) return null;

  return {
    role: normalizeRole(rawRole),
    userId,
  };
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    if (ALLOW_LOCAL_NO_AUTH) {
      req.auth = { userId: 1, role: 'ADM', token: null };
      return next();
    }
    return res.status(401).json({ error: 'Token ausente ou inválido' });
  }


  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = {
      userId: Number(payload.sub || payload.userId || payload.id),
      role: normalizeRole(payload.role),
      staffAccess: Boolean(payload.staffAccess),
      token,
    };

    return next();
  } catch (jwtErr) {
    const legacySession = parseLegacyToken(token);
    if (!legacySession) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.auth = legacySession;
    return next();
  }
}

function requireAdmin(req, res, next) {
  const role = req.auth?.role;

  if (!isAdminRole(role)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
