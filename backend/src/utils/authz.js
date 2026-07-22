function normalizeRole(role) {
  if (!role) return 'USER';

  const upper = String(role).trim().toUpperCase();

  if (upper === 'ADMIN') return 'ADM';
  if (upper === 'SUPERADMIN' || upper === 'SUPER-ADM') return 'SUPER_ADM';

  if (upper === 'ADM' || upper === 'SUPER_ADM' || upper === 'USER') {
    return upper;
  }

  return 'USER';
}

function isAdminRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'ADM' || normalized === 'SUPER_ADM';
}

module.exports = {
  normalizeRole,
  isAdminRole,
};
