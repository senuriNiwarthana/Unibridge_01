const { privilegedRoles, normalizeRole } = require('../utils/permissions');

const fallbackUsers = {
  admin: {
    id: 'u-admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  studyMaterialsManager: {
    id: 'u-manager',
    firstName: 'Material',
    lastName: 'Manager',
    role: 'studyMaterialsManager'
  },
  coordinator: {
    id: 'u-coordinator',
    firstName: 'Course',
    lastName: 'Coordinator',
    role: 'coordinator'
  },
  student: {
    id: 'u-student',
    firstName: 'Student',
    lastName: 'User',
    role: 'student'
  }
};

const decodeToken = (token) => {
  if (!token) return null;
  if (token.startsWith('mock-')) {
    const role = normalizeRole(token.replace('mock-', ''));
    return fallbackUsers[role] || fallbackUsers.student;
  }

  try {
    const jwtPayload = token.split('.').length === 3 ? token.split('.')[1] : token;
    const normalizedBase64 = jwtPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = normalizedBase64 + '='.repeat((4 - (normalizedBase64.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(paddedBase64, 'base64').toString('utf-8'));

    const resolvedRole = normalizeRole(decoded?.role || decoded?.userRole || decoded?.roles?.[0]);
    const resolvedId = decoded?.id || decoded?.userId || decoded?.sub;

    if (resolvedRole && resolvedId) {
      return {
        id: resolvedId,
        firstName: decoded.firstName || 'User',
        lastName: decoded.lastName || '',
        role: resolvedRole
      };
    }
  } catch (_error) {
    return fallbackUsers.student;
  }

  return fallbackUsers.student;
};

const attachUser = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  req.user = decodeToken(token) || fallbackUsers.student;
  next();
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  return attachUser(req, res, next);
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!roles.includes(normalizeRole(req.user.role))) {
    return res.status(403).json({ message: 'Not authorized for this action' });
  }
  next();
};

const requireManagerRole = requireRole(...privilegedRoles);

module.exports = {
  attachUser,
  requireAuth,
  requireRole,
  requireManagerRole,
  fallbackUsers
};
