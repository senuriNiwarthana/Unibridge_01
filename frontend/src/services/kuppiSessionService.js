import apiClient from './apiClient';

export const kuppiSessionService = {
  create: (payload) => apiClient.post('/api/kuppi-sessions', payload),
  getAll: (params) => apiClient.get('/api/kuppi-sessions', { params }),
  update: (id, payload) => apiClient.put(`/api/kuppi-sessions/${id}`, payload),
  remove: (id) => apiClient.delete(`/api/kuppi-sessions/${id}`)
};
