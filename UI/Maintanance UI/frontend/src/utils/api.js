import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data)
};

// Bike APIs
export const bikeAPI = {
  addBike: (data) => apiClient.post('/bikes', data),
  getUserBikes: () => apiClient.get('/bikes'),
  getBikeById: (id) => apiClient.get(`/bikes/${id}`),
  updateBike: (id, data) => apiClient.put(`/bikes/${id}`, data),
  deleteBike: (id) => apiClient.delete(`/bikes/${id}`)
};

// Service APIs
export const serviceAPI = {
  getAllServices: () => apiClient.get('/services'),
  getServiceById: (id) => apiClient.get(`/services/${id}`),
  createService: (data) => apiClient.post('/services', data),
  updateService: (id, data) => apiClient.put(`/services/${id}`, data),
  deleteService: (id) => apiClient.delete(`/services/${id}`)
};

// Booking APIs
export const bookingAPI = {
  createBooking: (data) => apiClient.post('/bookings', data),
  getUserBookings: () => apiClient.get('/bookings/user/my-bookings'),
  getBookingById: (id) => apiClient.get(`/bookings/${id}`),
  updateBookingStatus: (id, data) => apiClient.put(`/bookings/${id}`, data),
  getAllBookings: () => apiClient.get('/bookings/admin/all')
};

// Maintenance APIs
export const maintenanceAPI = {
  createMaintenance: (data) => apiClient.post('/maintenance', data),
  getBikeMaintenanceHistory: (bikeId) => apiClient.get(`/maintenance/history/${bikeId}`),
  getMaintenanceById: (id) => apiClient.get(`/maintenance/${id}`),
  updateMaintenance: (id, data) => apiClient.put(`/maintenance/${id}`, data),
  getAllMaintenanceRecords: () => apiClient.get('/maintenance/admin/all')
};

// Admin APIs
export const adminAPI = {
  getDashboardStats: () => apiClient.get('/admin/stats'),
  getAllUsers: () => apiClient.get('/admin/users'),
  updateUserRole: (id, data) => apiClient.put(`/admin/users/${id}/role`, data),
  deactivateUser: (id) => apiClient.put(`/admin/users/${id}/deactivate`),
  getRevenueReport: (month, year) => apiClient.get(`/admin/reports/revenue?month=${month}&year=${year}`)
};

export default apiClient;
