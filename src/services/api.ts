import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const salesAPI = {
  getAll: () => api.get('/sales'),
  create: (data: any) => api.post('/sales', data),
};

export const analyticsAPI = {
  getSalesData: (startDate?: string, endDate?: string) => 
    api.get('/analytics/sales', { params: { startDate, endDate } }),
};