import { MANAGER_ROLES } from '../constants/roles';

export const normalizeRole = (role) => {
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

export const isManagerRole = (role) => MANAGER_ROLES.includes(normalizeRole(role));

export const canManageMaterials = (role) => isManagerRole(role);

export const canEditMaterial = (role, userId, ownerId) => normalizeRole(role) === 'admin' || userId === ownerId;
