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
      console.warn('[API] Sesi habis atau akses ditolak. Backend mengembalikan 401.');
      // WE REMOVED window.location.href = '/' TO PREVENT INFINITE RELOAD LOOPS.
      // useAuth.jsx catch block will handle logging them out gracefully now!
    }
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan.';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default api;