// File: apps/qr-web/components/CheckoutModal.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import clsx from 'clsx';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount));

/**
 * CheckoutModal — displays cart items and submits the order to the backend.
 *
 * Props:
 *  - cart: { [productId]: { product, quantity } }
 *  - table: { id, number }
 *  - cartTotal: number
 *  - onClose: () => void
 *  - onOrderSuccess: () => void
 *  - onRemoveItem: (productId) => void
 *  - onAddItem: (product) => void
 */
export default function CheckoutModal({
  cart,
  table,
  cartTotal,
  onClose,
  onOrderSuccess,
  onRemoveItem,
  onAddItem,
}) {
  const [notes, setNotes] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // null | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const socketRef = useRef(null);
  const overlayRef = useRef(null);

  const cartItems = Object.values(cart);

  // ── Socket.io — listen for order:confirmed from backend ──────────────────
  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join:table', table.id);

    socket.on('order:confirmed', ({ orderNumber }) => {
      setConfirmedOrderNumber(orderNumber);
    });

    return () => socket.disconnect();
  }, [table.id]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && orderStatus !== 'success') {
      onClose();
    }
  };

  // ── Submit Order ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (cartItems.length === 0) return;
    
    if (!waNumber.trim() || waNumber.length < 9) {
      setErrorMsg('Mohon isi nomor WhatsApp yang valid agar kami bisa mengirim notifikasi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      tableId: table.id,
      notes: notes.trim() || undefined,
      customerWa: waNumber.trim(),
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        modifiers: item.selectedMods && item.selectedMods.length > 0 ? JSON.stringify(item.selectedMods) : null,
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Terjadi kesalahan saat memesan.');
      }

      setConfirmedOrderNumber(json.data.orderNumber);
      setOrderStatus('success');
    } catch (err) {
      console.error('[CheckoutModal] Submit error:', err);
      setErrorMsg(err.message || 'Gagal terhubung ke server. Coba lagi.');
      setOrderStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success State ─────────────────────────────────────────────────────────
  if (orderStatus === 'success') {
    return (
      <ModalOverlay ref={overlayRef} onClick={() => {}}>
        <div className="flex flex-col items-center gap-4 p-8 text-center bg-white rounded-t-[2rem] w-full max-w-md mx-auto">
          <span className="text-6xl animate-bounce">🎉</span>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">Pesanan Berhasil!</h2>
          <p className="text-sm font-medium text-gray-500">
            Pesanan Anda telah diterima dan sedang diproses.
          </p>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-8 py-4 shadow-xl mt-2 w-full">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-black text-emerald-400 tracking-wider">{confirmedOrderNumber}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Silakan tunggu atau lakukan pembayaran di kasir. Terima kasih! 🍵
          </p>
          <button
            onClick={() => onOrderSuccess(confirmedOrderNumber)}
            className="mt-4 w-full rounded-2xl bg-gray-100 py-4 text-sm font-bold text-gray-700 shadow-sm active:scale-95 transition-transform"
          >
            Tutup
          </button>
        </div>
      </ModalOverlay>
    );
  }

  // ── Main Cart / Checkout Modal ────────────────────────────────────────────
  return (
    <ModalOverlay ref={overlayRef} onClick={handleOverlayClick}>
      <div className="flex max-h-[85vh] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">Keranjang</h2>
            <p className="text-xs font-semibold text-gray-400">MEJA {table.number}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cartItems.map(({ cartKey, product, quantity, selectedMods, unitPrice }) => (
            <div
              key={cartKey}
              className="flex flex-col gap-3 rounded-2xl bg-white border border-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
              <div className="flex items-start justify-between min-w-0 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 leading-snug">{product.name}</p>
                  {selectedMods && selectedMods.length > 0 && (
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5 leading-tight">
                      {selectedMods.map(m => `${m.name}: ${m.optionName}`).join(', ')}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-emerald-600 mt-1">
                    {formatRupiah(unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-black text-zinc-900 text-right">
                  {formatRupiah(unitPrice * quantity)}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-end gap-3 mt-1">
                <button
                  onClick={() => onRemoveItem(cartKey)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 active:scale-90 transition-transform"
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-bold text-zinc-900">{quantity}</span>
                <button
                  onClick={() => onAddItem(product, selectedMods)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="pt-2">
            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Catatan Khusus (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Contoh: Tanpa bawang, es dipisah, dll."
              className="w-full resize-none rounded-2xl bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all border border-transparent focus:border-transparent"
            />
          </div>

          {/* WhatsApp */}
          <div className="pt-2 pb-4">
            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="081234567890"
              required
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all border border-transparent focus:border-transparent"
            />
            <p className="mt-2 text-[10px] font-medium text-gray-400">
              Diperlukan untuk mengirim struk & notifikasi pesanan.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-6 py-5">
          {/* Error message */}
          {orderStatus === 'error' && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm font-medium text-red-600">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || cartItems.length === 0}
            className={clsx(
              'flex w-full items-center justify-center rounded-2xl py-4 text-sm font-bold transition-transform',
              isSubmitting || cartItems.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-zinc-900 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-95'
            )}
          >
            {isSubmitting ? 'Memproses...' : `Pesan Sekarang · ${formatRupiah(cartTotal)}`}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Modal Overlay ──────────────────────────────────────────────────────────
const ModalOverlay = React.forwardRef(function ModalOverlay({ children, onClick }, ref) {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
});
