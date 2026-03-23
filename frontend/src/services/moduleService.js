import apiClient from './apiClient';

export const moduleService = {
  getAll: (params) => apiClient.get('/api/modules', { params }),
  create: (payload) => apiClient.post('/api/modules', payload),
  update: (id, payload) => apiClient.put(`/api/modules/${id}`, payload),
  remove: (id) => apiClient.delete(`/api/modules/${id}`)
};
