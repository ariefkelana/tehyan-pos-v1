// File: apps/pos/src/App.jsx

import React, { useState } from 'react';
import CashierView from './components/CashierView.jsx';
import MenuManager from './components/MenuManager.jsx';
import TableManager from './components/TableManager.jsx';
import ReportsDashboard from './components/ReportsDashboard.jsx';
import UserManager from './components/UserManager.jsx';
import LoginPage from './components/LoginPage.jsx';
import BackgroundMural from './components/BackgroundMural.jsx';
import { useAuth } from './hooks/useAuth.jsx';

const NAV_ITEMS = [
  { id: 'cashier', label: 'Kasir', icon: '💰' },
  { id: 'menu', label: 'Menu', icon: '🍽️' },
  { id: 'tables', label: 'Meja', icon: '🪑' },
  { id: 'reports', label: 'Laporan', icon: '📊' },
  { id: 'users', label: 'Akun', icon: '👥' },
];

export default function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('cashier');

  // Show full-screen spinner while restoring token from localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-wall-texture">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <span className="text-5xl animate-pulse">🍵</span>
          <p className="text-sm">Memuat…</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="flex h-dvh overflow-hidden relative bg-transparent z-0">
      <BackgroundMural opacity="opacity-15" />
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-col bg-wall-texture border-r border-gray-200 shadow-xl z-20">
        {/* Brand */}
        <div className="flex items-center justify-center p-5 border-b border-gray-200 bg-wall">
          <div className="bg-wall border-[3px] border-mural-red p-1">
            <div className="border-[2px] border-mural-blue px-3 py-1 bg-wall flex justify-center items-center">
              <span className="font-cursive text-2xl font-bold text-mural-blue" style={{lineHeight: 1}}>Teh Yan</span>
            </div>
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
                        ? 'bg-mural-red text-white shadow-md'
                        : 'text-gray-600 hover:bg-mural-red/10 hover:text-mural-red',
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
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-gray-800">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-800">{user?.name ?? '—'}</p>
              <p className="text-[10px] text-mural-red uppercase font-bold">{user?.role ?? ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-800 hover:text-mural-red transition-colors"
          >
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden pb-20 md:pb-0 relative">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b bg-white px-4 md:px-6 py-3 md:py-4 shadow-sm z-10 relative">
          <div className="md:hidden flex items-center mr-3 bg-wall border-2 border-mural-red p-0.5">
            <div className="border border-mural-blue px-2 py-0.5 bg-wall flex justify-center items-center">
              <span className="font-cursive text-lg font-bold text-mural-blue" style={{lineHeight: 1}}>Teh Yan</span>
            </div>
          </div>

          <h1 className="hidden md:block text-lg font-semibold text-gray-800">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Dashboard'}
          </h1>

          <div className="flex items-center gap-2 md:gap-3 text-sm text-gray-500 ml-auto">
            <span className="hidden md:inline">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-400" title="Server Connected" />
            
            <div className="md:hidden flex items-center gap-2 ml-1">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-gray-800 shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <button 
                onClick={logout} 
                className="flex items-center gap-1 rounded-md bg-red-50 border border-red-100 px-2.5 py-1.5 text-red-600 hover:bg-red-100 transition-colors active:scale-95"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`flex-1 w-full min-w-0 p-4 md:p-6 ${activeTab === "cashier" ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`}>
          {activeTab === 'cashier' && <CashierView />}
          {activeTab === 'menu' && <MenuManager />}
          {activeTab === 'tables' && <TableManager />}
          {activeTab === 'reports' && <ReportsDashboard />}
          {activeTab === 'users' && <UserManager />}
        </div>
      </main>
      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden absolute bottom-0 w-full bg-wall-texture border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 pb-[env(safe-area-inset-bottom)]">
        <ul className="flex justify-around items-center p-2">
          {NAV_ITEMS.map((item) => {
            if (user?.role === 'CASHIER' && !['cashier', 'tables', 'reports'].includes(item.id)) return null;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-xl transition-colors ${isActive ? 'text-mural-red font-bold bg-mural-red/10' : 'text-gray-500'}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>

  );
}

function PlaceholderPage({ icon, title, desc }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-600">
      <span className="text-6xl">{icon}</span>
      <p className="text-xl font-semibold text-gray-600">{title}</p>
      <p className="text-sm">{desc}</p>
    </div>
  );
}
