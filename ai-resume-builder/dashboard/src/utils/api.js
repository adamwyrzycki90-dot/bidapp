import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (currentPassword, newPassword) => 
    api.put('/auth/password', { currentPassword, newPassword })
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  
  // Employment
  addEmployment: (data) => api.post('/users/employment', data),
  updateEmployment: (id, data) => api.put(`/users/employment/${id}`, data),
  deleteEmployment: (id) => api.delete(`/users/employment/${id}`),
  
  // Education
  addEducation: (data) => api.post('/users/education', data),
  updateEducation: (id, data) => api.put(`/users/education/${id}`, data),
  deleteEducation: (id) => api.delete(`/users/education/${id}`),
  
  // Certifications
  addCertification: (data) => api.post('/users/certifications', data),
  deleteCertification: (id) => api.delete(`/users/certifications/${id}`),
  
  // Skills
  addSkill: (data) => api.post('/users/skills', data),
  deleteSkill: (id) => api.delete(`/users/skills/${id}`),
  
  // Additional Info
  addAdditional: (data) => api.post('/users/additional', data),
  deleteAdditional: (id) => api.delete(`/users/additional/${id}`),
  
  // Admin
  getAllUsers: () => api.get('/users/all'),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// CV API
export const cvAPI = {
  generate: (jobDescription, jdLink) => 
    api.post('/cv/generate', { jobDescription, jdLink }),
  preview: (jobDescription) => 
    api.post('/cv/preview', { jobDescription }),
  downloadDocUrl: (applicationId) => 
    `${API_BASE_URL}/cv/download/docx/${applicationId}`,
  downloadPdfUrl: (applicationId) => 
    `${API_BASE_URL}/cv/download/pdf/${applicationId}`
};

// Applications API
export const applicationsAPI = {
  getAll: (params = {}) => api.get('/applications', { params }),
  getStats: () => api.get('/applications/stats'),
  getOne: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
  
  // Admin
  getAllAdmin: (params = {}) => api.get('/applications/admin/all', { params })
};

export default api;
