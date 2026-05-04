import axios from 'axios';
import { ApiRequestError, getErrorMessage } from './errors';
import type { AuthResponse, AuthSession, MeResponse } from '../types/auth';

const configuredBaseUrl = (
  import.meta.env.VITE_API_URL
  || import.meta.env.VITE_API_BASE_URL
  || ''
).trim().replace(/\/+$/, '');

const getRequestPath = (url = '') => {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, configuredBaseUrl || window.location.origin).pathname;
  } catch {
    return url.split('?')[0] || url;
  }
};

const requiresCookieSession = (url = '') => (
  getRequestPath(url).startsWith('/api/auth/google')
  || getRequestPath(url).startsWith('/api/auth/login')
  || getRequestPath(url).startsWith('/api/auth/register')
  || getRequestPath(url).startsWith('/api/auth/refresh')
  || getRequestPath(url).startsWith('/api/auth/logout')
);

const requiresTrustedHeader = (url = '') => (
  getRequestPath(url).startsWith('/api/auth/refresh')
  || getRequestPath(url).startsWith('/api/auth/logout')
);

const skipsTokenRefresh = (url = '') => (
  getRequestPath(url).startsWith('/api/auth/google')
  || getRequestPath(url).startsWith('/api/auth/login')
  || getRequestPath(url).startsWith('/api/auth/register')
  || getRequestPath(url).startsWith('/api/auth/forgot-password')
  || getRequestPath(url).startsWith('/api/auth/refresh')
  || getRequestPath(url).startsWith('/api/auth/logout')
);

const api = axios.create({
  baseURL: configuredBaseUrl,
  withCredentials: false,
});

const sessionHintKey = 'jcmarket-has-session';

const setSessionHint = (value: boolean) => {
  try {
    if (value) {
      localStorage.setItem(sessionHintKey, 'true');
    } else {
      localStorage.removeItem(sessionHintKey);
    }
  } catch {
    // Ignore storage failures.
  }
};

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (!token) {
    setSessionHint(false);
  }
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const requestUrl = typeof config.url === 'string' ? config.url : '';
  config.withCredentials = requiresCookieSession(requestUrl);

  if (requiresTrustedHeader(requestUrl)) {
    config.headers = config.headers ?? {};
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error.config as any);
    const isRefreshRequest = typeof originalRequest?.url === 'string'
      && getRequestPath(originalRequest.url).startsWith('/api/auth/refresh');

    if (
      axios.isAxiosError(error)
      && error.response?.status === 401
      && !originalRequest?._retry
      && !isRefreshRequest
      && !skipsTokenRefresh(originalRequest?.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest)).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await api.post<AuthResponse>('/api/auth/refresh');
        const meResponse = await api.get<MeResponse>('/api/auth/me');

        const newSession: AuthSession = {
          accessToken: refreshResponse.data.accessToken,
          user: meResponse.data,
        };

        setAccessToken(newSession.accessToken);
        setSessionHint(true);
        processQueue(null, newSession.accessToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        setSessionHint(false);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(new ApiRequestError(
      getErrorMessage(error, 'Request failed.'),
      axios.isAxiosError(error) ? error.response?.status : undefined
    ));
  }
);

export default api;
