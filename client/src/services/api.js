import axios from 'axios';
import TokenService from './tokenService';

// API base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track ongoing token refresh to prevent multiple concurrent refreshes
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribe failed requests to retry after token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Execute all subscribed requests after token refresh
const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.map(callback => callback(accessToken));
  refreshSubscribers = [];
};

// Request interceptor for auth token and request ID
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracing and preventing replay attacks
    config.headers['X-Request-ID'] = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Add current auth token
    const accessToken = TokenService.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  // Return response.data directly
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 with token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if this was a refresh token request that failed
      if (originalRequest.url === '/auth/refresh-token') {
        // Clear tokens and redirect to login
        TokenService.clearTokens();
        window.location.href = '/login?error=session_expired';
        return Promise.reject(error);
      }

      // Prevent multiple concurrent refresh requests
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          // Attempt to refresh the token
          const accessToken = await TokenService.refreshAccessToken();
          
          // Update the failed request with new token
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          
          // Notify waiting requests
          onTokenRefreshed(accessToken);
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Token refresh failed - clear auth and redirect
          refreshSubscribers = [];
          TokenService.clearTokens();
          window.location.href = '/login?error=session_expired';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for token refresh and retry request
        return new Promise(resolve => {
          subscribeTokenRefresh(accessToken => {
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            resolve(api(originalRequest));
          });
        });
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// Email API
export const emailAPI = {
  getInbox: (page = 1, limit = 20) => api.get(`/emails/inbox?page=${page}&limit=${limit}`),
  getEmail: (id) => api.get(`/emails/${id}`),
  compose: (emailData) => api.post('/emails/compose', emailData),
  star: (id) => api.post(`/emails/${id}/star`),
  important: (id) => api.post(`/emails/${id}/important`),
  delete: (id) => api.delete(`/emails/${id}`),
  search: (query, label, page = 1, limit = 20) => 
    api.get(`/emails/search?q=${query}&label=${label}&page=${page}&limit=${limit}`),
};

// Fraud Detection API
export const fraudDetectionAPI = {
  scanEmail: (emailId, scanType) => 
    api.post('/fraud-detection/scan-email', { emailId, scanType }),
  getStats: (days = 30) => api.get(`/fraud-detection/stats?days=${days}`),
  getLogs: (page = 1, limit = 20) => 
    api.get(`/fraud-detection/logs?page=${page}&limit=${limit}`),
  addCustomRule: (ruleData) => api.post('/fraud-detection/custom-rules', ruleData),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  updateSecuritySettings: (settings) => api.put('/users/security-settings', settings),
  deleteCustomRule: (ruleId) => api.delete(`/users/custom-rules/${ruleId}`),
  updateCustomRule: (ruleId, ruleData) => api.put(`/users/custom-rules/${ruleId}`, ruleData),
};

export default api;
