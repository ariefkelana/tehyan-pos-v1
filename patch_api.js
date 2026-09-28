const fs = require('fs');

const apiCode = import axios from 'axios';

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
        const { token } = JSON.parse(stored);
        if (token) config.headers.Authorization = 'Bearer ' + token;
      }
    } catch (err) {
      // ignore parse errors
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
      // Return a pending promise to prevent the error from cascading to components
      return new Promise(() => {});
    }

    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan.';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
;
fs.writeFileSync('apps/pos/src/lib/api.js', apiCode);
