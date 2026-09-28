// File: apps/pos/src/components/CashierView.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import api from '../lib/api.js';
import clsx from 'clsx';
import PaymentModal from './PaymentModal.jsx';

// ── Constants ──────────────────────────────────────────────────────────────
const SOCKET_URL = 'https://tehyan-pos-v1-backend.vercel.app';


const STATUS_LABELS = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  PREPARING: 'Diproses',
  READY: 'Siap',
  SERVED: 'Disajikan',
  PAID: 'Lunas',
  CANCELLED: 'Dibatalkan',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-orange-100 text-orange-800 border-orange-200',
  READY: 'bg-green-100 text-green-800 border-green-200',
  SERVED: 'bg-teal-100 text-teal-800 border-teal-200',
  PAID: 'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const NEXT_STATUS = {
  PAID: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(amount)
  );

// ── Main Component ──────────────────────────────────────────────────────────
export default function CashierView() {
  const [orders, setOrders] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ACTIVE'); // ACTIVE = everything except PAID/CANCELLED
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null); // order to pay

  const socketRef = useRef(null);
  const audioRef = useRef(null);

  // ── Fetch existing orders on mount ────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/orders');
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      toast.error('Gagal memuat pesanan.');
      console.error('[CashierView] fetchOrders error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Socket.io Connection ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['polling'], upgrade: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:cashier'); // Join the cashier room
      console.log('[Socket.io] Joined cashier-room');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Koneksi real-time terputus. Mencoba kembali…');
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.io] Connection error:', err.message);
    });

    // ── New order from customer ─────────────────────────────────────────────
    socket.on('new-order', (newOrder) => {
      console.log('[Socket.io] new-order received:', newOrder);

      // Play notification sound
      audioRef.current?.play().catch(() => {});

      toast.custom(
        (t) => (
          <div
            className={clsx(
              'flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg',
              t.visible ? 'animate-enter' : 'animate-leave'
            )}
          >
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-amber-900">Pesanan Baru!</p>
              <p className="text-sm text-amber-800">
                Meja {newOrder.tableNumber} · {newOrder.orderNumber}
              </p>
              <p className="text-xs text-amber-700">{newOrder.itemCount} item · {formatRupiah(newOrder.totalAmount)}</p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );

      // Insert at the top of the list (as a lightweight preview object)
      setOrders((prev) => [
        {
          id: newOrder.orderId,
          orderNumber: newOrder.orderNumber,
          table: { number: newOrder.tableNumber },
          totalAmount: newOrder.totalAmount,
          status: 'PENDING',
          items: newOrder.items,
          createdAt: newOrder.createdAt,
          payment: null,
        },
        ...prev,
      ]);
    });

    // ── Status update from another cashier or self ──────────────────────────
    socket.on('order:updated', ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      setSelectedOrder((prev) => (prev?.id === orderId ? { ...prev, status } : prev));
    });

    // ── Payment completed ───────────────────────────────────────────────────
    socket.on('payment:completed', ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'PAID' } : o))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ── Update Order Status ───────────────────────────────────────────────────
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.patch('/orders/' + orderId + '/status', { status: newStatus });
      // Optimistic update (socket event will also update state)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setSelectedOrder((prev) => (prev?.id === orderId ? { ...prev, status: newStatus } : prev));
      toast.success(`Status diperbarui ke "${STATUS_LABELS[newStatus]}"`);
    } catch (err) {
      toast.error('Gagal memperbarui status.');
      console.error('[CashierView] handleUpdateStatus error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Derived / Filtered orders ─────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ACTIVE') return !['SERVED', 'CANCELLED'].includes(o.status);
    return o.status === filterStatus;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full gap-4">
      {/* Hidden audio for new order notification */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* ── Order List Panel ──────────────────────────────────────────────── */}
      <section className="flex w-96 flex-shrink-0 flex-col rounded-[2rem] bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-zinc-900 tracking-tight">Pesanan</h2>
            {pendingCount > 0 && (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                {pendingCount} BARU
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                'h-2.5 w-2.5 rounded-full',
                isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'
              )}
              title={isConnected ? 'Real-time aktif' : 'Terputus'}
            />
            <button
              onClick={fetchOrders}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-100 px-5 py-3 overflow-x-auto no-scrollbar bg-slate-50">
          {[
            { key: 'ACTIVE', label: 'Aktif' },
            { key: 'PENDING', label: 'Belum Bayar' },
            { key: 'PAID', label: 'Lunas' },
            { key: 'PREPARING', label: 'Dapur' },
            { key: 'READY', label: 'Siap' },
            { key: 'SERVED', label: 'Selesai' },
            { key: 'CANCELLED', label: 'Batal' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={clsx(
                'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all border',
                filterStatus === key
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Order Cards */}
        <ul className="flex-1 overflow-y-auto scrollbar-thin divide-y">
          {isLoading ? (
            <li className="flex items-center justify-center py-12 text-gray-400">Memuat…</li>
          ) : filteredOrders.length === 0 ? (
            <li className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <span className="text-4xl">📭</span>
              <p className="text-sm">Tidak ada pesanan</p>
            </li>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrder?.id === order.id}
                onClick={() => setSelectedOrder(order)}
              />
            ))
          )}
        </ul>
      </section>

      {/* ── Detail Panel ─────────────────────────────────────────────────── */}
      <section className="flex flex-1 flex-col rounded-xl bg-white shadow-sm">
        {selectedOrder ? (
          <OrderDetail
            order={selectedOrder}
            onUpdateStatus={handleUpdateStatus}
            updatingId={updatingId}
            onOpenPayment={(order) => setPaymentOrder(order)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <span className="text-5xl">👈</span>
            <p className="text-sm">Pilih pesanan untuk melihat detail</p>
          </div>
        )}
      </section>

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onSuccess={(payment) => {
            setPaymentOrder(null);
            setOrders((prev) =>
              prev.map((o) => (o.id === paymentOrder.id ? { ...o, status: 'PAID', payment } : o))
            );
            setSelectedOrder((prev) =>
              prev?.id === paymentOrder.id ? { ...prev, status: 'PAID', payment } : prev
            );
            toast.success(`💳 Pembayaran pesanan ${paymentOrder.orderNumber} selesai!`);
          }}
        />
      )}
    </div>
  );
}

// ── Order Card ──────────────────────────────────────────────────────────────
function OrderCard({ order, isSelected, onClick }) {
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
    addSuffix: true,
    locale: localeId,
  });

  return (
    <li>
      <button
        onClick={onClick}
        className={clsx(
          'w-full px-4 py-3 text-left transition-colors hover:bg-amber-50',
          isSelected && 'bg-amber-50 border-l-4 border-amber-500'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Meja {order.table?.number ?? '—'}
            </p>
            <p className="text-xs text-gray-500">{order.orderNumber}</p>
          </div>
          <span
            className={clsx(
              'rounded-full border px-2 py-0.5 text-xs font-medium',
              STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
            )}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>{formatRupiah(order.totalAmount)}</span>
          <span>{timeAgo}</span>
        </div>
      </button>
    </li>
  );
}

// ── Order Detail ────────────────────────────────────────────────────────────
function OrderDetail({ order, onUpdateStatus, updatingId, onOpenPayment }) {
  const nextStatus = NEXT_STATUS[order.status];
  const isUpdating = updatingId === order.id;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="font-semibold text-gray-800">{order.orderNumber}</h2>
          <p className="text-sm text-gray-500">Meja {order.table?.number ?? '—'}</p>
        </div>
        <span
          className={clsx(
            'rounded-full border px-3 py-1 text-sm font-semibold',
            STATUS_COLORS[order.status]
          )}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
        <h3 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wide">Item Pesanan</h3>
        <ul className="space-y-3">
          {(order.items ?? []).map((item, idx) => (
            <li key={idx} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {item.product?.name ?? item.productName ?? '—'}
                </p>
                {item.modifiers && (() => {
                  try {
                    const parsed = typeof item.modifiers === 'string' ? JSON.parse(item.modifiers) : item.modifiers;
                    if (!Array.isArray(parsed) || parsed.length === 0) return null;
                    return (
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        + {parsed.map(m => `${m.name}: ${m.optionName}`).join(', ')}
                      </p>
                    );
                  } catch(e) { return null; }
                })()}
                {item.notes && (
                  <p className="text-xs text-gray-400 italic">Catatan: {item.notes}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-600">
                  {item.quantity}× {formatRupiah(item.unitPrice ?? item.subtotal / item.quantity)}
                </p>
                <p className="font-semibold text-gray-800">{formatRupiah(item.subtotal)}</p>
              </div>
            </li>
          ))}
        </ul>

        {order.notes && (
          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-100 p-3">
            <p className="text-xs font-medium text-yellow-700">Catatan Pelanggan:</p>
            <p className="text-sm text-yellow-800">{order.notes}</p>
          </div>
        )}

        {order.customerWa && (
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">WhatsApp Pelanggan: {order.customerWa}</p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${order.customerWa.startsWith('0') ? '62' + order.customerWa.slice(1) : order.customerWa}?text=${encodeURIComponent(`Halo Kak! 👋\n\nTerima kasih sudah mampir di *Kedai TehYan* 🍵\nIni adalah e-receipt untuk pesanan Kakak (Order #${order.orderNumber}).\n\n💰 *Total Tagihan:* ${formatRupiah(order.totalAmount)}\n📌 *Status Saat Ini:* ${STATUS_LABELS[order.status]}\n\n${order.status === 'READY' ? '✨ *KABAR GEMBIRA!* ✨\nMinuman Kakak sudah siap dinikmati! Yuk, silakan meluncur ke meja kasir sekarang untuk mengambil pesanannya ya! 🏃💨' : 'Mohon ditunggu sebentar ya Kak, pesanan sedang kami proses dengan cinta. Nanti kami kabari lagi kalau sudah siap!'}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 active:scale-95 transition-all"
              >
                <span>💬</span> {order.status === 'READY' ? 'Kirim Info Ambil Pesanan' : 'Kirim E-Receipt'}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Total + Action */}
      <div className="border-t px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>

        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(order.id, nextStatus)}
            disabled={isUpdating}
            className={clsx(
              'w-full rounded-xl py-3 text-sm font-semibold transition-all',
              isUpdating
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-md'
            )}
          >
            {isUpdating
              ? 'Memproses…'
              : `Tandai sebagai "${STATUS_LABELS[nextStatus]}"`}
          </button>
        )}

        {order.status === 'PENDING' && (
          <button
            onClick={() => onOpenPayment(order)}
            disabled={isUpdating}
            className="mt-2 w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
          >
            💳 Terima Pembayaran
          </button>
        )}

        {!['PAID', 'CANCELLED', 'SERVED'].includes(order.status) && (
          <button
            onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
            disabled={isUpdating}
            className="mt-2 w-full rounded-xl py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            Batalkan Pesanan
          </button>
        )}

        {order.status === 'SERVED' && order.table?.status !== 'AVAILABLE' && (
          <button
            onClick={async (e) => {
              const btn = e.currentTarget;
              btn.disabled = true;
              btn.textContent = 'Memproses...';
              try {
                await api.patch('/tables/' + order.tableId, { status: 'AVAILABLE' });
                btn.textContent = '✔️ Meja Telah Kosong';
                btn.classList.add('bg-green-100', 'text-green-700');
                btn.classList.remove('bg-gray-100', 'hover:bg-gray-200');
              } catch (err) {
                btn.textContent = 'Gagal Kosongkan Meja';
                btn.disabled = false;
              }
            }}
            className="mt-2 w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
          >
            🧹 Kosongkan Meja (Tersedia)
          </button>
        )}
      </div>
    </>
  );
}

