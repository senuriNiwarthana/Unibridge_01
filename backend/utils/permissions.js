const privilegedRoles = ['admin', 'studyMaterialsManager', 'coordinator'];

const normalizeRole = (role) => {
  const value = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  if (value === 'admin') return 'admin';
  if (value === 'coordinator') return 'coordinator';
  if (value === 'student') return 'student';
  if (['studymaterialsmanager', 'materialsmanager', 'manager', 'studymaterialmanager'].includes(value)) {
    return 'studyMaterialsManager';
  }

  return role;
};

const canManage = (role) => privilegedRoles.includes(normalizeRole(role));

const canEditMaterial = (user, material) => {
  if (!user || !material) return false;
  return normalizeRole(user.role) === 'admin' || user.id === material.ownerId;
};

module.exports = {
  privilegedRoles,
  normalizeRole,
  canManage,
  canEditMaterial
};
