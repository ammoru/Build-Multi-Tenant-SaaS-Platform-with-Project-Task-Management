import axios from 'axios';


// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },  
});

// Request interceptor - Add JWT token to requests
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

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== AUTHENTICATION API =====
export const authAPI = {
  // API 1: Register Tenant
  registerTenant: (data) => api.post('/auth/register-tenant', data),

  // API 2: Login
  login: (data) => api.post('/auth/login', data),

  // API 3: Get Current User
  getCurrentUser: () => api.get('/auth/me'),

  // API 4: Logout
  logout: () => api.post('/auth/logout'),
};

// ===== TENANT API =====
export const tenantAPI = {
  // API 5: Get Tenant Details
  getTenantDetails: (tenantId) => api.get(`/tenants/${tenantId}`),

  // API 6: Update Tenant
  updateTenant: (tenantId, data) => api.put(`/tenants/${tenantId}`, data),

  // API 7: List All Tenants
  listTenants: (params) => api.get('/tenants', { params }),
};

// ===== USER API =====
export const userAPI = {
  // API 8: Add User to Tenant
  addUser: (tenantId, data) => api.post(`/tenants/${tenantId}/users`, data),

  // API 9: List Tenant Users
  listUsers: (tenantId, params) => api.get(`/tenants/${tenantId}/users`, { params }),

  // API 10: Update User
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),

  // API 11: Delete User
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

// ===== PROJECT API =====
export const projectAPI = {
  // API 12: Create Project
  createProject: (data) => api.post('/projects', data),

  // API 13: List Projects
  listProjects: (params) => api.get('/projects', { params }),

  // API 14: Update Project
  updateProject: (projectId, data) => api.put(`/projects/${projectId}`, data),

  // API 15: Delete Project
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
};

// ===== TASK API =====
export const taskAPI = {
  // API 16: Create Task
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),

  // API 17: List Project Tasks
  listTasks: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),

  // API 18: Update Task Status
  updateTaskStatus: (taskId, data) => api.patch(`/tasks/${taskId}/status`, data),

  // API 19: Update Task
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data),

  // Delete Task (if backend supports it)
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
};

export default api;
