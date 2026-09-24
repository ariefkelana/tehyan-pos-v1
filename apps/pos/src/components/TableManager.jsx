// File: apps/pos/src/components/TableManager.jsx
/**
 * TableManager — real-time view of all tables and their current status.
 * Allows cashier to manually change table status.
 */
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../lib/api.js';

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Tersedia', color: 'bg-green-100 border-green-300 text-green-700', dot: 'bg-green-500', icon: '✓' },
  OCCUPIED: { label: 'Terisi', color: 'bg-red-100 border-red-300 text-red-700', dot: 'bg-red-500', icon: '👥' },
  RESERVED: { label: 'Reservasi', color: 'bg-yellow-100 border-yellow-300 text-yellow-700', dot: 'bg-yellow-500', icon: '🔒' },
};

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [qrTableId, setQrTableId] = useState(null); // table to show QR URL

  const QR_BASE = import.meta.env.VITE_QR_BASE_URL || 'http://localhost:3000';

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get('/tables');
      if (res.success) setTables(res.data);
    } catch {
      toast.error('Gagal memuat data meja.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTables, 30_000);
    return () => clearInterval(interval);
  }, []);

  const updateTableStatus = async (tableId, status) => {
    setUpdatingId(tableId);
    try {
      await api.patch(`/tables/${tableId}`, { status });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );
      toast.success(`Meja diperbarui ke "${STATUS_CONFIG[status].label}"`);
    } catch (err) {
      toast.error(err.message || 'Gagal update status meja.');
    } finally {
      setUpdatingId(null);
    }
  };

  const copyQrUrl = (table) => {
    const url = `${QR_BASE}/${table.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`URL Meja ${table.number} disalin!`);
    });
  };

  // Summary counts
  const summary = Object.keys(STATUS_CONFIG).reduce((acc, key) => {
    acc[key] = tables.filter((t) => t.status === key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            className={clsx('rounded-xl border p-4 text-center', cfg.color)}
          >
            <p className="text-3xl font-extrabold">{summary[key] ?? 0}</p>
            <p className="text-sm font-medium">{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Table Grid */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Denah Meja</h2>
        <button
          onClick={fetchTables}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">Memuat…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table) => {
            const cfg = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.AVAILABLE;
            const isUpdating = updatingId === table.id;

            return (
              <div
                key={table.id}
                className={clsx(
                  'group relative flex flex-col items-center rounded-2xl border-2 p-5 shadow-sm transition-all hover:shadow-md',
                  cfg.color
                )}
              >
                {/* Status dot */}
                <div className={clsx('mb-2 h-3 w-3 rounded-full', cfg.dot)} />

                {/* Table number */}
                <p className="text-2xl font-extrabold">{table.number}</p>
                <p className="text-xs font-medium opacity-70 mt-0.5">Meja</p>

                {/* Status badge */}
                <span className="mt-2 text-xs font-semibold">{cfg.label}</span>

                {/* Actions — appear on hover */}
                <div className="mt-3 flex w-full flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {Object.entries(STATUS_CONFIG)
                    .filter(([key]) => key !== table.status)
                    .map(([key, statusCfg]) => (
                      <button
                        key={key}
                        onClick={() => updateTableStatus(table.id, key)}
                        disabled={isUpdating}
                        className="w-full rounded-lg bg-white/60 py-1 text-xs font-medium hover:bg-white transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? '…' : `→ ${statusCfg.label}`}
                      </button>
                    ))}
                  <button
                    onClick={() => setQrTableId(table.id)}
                    className="w-full rounded-lg bg-white/60 py-1 text-xs font-medium hover:bg-white transition-colors"
                  >
                    📱 QR Link
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR URL Modal */}
      {qrTableId !== null && (() => {
        const table = tables.find((t) => t.id === qrTableId);
        const url = `${QR_BASE}/${qrTableId}`;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setQrTableId(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-5xl">📱</span>
              <h3 className="mt-3 text-lg font-bold text-gray-800">
                QR Link Meja {table?.number}
              </h3>
              <p className="mt-2 break-all rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm font-mono text-gray-700">
                {url}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Share link ini atau encode ke QR Code menggunakan generator pilihan Anda.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setQrTableId(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Tutup
                </button>
                <button
                  onClick={() => copyQrUrl(table)}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 active:scale-95 transition-all"
                >
                  📋 Salin URL
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
