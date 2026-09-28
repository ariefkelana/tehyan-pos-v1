'use strict';
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import socket from '../lib/socket.js';
import PrintReceipt from './PrintReceipt.jsx';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tunai', icon: '💵' },
  { value: 'QRIS', label: 'QRIS Otomatis', icon: '📱' },
  { value: 'TRANSFER', label: 'Transfer', icon: '💳' },
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
  const [printData, setPrintData] = useState(null); 
  const [qrUrl, setQrUrl] = useState(null);
  const [isWaitingQris, setIsWaitingQris] = useState(false);
  const inputRef = useRef(null);

  const total = Number(order.totalAmount);
  const cashPaid = parseFloat(cashInput.replace(/\D/g, '')) || 0;
  const change = method === 'CASH' ? cashPaid - total : 0;
  const canSubmit = method === 'CASH' ? cashPaid >= total : true;

  useEffect(() => {
    if (method === 'CASH' && inputRef.current && !printData && !isWaitingQris) {
      inputRef.current.focus();
    }
  }, [method, printData, isWaitingQris]);

  useEffect(() => {
     if (isWaitingQris) {
         const handleOrderUpdated = (data) => {
            if (data.id === order.id && data.status === 'PAID') {
               toast.success('Pembayaran QRIS Berhasil Masuk!');
               setPrintData({ payment: { orderId: order.id, method: 'QRIS', amount: total, change: 0, status: 'PAID' } });
            }
         };
         socket.on('order:updated', handleOrderUpdated);
         return () => socket.off('order:updated', handleOrderUpdated);
     }
  }, [isWaitingQris, order.id, total]);


  // Poll status for Vercel Serverless compatibility
  useEffect(() => {
    let interval;
    if (isWaitingQris && order?.id) {
      interval = setInterval(async () => {
        try {
          const { data } = await api.get(`/orders/${order.id}`);
          if (data.success && data.data.status === 'PAID') {
            toast.success('Pembayaran QRIS Berhasil Masuk!');
            setPrintData({ payment: { orderId: order.id, method: 'QRIS', amount: total, change: 0, status: 'PAID' } });
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isWaitingQris, order?.id, total, setPrintData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      if (method === 'QRIS') {
         // Hit backend to generate Midtrans QR
         const { data } = await api.post('/payments/qris', { orderId: order.id });
         if (data.success) {
            setQrUrl(data.qrUrl);
            setIsWaitingQris(true);
         }
      } else {
         // Manual Cash / Transfer
         const { data } = await api.post('/orders/' + order.id + '/pay', { method, amount: method === 'CASH' ? cashPaid : total });
         if (data.success) {
           toast.success('Pembayaran berhasil!');
           setPrintData({ payment: data.data });
         }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memproses pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (val) => setCashInput(formatRupiah(val).replace('Rp', '').trim());

  if (printData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl bg-zinc-900 p-8 shadow-2xl overflow-hidden relative">
          <PrintReceipt order={order} payment={printData.payment} onClose={() => onSuccess(printData.payment)} />
        </div>
      </div>
    );
  }

  if (isWaitingQris) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl relative">
           <button onClick={onClose} className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
           <h2 className="text-xl font-black text-zinc-900">Menunggu Pembayaran QRIS</h2>
           <p className="text-sm font-medium text-gray-500 mt-2">Silakan arahkan pembeli untuk memindai kode QR ini.</p>
           
           <div className="mt-6 p-4 border-2 border-emerald-500 rounded-3xl w-64 h-64 mx-auto flex items-center justify-center bg-gray-50">
              {qrUrl ? <img src={qrUrl} alt="QRIS" className="w-full h-full mix-blend-multiply object-contain" /> : <p className="animate-pulse font-bold text-gray-400">Memuat...</p>}
           </div>

           <div className="mt-6 bg-zinc-900 text-emerald-400 font-black text-2xl py-4 rounded-2xl">
              {formatRupiah(total)}
           </div>
           
           <p className="text-xs font-bold text-emerald-600 mt-4 animate-pulse">Memantau status pembayaran otomatis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col md:flex-row">
         <div className="w-full bg-zinc-50 p-8 md:w-1/2 flex flex-col justify-between">
           <div>
             <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Total Tagihan</h3>
             <p className="mt-2 text-4xl font-black text-zinc-900 tracking-tight">{formatRupiah(total)}</p>
           </div>
           <div className="mt-6">
             <div className="grid grid-cols-2 gap-3">
               {PAYMENT_METHODS.map((m) => (
                 <button key={m.value} type="button" onClick={() => setMethod(m.value)} className={clsx('flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all', method === m.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200')}>
                   <span className="text-2xl mb-1">{m.icon}</span>
                   <span className="text-xs font-bold">{m.label}</span>
                 </button>
               ))}
             </div>
           </div>
         </div>

         <div className="w-full p-8 md:w-1/2">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-black text-zinc-900 tracking-tight">Detail Pembayaran</h2>
             <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
           </div>
           
           <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100%-3rem)] justify-between">
              {method === 'CASH' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nominal Uang Tunai</label>
                    <div className="relative mt-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                      <input ref={inputRef} type="text" value={cashInput} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setCashInput(v ? formatRupiah(v).replace('Rp', '').trim() : ''); }} className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 text-xl font-black text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[50000, 100000, 150000].map(val => (
                      <button key={val} type="button" onClick={() => handleQuickAmount(val)} className="rounded-xl border border-gray-200 bg-white py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">{formatRupiah(val)}</button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl bg-zinc-900 p-4 flex justify-between items-center text-white">
                     <span className="text-sm font-bold text-zinc-400">Kembalian</span>
                     <span className="text-xl font-black">{change >= 0 ? formatRupiah(change) : '-'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4"><span className="text-2xl">ℹ️</span></div>
                  <h3 className="font-bold text-zinc-900 text-lg mb-2">Non-Tunai ({method})</h3>
                  <p className="text-sm text-gray-500">Pastikan Anda telah menerima pembayaran sebelum memproses transaksi ini.</p>
                </div>
              )}
              
              <button type="submit" disabled={!canSubmit || isSubmitting} className={clsx('mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all', (!canSubmit || isSubmitting) ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 active:scale-95')}>
                 {isSubmitting ? 'Memproses...' : 'Proses Pembayaran'}
              </button>
           </form>
         </div>
      </div>
    </div>
  );
}