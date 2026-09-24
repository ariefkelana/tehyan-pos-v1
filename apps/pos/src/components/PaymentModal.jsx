// File: apps/pos/src/components/PaymentModal.jsx
/**
 * PaymentModal — handles payment processing for the cashier.
 *
 * Props:
 *  - order: full order object from backend
 *  - onClose: () => void
 *  - onSuccess: (payment) => void
 */
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import PrintReceipt from './PrintReceipt.jsx';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tunai', icon: '💵' },
  { value: 'QRIS', label: 'QRIS', icon: '📱' },
  { value: 'TRANSFER', label: 'Transfer', icon: '🏦' },
  { value: 'CARD', label: 'Kartu', icon: '💳' },
];

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount));

export default function PaymentModal({ order, onClose, onSuccess }) {
  const [method, setMethod] = useState('CASH');
  const [cashInput, setCashInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printData, setPrintData] = useState(null); // { payment } after success
  const inputRef = useRef(null);

  const total = Number(order.totalAmount);
  const cashPaid = parseFloat(cashInput.replace(/\D/g, '')) || 0;
  const change = method === 'CASH' ? cashPaid - total : 0;
  const canSubmit =
    !isSubmitting &&
    (method !== 'CASH' || cashPaid >= total);

  // Focus cash input when CASH is selected
  useEffect(() => {
    if (method === 'CASH') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [method]);

  // Quick amount buttons (round up to nearest 5k/10k/50k)
  const quickAmounts = [total, roundUpTo(total, 5000), roundUpTo(total, 10000), roundUpTo(total, 50000)]
    .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe
    .slice(0, 4);

  const handleCashInput = (e) => {
    // Only allow digits
    const raw = e.target.value.replace(/\D/g, '');
    setCashInput(raw);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const { data: res } = await api.post('/payments', {
        orderId: order.id,
        method,
        amount: method === 'CASH' ? cashPaid : total,
      });

      if (res.success) {
        toast.success(`Pembayaran berhasil! Kembalian: ${formatRupiah(res.data.change)}`);
        setPrintData(res.data);   // ← triggers receipt print
        onSuccess(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Proses Pembayaran</h2>
              <p className="text-sm opacity-80">
                {order.orderNumber} · Meja {order.table?.number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 text-3xl font-extrabold">{formatRupiah(total)}</div>
        </div>

        <div className="p-6 space-y-5">
          {/* Order summary (compact) */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Ringkasan Pesanan</p>
            <ul className="space-y-1">
              {(order.items ?? []).slice(0, 4).map((item, idx) => (
                <li key={idx} className="flex justify-between text-xs text-gray-700">
                  <span>{item.product?.name ?? '—'} ×{item.quantity}</span>
                  <span className="font-medium">{formatRupiah(item.subtotal)}</span>
                </li>
              ))}
              {(order.items?.length ?? 0) > 4 && (
                <li className="text-xs text-gray-400 text-center">
                  +{order.items.length - 4} item lainnya…
                </li>
              )}
            </ul>
          </div>

          {/* Payment Method */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Metode Pembayaran</p>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={clsx(
                    'flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition-all',
                    method === m.value
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                      : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50/50'
                  )}
                >
                  <span className="text-xl">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Input */}
          {method === 'CASH' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                    Rp
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={cashInput ? Number(cashInput).toLocaleString('id-ID') : ''}
                    onChange={handleCashInput}
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-right text-lg font-bold text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashInput(String(amt))}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>

              {/* Change display */}
              <div
                className={clsx(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold',
                  change >= 0 && cashPaid > 0
                    ? 'bg-green-50 border border-green-100 text-green-700'
                    : cashPaid > 0
                    ? 'bg-red-50 border border-red-100 text-red-600'
                    : 'bg-gray-50 border border-gray-100 text-gray-400'
                )}
              >
                <span>Kembalian</span>
                <span className="text-lg">{cashPaid > 0 ? formatRupiah(Math.max(0, change)) : '—'}</span>
              </div>

              {cashPaid > 0 && cashPaid < total && (
                <p className="text-xs text-red-500 text-center">
                  ⚠️ Kurang {formatRupiah(total - cashPaid)}
                </p>
              )}
            </div>
          )}

          {method !== 'CASH' && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center text-sm text-blue-700">
              <p className="font-semibold">Total yang harus dibayar</p>
              <p className="text-2xl font-extrabold mt-1">{formatRupiah(total)}</p>
              <p className="text-xs mt-1 opacity-70">Pastikan pembayaran telah diterima sebelum mengkonfirmasi.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={clsx(
              'flex-[2] rounded-xl py-3 text-sm font-bold transition-all',
              canSubmit
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {isSubmitting
              ? 'Memproses…'
              : `✅ Konfirmasi Pembayaran${method === 'CASH' && change > 0 ? ` · Kembalian ${formatRupiah(change)}` : ''}`}
          </button>
        </div>
      </div>
    </div>

      {/* ── Print Receipt — auto-triggered after payment ────────────── */}
      {printData && (
        <PrintReceipt
          order={order}
          payment={printData}
          onClose={() => setPrintData(null)}
        />
      )}
    </>
  );
}

/** Round `value` up to nearest `step` */
function roundUpTo(value, step) {
  return Math.ceil(value / step) * step;
}
