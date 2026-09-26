// File: apps/pos/src/App.jsx

import React, { useState } from 'react';
import CashierView from './components/CashierView.jsx';
import MenuManager from './components/MenuManager.jsx';
import TableManager from './components/TableManager.jsx';
import ReportsDashboard from './components/ReportsDashboard.jsx';
import UserManager from './components/UserManager.jsx';
import LoginPage from './components/LoginPage.jsx';
import { useAuth } from './hooks/useAuth.jsx';

const NAV_ITEMS = [
  { id: 'cashier', label: 'Kasir', icon: '🧾' },
  { id: 'menu', label: 'Menu', icon: '🍽️' },
  { id: 'tables', label: 'Meja', icon: '🪑' },
  { id: 'reports', label: 'Laporan', icon: '??' },
  { id: 'users', label: 'Akun', icon: '??' },
];

export default function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('cashier');

  // Show full-screen spinner while restoring token from localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <span className="text-5xl animate-pulse">🍵</span>
          <p className="text-sm">Memuat…</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="flex w-56 flex-col bg-gray-900 text-white shadow-xl">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-gray-700 px-5 py-5">
          <span className="text-2xl">🍵</span>
          <div>
            <p className="text-sm font-bold leading-tight">Kedai TehYan</p>
            <p className="text-xs text-gray-400">POS System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              if (user?.role === 'CASHIER' && !['cashier', 'tables', 'reports'].includes(item.id)) {
                return null; // Hide Menu & Reports from Cashier
              }
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                      activeTab === item.id
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                    ].join(' ')}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer — user info + logout */}
        <div className="border-t border-gray-700 px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user?.name ?? '—'}</p>
              <p className="text-[10px] text-gray-500 uppercase">{user?.role ?? ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
          >
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-400" title="Server Connected" />
            <span>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'cashier' && <CashierView />}
          {activeTab === 'menu' && <MenuManager />}
          {activeTab === 'tables' && <TableManager />}
          {activeTab === 'reports' && <ReportsDashboard />}
          {activeTab === 'users' && <UserManager />}
        </div>
      </main>
    </div>
  );
}

function PlaceholderPage({ icon, title, desc }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
      <span className="text-6xl">{icon}</span>
      <p className="text-xl font-semibold text-gray-600">{title}</p>
      <p className="text-sm">{desc}</p>
    </div>
  );
}
