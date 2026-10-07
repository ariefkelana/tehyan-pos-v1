import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// The Authorization header is now managed globally by Firebase in useAuth.jsx
// No need for request interceptor reading from localStorage anymore.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      console.warn('[API] Sesi habis atau akses ditolak. Membersihkan sesi...');
      // Firebase auth handles session state, but we can redirect just in case
      window.location.href = '/';
      return new Promise(() => {});
    }

    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan.';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default api;