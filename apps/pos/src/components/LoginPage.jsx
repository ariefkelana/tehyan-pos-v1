// File: apps/pos/src/components/LoginPage.jsx
/**
 * LoginPage — full-screen login form for POS cashier.
 * Uses AuthContext login() method and shows field-level errors.
 */
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // AuthProvider will update isAuthenticated → App re-renders
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-900 px-8 py-10 text-center">
            <span className="text-5xl">🍵</span>
            <h1 className="mt-4 text-2xl font-black text-white tracking-tight">Kedai TehYan</h1>
            <p className="text-xs font-bold tracking-widest text-emerald-400 mt-1 uppercase">Sistem POS</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-black text-zinc-900 mb-6">Masuk ke Akun</h2>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  Email Karyawan
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tehyan.com"
                  className="w-full rounded-2xl bg-gray-50 border border-transparent px-4 py-3.5 text-sm font-semibold text-zinc-900 placeholder:text-gray-300 outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl bg-gray-50 border border-transparent px-4 py-3.5 pr-12 text-sm font-semibold text-zinc-900 placeholder:text-gray-300 outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zinc-900 transition-colors"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-zinc-900 py-4 text-sm font-bold text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed transition-transform active:scale-95"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memuat…
                  </span>
                ) : (
                  'Masuk Sekarang'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-600">
              Hubungi Admin jika lupa password.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          v1.0.0 · Kedai TehYan POS System
        </p>
      </div>
    </div>
  );
}
