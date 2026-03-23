import { createContext, useContext, useMemo, useState } from 'react';
import { ROLES } from '../constants/roles';
import { authMockService } from '../services/authMockService';
import { normalizeRole } from '../utils/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const current = authMockService.getUser();
    const normalizedRole = normalizeRole(current.role || ROLES.STUDENT);
    const next = { ...current, role: normalizedRole };
    authMockService.ensureToken(normalizedRole);
    authMockService.saveUser(next);
    return next;
  });

  const updateProfile = (updates) => {
    const next = { ...user, ...updates };
    setUser(next);
    authMockService.saveUser(next);
  };

  const switchRole = (role) => {
    const normalizedRole = normalizeRole(role);
    const next = { ...user, role: normalizedRole };
    setUser(next);
    authMockService.saveUser(next);
    localStorage.setItem('token', `mock-${normalizedRole}`);
  };

  const logout = () => {
    authMockService.logout();
  };

  const value = useMemo(() => ({
    user,
    updateProfile,
    switchRole,
    logout
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
