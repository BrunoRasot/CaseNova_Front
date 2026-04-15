import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const currentPath = window.location?.pathname || '';

    const shouldTryRefresh =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      originalRequest?.url !== '/auth/refresh' &&
      originalRequest?.url !== '/auth/logout' &&
      originalRequest?.url !== '/auth/login' &&
      originalRequest?.url !== '/auth/register' &&
      (originalRequest?.headers?.Authorization || useAuthStore.getState().token);

    if (shouldTryRefresh) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (data?.token) {
          useAuthStore.getState().setSession(data.user, data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (_) {
        useAuthStore.getState().setLogout();
        if (currentPath !== '/login') {
          window.location.replace('/login');
        }
      }
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().setLogout();
      if (currentPath !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;