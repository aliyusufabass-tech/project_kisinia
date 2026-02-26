import axios from 'axios';

const API_HOST = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const BASE_URL = API_HOST + '/api';

// Build absolute image URL from serializer path or full URL
export function buildImageUrl(path) {
  if (!path) return null;
  // already an absolute URL
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // path already starts with /media/
  if (path.startsWith('/')) return `${API_HOST}${path}`;
  // otherwise assume it's a relative media path
  return `${API_HOST}/media/${path}`;
}

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Add token to requests and handle FormData
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // For FormData (file uploads), don't set Content-Type; let axios handle it
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    // For JSON requests, explicitly set Content-Type
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', response.data.access);
          apiClient.defaults.headers.Authorization = `Bearer ${response.data.access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
