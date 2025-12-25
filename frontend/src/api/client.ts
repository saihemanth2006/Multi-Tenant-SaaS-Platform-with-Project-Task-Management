import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Add JWT token to requests if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  registerTenant: (data: any) => client.post('/api/auth/register-tenant', data),
  login: (data: any) => client.post('/api/auth/login', data),
  getCurrentUser: () => client.get('/api/auth/me'),
  logout: () => client.post('/api/auth/logout')
};

export const projectAPI = {
  create: (data: any) => client.post('/api/projects', data),
  list: (params?: any) => client.get('/api/projects', { params }),
  update: (projectId: string, data: any) => client.put(`/api/projects/${projectId}`, data),
  delete: (projectId: string) => client.delete(`/api/projects/${projectId}`)
};

export const userAPI = {
  create: (tenantId: string, data: any) => client.post(`/api/tenants/${tenantId}/users`, data),
  listTenantUsers: (tenantId: string, params?: any) =>
    client.get(`/api/tenants/${tenantId}/users`, { params }),
  update: (userId: string, data: any) => client.put(`/api/users/${userId}`, data),
  delete: (userId: string) => client.delete(`/api/users/${userId}`)
};

export const taskAPI = {
  create: (projectId: string, data: any) => client.post(`/api/projects/${projectId}/tasks`, data),
  list: (projectId: string, params?: any) => client.get(`/api/projects/${projectId}/tasks`, { params }),
  updateStatus: (taskId: string, status: string) =>
    client.patch(`/api/tasks/${taskId}/status`, { status }),
  update: (taskId: string, data: any) => client.put(`/api/tasks/${taskId}`, data)
};

export default client;
