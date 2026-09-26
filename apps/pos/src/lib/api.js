import axios from 'axios';
const api = axios.create({
  baseURL: 'https://tehyan-pos-v1-backend.vercel.app/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) config.headers.Authorization = 'Bearer ' + token;
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan.';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);
export default api;
