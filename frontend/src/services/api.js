import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized / expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid and not already on login
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('civicai_token');
        localStorage.removeItem('civicai_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API Service
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register/citizen', userData);
    return response.data;
  },
  registerCitizen: async (userData) => {
    const response = await api.post('/auth/register/citizen', userData);
    return response.data;
  },
  registerOfficer: async (officerData) => {
    const response = await api.post('/auth/register/officer', officerData);
    return response.data;
  },
  registerAdmin: async (adminData) => {
    const response = await api.post('/auth/register/admin', adminData);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

export const notificationService = {
  getAll: async (limit = 30) => {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  },
  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

// Grievance API Service
export const grievanceService = {
  create: async (grievanceData) => {
    const response = await api.post('/grievances', grievanceData);
    return response.data;
  },
  getMyGrievances: async (params = {}) => {
    const response = await api.get('/grievances/my', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/grievances/${id}`);
    return response.data;
  },
  update: async (id, updateData) => {
    const response = await api.patch(`/grievances/${id}`, updateData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/grievances/${id}`);
    return response.data;
  },
  reanalyze: async (id) => {
    const response = await api.post(`/grievances/${id}/analyze`);
    return response.data;
  },
  generateResolutionRecommendation: async (id) => {
    const response = await api.post(`/grievances/${id}/resolution-recommendation`);
    return response.data;
  },
  chatAssistant: async (messages) => {
    const response = await api.post('/grievances/assistant-chat', { messages });
    return response.data;
  },
};

// Admin API Service
export const adminService = {
  getStats: async (params = {}) => {
    const response = await api.get('/admin/stats', { params });
    return response.data;
  },
  getGrievances: async (params = {}) => {
    const response = await api.get('/admin/grievances', { params });
    return response.data;
  },
  getOfficers: async (params = {}) => {
    const queryParams = typeof params === 'string' ? { department: params } : params;
    const response = await api.get('/admin/officers', { params: queryParams });
    return response.data;
  },
  getOfficerById: async (id) => {
    const response = await api.get(`/admin/officers/${id}`);
    return response.data;
  },
  createOfficer: async (officerData) => {
    const response = await api.post('/admin/officers', officerData);
    return response.data;
  },
  updateOfficer: async (id, officerData) => {
    const response = await api.patch(`/admin/officers/${id}`, officerData);
    return response.data;
  },
  updateOfficerStatus: async (id, statusData) => {
    const response = await api.patch(`/admin/officers/${id}/status`, statusData);
    return response.data;
  },
  deleteOfficer: async (id) => {
    const response = await api.delete(`/admin/officers/${id}`);
    return response.data;
  },
  assignOfficer: async (id, { officerId, notes }) => {
    const response = await api.patch(`/admin/grievances/${id}/assign`, {
      officerId,
      notes,
    });
    return response.data;
  },
  updateStatus: async (id, { status, comment, remarks, actionTaken }) => {
    const response = await api.patch(`/admin/grievances/${id}/status`, {
      status,
      comment,
      remarks,
      actionTaken,
    });
    return response.data;
  },
  overrideGrievance: async (id, { category, department, priority, overrideReason }) => {
    const response = await api.patch(`/admin/grievances/${id}/override`, {
      category,
      department,
      priority,
      overrideReason,
    });
    return response.data;
  },
  reviewDuplicateDetection: async (id, { decision, comment = '' }) => {
    const response = await api.patch(`/admin/grievances/${id}/duplicate-review`, {
      decision,
      comment,
    });
    return response.data;
  },
};

// Officer API Service
export const officerService = {
  getStats: async () => {
    const response = await api.get('/officer/stats');
    return response.data;
  },
  getGrievances: async (params = {}) => {
    const response = await api.get('/officer/grievances', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/officer/grievances/${id}`);
    return response.data;
  },
  acceptAssignment: async (id, notes = '') => {
    const response = await api.patch(`/officer/grievances/${id}/accept`, { notes });
    return response.data;
  },
  startWork: async (id, { notes, estimatedCompletion } = {}) => {
    const response = await api.patch(`/officer/grievances/${id}/start`, {
      notes,
      estimatedCompletion,
    });
    return response.data;
  },
  addProgressNote: async (id, { note, image }) => {
    const response = await api.patch(`/officer/grievances/${id}/progress`, {
      note,
      image,
    });
    return response.data;
  },
  resolveGrievance: async (id, { actionTaken, remarks, resolutionProofImages }) => {
    const response = await api.patch(`/officer/grievances/${id}/resolve`, {
      actionTaken,
      remarks,
      resolutionProofImages,
    });
    return response.data;
  },
};

export default api;