'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import clsx from 'clsx';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tehyan-pos-v1-backend.vercel.app';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount));

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
  const [orderStatus, setOrderStatus] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [internalOrderId, setInternalOrderId] = useState(null);
  
  const socketRef = useRef(null);
  const overlayRef = useRef(null);

  const cartItems = Object.values(cart);

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ['polling'], upgrade: false });
    
    socketRef.current.emit('join:table', table.id);

    socketRef.current.on('order:confirmed', (data) => {
      if (orderStatus === 'submitting_cashier') {
         setConfirmedOrderNumber(data.orderNumber);
         setOrderStatus('success');
      }
    });

    socketRef.current.on('order:paid', (data) => {
      setOrderStatus('success_qris');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [table.id, orderStatus]);


  // Poll status for Vercel Serverless compatibility
  useEffect(() => {
    let interval;
    if (orderStatus === 'qris' && internalOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/orders/${internalOrderId}?t=${Date.now()}`);
          const data = await res.json();
          if (data.success && data.data.status === 'PAID') {
            setOrderStatus('success_qris');
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [orderStatus, internalOrderId]);


  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      if (orderStatus === null || orderStatus === 'error') {
        onClose();
      }
    }
  };

  const submitOrder = async (method) => {
    if (cartItems.length === 0) return;
    if (!waNumber) {
      setOrderStatus('error');
      setErrorMsg('Nomor WhatsApp wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setOrderStatus(method === 'QRIS' ? 'submitting_qris' : 'submitting_cashier');
    setErrorMsg('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table.id,
          customerWa: waNumber,
          notes,
          items: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            notes: '',
            modifiers: item.selectedMods ? JSON.stringify(item.selectedMods) : null
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat pesanan');

      setConfirmedOrderNumber(data.data.orderNumber);
      setInternalOrderId(data.data.id);
      setInternalOrderId(data.data.id);

      if (method === 'QRIS') {
        const qrisRes = await fetch(`${BACKEND_URL}/api/payments/qris`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.data.id })
        });
        const qrisData = await qrisRes.json();
        
        if (!qrisRes.ok) throw new Error(qrisData.message || 'Gagal generate QRIS');
        
        setQrUrl(qrisData.qrUrl);
        setOrderStatus('qris');
      } else {
        setOrderStatus('success');
      }
    } catch (err) {
      setOrderStatus('error');
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderStatus === 'success') {
    return (
      <ModalOverlay ref={overlayRef} onClick={() => {}}>
        <div className="flex flex-col items-center gap-4 p-8 text-center bg-white rounded-t-[2rem] w-full max-w-md mx-auto">
          <span className="text-6xl animate-bounce">👍</span>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">Pesanan Berhasil!</h2>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-8 py-4 shadow-xl mt-2 w-full">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-black text-emerald-400 tracking-wider">{confirmedOrderNumber}</p>
          </div>
          <p className="text-xs font-bold text-gray-500 mt-2">
            Silakan menuju kasir untuk melakukan pembayaran tunai.
          </p>
          <button onClick={() => onOrderSuccess(confirmedOrderNumber)} className="mt-4 w-full rounded-2xl bg-gray-100 py-4 text-sm font-bold text-gray-700 shadow-sm active:scale-95 transition-transform">
            Selesai
          </button>
        </div>
      </ModalOverlay>
    );
  }

  if (orderStatus === 'qris') {
    return (
      <ModalOverlay ref={overlayRef} onClick={() => {}}>
        <div className="flex flex-col items-center gap-4 p-8 text-center bg-white rounded-t-[2rem] w-full max-w-md mx-auto">
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">Bayar via QRIS</h2>
          <p className="text-sm font-medium text-gray-500 mb-2">Scan QR code di bawah menggunakan M-Banking atau E-Wallet Anda (GoPay, OVO, ShopeePay, dll).</p>
          
          <div className="p-4 bg-gray-50 rounded-3xl border-2 border-emerald-500 mb-2 relative w-full aspect-square flex items-center justify-center">
             {qrUrl ? (
                <img src={qrUrl} alt="QRIS Code" className="w-full h-full object-contain mix-blend-multiply" />
             ) : (
                <p className="text-gray-400 font-bold animate-pulse">Memuat QRIS...</p>
             )}
          </div>
          
          <div className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-xl">
             <span className="text-sm font-bold text-zinc-400">Total Bayar:</span>
             <span className="text-lg font-black text-emerald-400">{formatRupiah(cartTotal)}</span>
          </div>

          <p className="text-xs text-gray-400 mt-2 animate-pulse">Menunggu pembayaran otomatis masuk...</p>
        </div>
      </ModalOverlay>
    );
  }

  if (orderStatus === 'success_qris') {
    return (
      <ModalOverlay ref={overlayRef} onClick={() => {}}>
        <div className="flex flex-col items-center gap-4 p-8 text-center bg-white rounded-t-[2rem] w-full max-w-md mx-auto">
          <span className="text-6xl animate-bounce">🎉</span>
          <h2 className="text-xl font-black text-emerald-600 tracking-tight">Pembayaran Lunas!</h2>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-8 py-4 mt-2 w-full">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-black text-emerald-700 tracking-wider">{confirmedOrderNumber}</p>
          </div>
          <p className="text-xs font-bold text-gray-500 mt-2">
            Pesanan Anda langsung diproses ke dapur. Terima kasih!
          </p>
          <button onClick={() => onOrderSuccess(confirmedOrderNumber)} className="mt-4 w-full rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-sm active:scale-95 transition-transform">
            Tutup
          </button>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay ref={overlayRef} onClick={handleOverlayClick}>
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">Keranjang</h2>
            <p className="text-xs font-semibold text-gray-400">MEJA {table.number}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cartItems.map(({ cartKey, product, quantity, selectedMods, unitPrice }) => (
            <div key={cartKey} className="flex flex-col gap-3 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between min-w-0 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">{product.name}</p>
                  {selectedMods && selectedMods.length > 0 && (
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{selectedMods.map(m => `${m.name}: ${m.optionName}`).join(', ')}</p>
                  )}
                  <p className="text-xs font-semibold text-emerald-600 mt-1">{formatRupiah(unitPrice)}</p>
                </div>
                <p className="text-sm font-black text-zinc-900 text-right">{formatRupiah(unitPrice * quantity)}</p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-1">
                <button onClick={() => onRemoveItem(cartKey)} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 active:scale-90">-</button>
                <span className="min-w-[1.5rem] text-center text-sm font-bold text-zinc-900">{quantity}</span>
                <button onClick={() => onAddItem(product, selectedMods)} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white active:scale-90">+</button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider">Catatan Khusus (Opsional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={200} placeholder="Contoh: Tanpa bawang, es dipisah, dll." className="w-full resize-none rounded-2xl bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all border border-transparent focus:border-transparent" />
          </div>

          <div className="pt-2 pb-4">
            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider">Nomor WhatsApp <span className="text-red-500">*</span></label>
            <input type="tel" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="081234567890" required className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all border border-transparent focus:border-transparent" />
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white px-6 py-5">
          {orderStatus === 'error' && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm font-medium text-red-600">❌ {errorMsg}</div>
          )}

          <div className="flex flex-col gap-3">
             <button
               onClick={() => submitOrder('QRIS')}
               disabled={isSubmitting || cartItems.length === 0}
               className={clsx('flex w-full items-center justify-center rounded-2xl py-4 text-sm font-bold transition-transform', isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95')}
             >
               {isSubmitting ? 'Memproses...' : `Bayar via QRIS ⚡ ${formatRupiah(cartTotal)}`}
             </button>
             
             <button
               onClick={() => submitOrder('CASHIER')}
               disabled={isSubmitting || cartItems.length === 0}
               className={clsx('flex w-full items-center justify-center rounded-2xl py-3 text-sm font-bold transition-transform', isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95')}
             >
               {isSubmitting ? 'Memproses...' : `Bayar di Kasir (Tunai/Kartu)`}
             </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

const ModalOverlay = React.forwardRef(function ModalOverlay({ children, onClick }, ref) {
  return (
    <div ref={ref} onClick={onClick} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
});