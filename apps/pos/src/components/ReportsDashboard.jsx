// File: apps/pos/src/components/ReportsDashboard.jsx
/**
 * ReportsDashboard — daily and weekly sales summary for the POS admin.
 */
import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../lib/api.js';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(v ?? 0));

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
};

export default function ReportsDashboard() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(weekAgo());
  const [dateTo, setDateTo] = useState(today());

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get('/orders');
      if (res.success) setOrders(res.data);
    } catch {
      toast.error('Gagal memuat laporan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Filter orders by date range ─────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const orderDate = o.createdAt?.slice(0, 10);
    return orderDate >= dateFrom && orderDate <= dateTo;
  });

  const paidOrders = filteredOrders.filter((o) => o.status === 'PAID');
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'CANCELLED');
  const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // ── Group revenue by day ─────────────────────────────────────────────────
  const revenueByDay = paidOrders.reduce((acc, o) => {
    const day = o.createdAt?.slice(0, 10) ?? '';
    acc[day] = (acc[day] ?? 0) + Number(o.totalAmount);
    return acc;
  }, {});

  const dayLabels = Object.keys(revenueByDay).sort();
  const maxRevenue = Math.max(...Object.values(revenueByDay), 1);

  // ── Top products ─────────────────────────────────────────────────────────
  const productSales = {};
  paidOrders.forEach((order) => {
    (order.items ?? []).forEach((item) => {
      const name = item.product?.name ?? 'Unknown';
      if (!productSales[name]) productSales[name] = { quantity: 0, revenue: 0 };
      productSales[name].quantity += item.quantity;
      productSales[name].revenue += Number(item.subtotal);
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── Payment method breakdown ─────────────────────────────────────────────
  const paymentMethods = {};
  paidOrders.forEach((o) => {
    const method = o.payment?.method ?? 'UNKNOWN';
    paymentMethods[method] = (paymentMethods[method] ?? 0) + Number(o.totalAmount);
  });

  const METHOD_LABELS = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', CARD: 'Kartu' };

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <span className="text-sm font-medium text-gray-600">Periode:</span>
        <input
          type="date"
          value={dateFrom}
          max={dateTo}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
        />
        <span className="text-gray-400">—</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom}
          max={today()}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-amber-400"
        />
        <button
          onClick={() => { setDateFrom(today()); setDateTo(today()); }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Hari Ini
        </button>
        <button
          onClick={() => { setDateFrom(weekAgo()); setDateTo(today()); }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          7 Hari
        </button>
        <button
          onClick={fetchOrders}
          className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          🔄
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Pendapatan',
            value: formatRupiah(totalRevenue),
            sub: `dari ${paidOrders.length} transaksi`,
            icon: '💰',
            color: 'border-l-green-500',
            bg: 'from-green-50',
          },
          {
            label: 'Rata-rata Pesanan',
            value: formatRupiah(avgOrderValue),
            sub: 'per transaksi',
            icon: '📊',
            color: 'border-l-blue-500',
            bg: 'from-blue-50',
          },
          {
            label: 'Pesanan Lunas',
            value: paidOrders.length,
            sub: `dari ${filteredOrders.length} total`,
            icon: '✅',
            color: 'border-l-amber-500',
            bg: 'from-amber-50',
          },
          {
            label: 'Dibatalkan',
            value: cancelledOrders.length,
            sub: 'pesanan',
            icon: '❌',
            color: 'border-l-red-500',
            bg: 'from-red-50',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={clsx(
              'rounded-xl border-l-4 bg-gradient-to-br to-white p-4 shadow-sm',
              kpi.color,
              kpi.bg
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
                <p className="mt-1 text-xl font-extrabold text-gray-800">{kpi.value}</p>
                <p className="text-xs text-gray-400">{kpi.sub}</p>
              </div>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Bar Chart */}
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="mb-4 font-semibold text-gray-700">Pendapatan per Hari</h3>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-gray-400 text-sm">Memuat…</div>
          ) : dayLabels.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-gray-400 text-sm">
              Tidak ada data pada periode ini
            </div>
          ) : (
            <div className="flex h-40 items-end gap-2">
              {dayLabels.map((day) => {
                const val = revenueByDay[day];
                const heightPct = (val / maxRevenue) * 100;
                const label = new Date(day).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                return (
                  <div key={day} className="group flex flex-1 flex-col items-center gap-1">
                    {/* Tooltip */}
                    <div className="invisible group-hover:visible rounded bg-gray-800 px-2 py-1 text-xs text-white whitespace-nowrap">
                      {formatRupiah(val)}
                    </div>
                    {/* Bar */}
                    <div
                      className="w-full rounded-t-md bg-amber-400 transition-all hover:bg-amber-500"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    {/* Date label */}
                    <p className="text-[10px] text-gray-400 truncate w-full text-center">{label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
          <h3 className="mb-4 font-semibold text-gray-700">Metode Pembayaran</h3>
          {Object.keys(paymentMethods).length === 0 ? (
            <div className="flex h-32 items-center justify-center text-gray-400 text-sm">
              Tidak ada data
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(paymentMethods)
                .sort(([, a], [, b]) => b - a)
                .map(([method, revenue]) => {
                  const pct = Math.round((revenue / totalRevenue) * 100);
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">
                          {METHOD_LABELS[method] ?? method}
                        </span>
                        <span className="text-gray-500">{formatRupiah(revenue)} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
        <h3 className="mb-4 font-semibold text-gray-700">Produk Terlaris</h3>
        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Tidak ada data produk</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs font-semibold uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="pb-2 text-left">#</th>
                  <th className="pb-2 text-left">Produk</th>
                  <th className="pb-2 text-right">Terjual</th>
                  <th className="pb-2 text-right">Pendapatan</th>
                  <th className="pb-2 text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map(([name, data], idx) => {
                  const pct = totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0;
                  return (
                    <tr key={name} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-2.5 pr-3 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 font-medium text-gray-800">{name}</td>
                      <td className="py-2.5 text-right text-gray-600">{data.quantity}x</td>
                      <td className="py-2.5 text-right font-semibold text-gray-800">{formatRupiah(data.revenue)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent paid transactions */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
        <h3 className="mb-4 font-semibold text-gray-700">Transaksi Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-xs font-semibold uppercase tracking-wide text-gray-400">
              <tr>
                <th className="pb-2 text-left">No. Pesanan</th>
                <th className="pb-2 text-left">Meja</th>
                <th className="pb-2 text-left">Waktu</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-center">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paidOrders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 font-mono text-xs text-gray-700">{order.orderNumber}</td>
                  <td className="py-2.5 text-gray-600">Meja {order.table?.number ?? '—'}</td>
                  <td className="py-2.5 text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-800">
                    {formatRupiah(order.totalAmount)}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {METHOD_LABELS[order.payment?.method] ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {paidOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">Tidak ada transaksi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
