import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const leadService = {
  getAll: async (params = {}) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },
  
  updateStatus: async (id, status) => {
    const response = await api.put(`/leads/${id}/status`, { status });
    return response.data;
  },
  
  addNote: async (id, content) => {
    const response = await api.post(`/leads/${id}/notes`, { content });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  // Manual Trigger Refreshes (Cost Optimization)
  manuallyAudit: async (id, force = false) => {
    const response = await api.post(`/leads/${id}/audit${force ? '?force=true' : ''}`);
    return response.data;
  },

  manuallyGenerateAI: async (id) => {
    const response = await api.post(`/leads/${id}/generate-ai`);
    return response.data;
  },

  manuallyRegenerateAI: async (id) => {
    const response = await api.post(`/leads/${id}/regenerate-ai`);
    return response.data;
  },

  // Bulk Operations (Optimized Curation)
  bulkUpdateStatus: async (ids, status) => {
    const response = await api.post('/leads/bulk-status', { ids, status });
    return response.data;
  },

  bulkAddNote: async (ids, content) => {
    const response = await api.post('/leads/bulk-note', { ids, content });
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await api.post('/leads/bulk-delete', { ids });
    return response.data;
  }
};

export const searchService = {
  create: async (businessType, location) => {
    const response = await api.post('/search', { businessType, location });
    return response.data;
  },
  
  getStatus: async (id) => {
    const response = await api.get(`/search/status/${id}`);
    return response.data;
  },
  
  getHistory: async () => {
    const response = await api.get('/search/history');
    return response.data;
  }
};

export default api;
