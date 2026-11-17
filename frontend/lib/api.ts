import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Inventory
export const inventoryAPI = {
  getById: (productId: string) => api.get(`/inventory/${productId}`),
  update: (productId: string, data: any) => api.put(`/inventory/${productId}`, data),
  getLowStock: () => api.get('/inventory/low-stock'),
};

// Transactions
export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  create: (data: any) => api.post('/transactions', data),
  getByProductId: (productId: string) => api.get(`/transactions/${productId}`),
};

// Invoices
export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
};

// Purchase Orders
export const purchaseOrdersAPI = {
  getAll: () => api.get('/purchase-orders'),
  getById: (id: string) => api.get(`/purchase-orders/${id}`),
  create: (data: any) => api.post('/purchase-orders', data),
  update: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data),
  receive: (id: string, data: any) => api.post(`/purchase-orders/${id}`, data),
};

// Customers
export const customersAPI = {
  getByPhone: (phone: string) => api.get(`/customers/phone/${phone}`),
  create: (data: any) => api.post('/customers', data),
};

// Agentic AI Supply Chain APIs (PS-08)
export const agenticAI = {
  getState: (serviceLevelZ?: number) =>
    api.get(`/api/ai/state${serviceLevelZ ? `?service_level_z=${serviceLevelZ}` : ''}`),
  autoRestock: (serviceLevelZ?: number) =>
    api.post(`/api/ai/auto-restock${serviceLevelZ ? `?service_level_z=${serviceLevelZ}` : ''}`),
  executeRebalance: () => api.post('/api/ai/execute-rebalance'),
  simulate: (data: any) => api.post('/api/simulate', data),
  chat: (message: string, apiKey?: string) =>
    api.post('/api/ai/chat', { message, gemini_api_key: apiKey }),
  resetDb: () => api.post('/api/ai/reset-db'),
  getDemandHistory: (sku: string) => api.get(`/api/demand-history/${sku}`),
};

export default api;

