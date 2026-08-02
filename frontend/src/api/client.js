import axios from 'axios';

const normalizeBaseUrl = (value) => value?.replace(/\/$/, '') || '';

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || '/api',
});

// Attach auth token to admin requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const shopSlug = localStorage.getItem('shopSlug');
  if (shopSlug) {
    config.headers['x-shop-slug'] = shopSlug;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('shop');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
