import apiClient from './apiClient';

export const studyMaterialService = {
  upload: (formData) => apiClient.post('/api/study-materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitForReview: (formData) => apiClient.post('/api/management/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getApproved: (params) => apiClient.get('/api/management/approved', { params }),
  getPending: (params) => apiClient.get('/api/management/pending', { params }),
  getCompleted: (params) => apiClient.get('/api/management/completed', { params }),
  getStats: () => apiClient.get('/api/management/stats'),
  getByModule: (name, params) => apiClient.get(`/api/management/module/${encodeURIComponent(name)}`, { params }),
  approve: (id, payload) => apiClient.put(`/api/management/${id}/approve`, payload),
  reject: (id, payload) => apiClient.put(`/api/management/${id}/reject`, payload),
  update: (id, payload) => apiClient.put(`/api/management/${id}`, payload),
  deleteManaged: (id) => apiClient.delete(`/api/management/${id}`),
  deleteOwned: (id) => apiClient.delete(`/api/study-materials/${id}`),
  download: (id) => apiClient.get(`/api/study-materials/${id}/download`, { responseType: 'blob' }),
  preview: (id) => apiClient.get(`/api/study-materials/${id}/preview`, { responseType: 'blob' })
};
