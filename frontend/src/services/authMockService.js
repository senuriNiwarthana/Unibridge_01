import { ROLES } from '../constants/roles';

const defaultUser = {
  id: 'u-student',
  firstName: 'Study',
  lastName: 'Student',
  role: ROLES.STUDENT,
  phone: '',
  bio: ''
};

export const authMockService = {
  getUser: () => {
    const stored = localStorage.getItem('unibridge_user');
    if (!stored) return defaultUser;
    try {
      return JSON.parse(stored);
    } catch {
      return defaultUser;
    }
  },
  saveUser: (user) => {
    localStorage.setItem('unibridge_user', JSON.stringify(user));
  },
  ensureToken: (role = ROLES.STUDENT) => {
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', `mock-${role}`);
    }
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};
