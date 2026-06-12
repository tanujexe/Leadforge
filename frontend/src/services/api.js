import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios Request Interceptor: Automatically inject bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (idToken) => {
    const response = await api.post('/auth/google-login', { idToken });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/auth/users/${id}`, data);
    return response.data;
  }
};

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
  
  updatePitch: async (id, customPitch) => {
    const response = await api.put(`/leads/${id}/pitch`, { customPitch });
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
  },

  // Trash & Recovery Actions (Admin Only)
  getTrash: async (params = {}) => {
    const response = await api.get('/leads/trash', { params });
    return response.data;
  },

  restore: async (id) => {
    const response = await api.post(`/leads/trash/${id}/restore`);
    return response.data;
  },

  purge: async (id) => {
    const response = await api.delete(`/leads/trash/${id}/purge`);
    return response.data;
  },

  bulkRestore: async (ids) => {
    const response = await api.post('/leads/trash/bulk-restore', { ids });
    return response.data;
  },

  bulkPurge: async (ids) => {
    const response = await api.post('/leads/trash/bulk-purge', { ids });
    return response.data;
  },

  // CRM & Activity
  getActivity: async (id) => {
    const response = await api.get(`/leads/${id}/activity`);
    return response.data;
  },

  logCall: async (id, callOutcome, details, followUpDate) => {
    const response = await api.post(`/leads/${id}/call`, { callOutcome, details, followUpDate });
    return response.data;
  },

  assignLead: async (id, userId) => {
    const response = await api.post(`/leads/${id}/assign`, { userId });
    return response.data;
  },

  updateActivity: async (id, logId, data) => {
    const response = await api.put(`/leads/${id}/activity/${logId}`, data);
    return response.data;
  },

  deleteActivity: async (id, logId) => {
    const response = await api.delete(`/leads/${id}/activity/${logId}`);
    return response.data;
  }
};

export const searchService = {
  create: async (businessType, location, limit) => {
    const response = await api.post('/search', { businessType, location, limit });
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

export const managementService = {
  getAnalytics: async () => {
    const response = await api.get('/management/analytics');
    return response.data;
  },
  getProductivity: async () => {
    const response = await api.get('/management/productivity');
    return response.data;
  },
  getTimeline: async () => {
    const response = await api.get('/management/timeline');
    return response.data;
  },
  getSchedule: async () => {
    const response = await api.get('/management/schedule');
    return response.data;
  }
};

export default api;

