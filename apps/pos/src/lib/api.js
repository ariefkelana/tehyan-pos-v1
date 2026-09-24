// File: apps/pos/src/lib/api.js
/**
 * Axios instance pre-configured for the TehYan backend API.
 *
 * Usage:
 *   import api from '../lib/api';
 *   const { data } = await api.get('/products');
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — can attach auth token here later
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('pos_token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan jaringan.';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${message}`);
    return Promise.reject(new Error(message));
  }
);

export default api;
