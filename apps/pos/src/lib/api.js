import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tehyan-pos-v1-backend.vercel.app/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('pos_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.token) {
          config.headers.Authorization = 'Bearer ' + parsed.token;
        }
      }
    } catch (err) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Sesi habis atau akses ditolak. Membersihkan sesi...');
      localStorage.removeItem('pos_auth');
      window.location.href = '/';
      return new Promise(() => {});
    }

    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan.';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default api;