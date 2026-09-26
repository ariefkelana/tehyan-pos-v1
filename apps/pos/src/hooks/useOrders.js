// File: apps/pos/src/hooks/useOrders.js
/**
 * Custom hook — manages order list state + Socket.io sync.
 * Extracted from CashierView so logic can be reused across pages.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import socket from '../lib/socket.js';
import api from '../lib/api.js';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const audioRef = useRef(null);

  // ── Fetch all orders ────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get('/orders', { params });
      if (res.success) setOrders(res.data);
    } catch (err) {
      toast.error('Gagal memuat pesanan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Update order status ─────────────────────────────────────────────────
  const updateStatus = useCallback(async (orderId, status) => {
    try {
      const { data: res } = await api.patch(`/orders/${orderId}/status`, { status });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
        toast.success(`Status diperbarui: ${status}`);
        return res.data;
      }
    } catch (err) {
      toast.error(err.message || 'Gagal update status.');
      throw err;
    }
  }, []);

  // ── Socket.io ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders();

    if (!socket.connected) socket.connect();

    socket.emit('join:cashier');

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => {
      setIsConnected(false);
      toast.error('Koneksi real-time terputus…');
    };

    const onNewOrder = (newOrder) => {
      audioRef.current?.play().catch(() => {});
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
    };

    const onOrderUpdated = ({ orderId, status }) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    };

    const onPaymentCompleted = ({ orderId }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'PAID' } : o))
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new-order', onNewOrder);
    socket.on('order:updated', onOrderUpdated);
    socket.on('payment:completed', onPaymentCompleted);

    // Fallback polling for serverless environments (every 10 seconds)
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new-order', onNewOrder);
      socket.off('order:updated', onOrderUpdated);
      socket.off('payment:completed', onPaymentCompleted);
    };
  }, [fetchOrders]);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return {
    orders,
    setOrders,
    isLoading,
    isConnected,
    fetchOrders,
    updateStatus,
    pendingCount,
    audioRef,
  };
}
