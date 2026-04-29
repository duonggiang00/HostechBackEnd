import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api/';

const isApiDebugLogging =
  Boolean(import.meta.env.DEV) || import.meta.env.VITE_DEBUG_API === '1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState();

  // Scope headers: property from /properties/:uuid; org from /organizations/:uuid or /org/* + user.org_id
  const path = window.location.pathname;
  const propMatch = path.match(/\/properties\/([a-fA-F0-9\-]{36})/);
  const orgFromOrganizationsPath = path.match(/\/organizations\/([a-fA-F0-9\-]{36})/)?.[1] ?? null;
  const orgFromOrgScope =
    path.startsWith('/org') && user?.org_id && /^[a-fA-F0-9-]{36}$/.test(user.org_id) ? user.org_id : null;

  const propertyId = propMatch ? propMatch[1] : null;
  const organizationId = orgFromOrganizationsPath ?? orgFromOrgScope;

  if (isApiDebugLogging) {
    console.log(
      `%c 🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`,
      'background: #6366f1; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
    );
    if (config.params) console.log('   Params:', config.params);
    if (config.data) console.log('   Body:', config.data);
  }

  if (token && token !== 'session-cookie-active') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (organizationId) {
    config.headers['X-Org-Id'] = organizationId;
  }

  if (propertyId) {
    config.headers['X-Property-Id'] = propertyId;
  }

  if (!config.headers['X-Request-Id']) {
    const rid =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    config.headers['X-Request-Id'] = rid;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (isApiDebugLogging) {
      console.group(`✅ [API Response] ${response.status} ${response.config.url}`);
      console.log('Data:', response.data);
      console.groupEnd();
    }
    return response;
  },
  (error: AxiosError | any) => {
    // Handle request cancellation gracefully
    if (axios.isCancel(error)) {
      if (isApiDebugLogging) {
        console.log(`%c ℹ️ [API Canceled] ${error.config?.url || 'Unknown URL'}`, 'color: #94a3b8;');
      }
      return Promise.reject(error);
    }

    if (isApiDebugLogging) {
      console.group(`❌ [API Error] ${error.response?.status || 'Network Error'} ${error.config?.url}`);
      console.error('Message:', error.message);
      console.error('Response Data:', error.response?.data);
      console.groupEnd();
    }
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
