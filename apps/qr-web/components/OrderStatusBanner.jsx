// File: apps/qr-web/components/OrderStatusBanner.jsx
'use client';

/**
 * OrderStatusBanner — shown at top of customer menu page after a successful order.
 * Connects to Socket.io and listens for order status updates from the backend.
 *
 * Props:
 *  - tableId: number | string
 *  - latestOrderNumber: string | null
 */
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import clsx from 'clsx';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Harap Bayar di Kasir',
    icon: '💳',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    pulse: true,
  },
  PAID: {
    label: 'Pembayaran Lunas',
    icon: '✅',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    pulse: false,
  },
  PREPARING: {
    label: 'Sedang Diproses',
    icon: '👨‍🍳',
    color: 'bg-orange-50 border-orange-200 text-orange-800',
    pulse: true,
  },
  READY: {
    label: 'Siap Diambil!',
    icon: '🎉',
    color: 'bg-green-50 border-green-200 text-green-800',
    pulse: true,
  },
  SERVED: {
    label: 'Pesanan Selesai',
    icon: '🍽️',
    color: 'bg-teal-50 border-teal-200 text-teal-800',
    pulse: false,
  },
  CANCELLED: {
    label: 'Pesanan Dibatalkan',
    icon: '❌',
    color: 'bg-red-50 border-red-200 text-red-700',
    pulse: false,
  },
};

const ORDER_STEPS = ['PENDING', 'PAID', 'PREPARING', 'READY', 'SERVED'];

export default function OrderStatusBanner({ tableId, latestOrderNumber }) {
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderNumber, setOrderNumber] = useState(latestOrderNumber ?? null);
  const [isVisible, setIsVisible] = useState(!!latestOrderNumber);
  const socketRef = useRef(null);

  // Sync prop changes to local state
  useEffect(() => {
    if (latestOrderNumber) {
      setOrderNumber(latestOrderNumber);
      if (!orderStatus) setOrderStatus('PENDING');
      setIsVisible(true);
    }
  }, [latestOrderNumber]);

  useEffect(() => {
    if (!tableId) return;

    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join:table', tableId);

    socket.on('order:confirmed', ({ orderNumber: num, status }) => {
      setOrderNumber(num);
      setOrderStatus(status ?? 'PENDING');
      setIsVisible(true);
    });

    socket.on('order:status-updated', ({ orderNumber: num, status }) => {
      setOrderNumber(num);
      setOrderStatus(status);
      setIsVisible(true);
    });

    socket.on('order:paid', () => {
      setOrderStatus('PAID');
    });

    return () => socket.disconnect();
  }, [tableId]);

  if (!isVisible || !orderStatus) return null;

  const cfg = STATUS_CONFIG[orderStatus] ?? STATUS_CONFIG.PENDING;
  const currentStepIndex = ORDER_STEPS.indexOf(orderStatus);

  return (
    <div
      className={clsx(
        'mx-5 mt-4 rounded-[2rem] border p-5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
        cfg.color
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={clsx('text-2xl', cfg.pulse && 'animate-bounce')}>{cfg.icon}</span>
          <div>
            <p className="text-[10px] font-bold opacity-60 tracking-widest">{orderNumber}</p>
            <p className="font-black text-lg leading-tight mt-0.5">{cfg.label}</p>
          </div>
        </div>
        {(orderStatus === 'PAID' || orderStatus === 'CANCELLED' || orderStatus === 'SERVED') && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-xs font-bold hover:bg-black/20 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress stepper */}
      {orderStatus !== 'CANCELLED' && (
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {ORDER_STEPS.map((step, idx) => {
            const isPast = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <React.Fragment key={step}>
                <div
                  className={clsx(
                    'h-1.5 flex-1 rounded-full transition-all duration-500',
                    isPast
                      ? 'bg-current opacity-100'
                      : isCurrent
                      ? 'bg-current opacity-70 animate-pulse'
                      : 'bg-black/10'
                  )}
                />
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
