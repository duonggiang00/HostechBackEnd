import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  // Extract scope IDs from URL as the single source of truth
  const path = window.location.pathname;
  const propMatch = path.match(/\/properties\/([a-fA-F0-9\-]{36})/);
  const orgMatch = path.match(/\/organizations\/([a-fA-F0-9\-]{36})/);
  
  const propertyId = propMatch ? propMatch[1] : null;
  const organizationId = orgMatch ? orgMatch[1] : null;

  // Standardized logging for every request
  console.log(`%c 🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`, 'background: #6366f1; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
  if (config.params) console.log('   Params:', config.params);
  if (config.data) console.log('   Body:', config.data);

  if (token && token !== 'session-cookie-active') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (organizationId) {
    config.headers['X-Org-Id'] = organizationId;
  }

  if (propertyId) {
    config.headers['X-Property-Id'] = propertyId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Standardized logging for every successful response
    console.group(`✅ [API Response] ${response.status} ${response.config.url}`);
    console.log('Data:', response.data);
    console.groupEnd();
    return response;
  },
  (error: AxiosError | any) => {
    // Standardized logging for every error
    console.group(`❌ [API Error] ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    console.error('Message:', error.message);
    console.error('Response Data:', error.response?.data);
    console.groupEnd();
    // Determine the error message
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      const data = error.response.data as any;
      if (data && data.message) {
        errorMessage = data.message;
      } else if (error.response.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.response.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    }

    // Don't show toast for 401s if it's the initial check or passive fetch to avoid spamming the user
    const configUrl = error.config?.url || '';
    const isPassive = configUrl.includes('/me') || configUrl.includes('/dashboard');
    
    if (!(error.response?.status === 401 && isPassive)) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
