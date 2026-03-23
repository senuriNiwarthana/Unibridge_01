import apiClient from './apiClient';

export const kuppiSessionService = {
  create: (payload) => apiClient.post('/api/kuppi-sessions', payload),
  getAll: (params) => apiClient.get('/api/kuppi-sessions', { params })
};
