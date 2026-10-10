// File: apps/pos/src/components/PrintReceipt.jsx
/**
 * PrintReceipt — generates a thermal-style receipt and triggers window.print().
 * Call openPrint(order, payment) to mount and auto-print.
 *
 * Usage:
 *   <PrintReceipt order={order} payment={payment} onClose={() => setPrintData(null)} />
 */
import React, { useEffect, useRef } from 'react';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(v ?? 0));

const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const METHOD_LABELS = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', CARD: 'Kartu' };

export default function PrintReceipt({ order, payment, onClose }) {
  const printRef = useRef(null);

  useEffect(() => {
    // Auto-trigger print after a brief paint delay
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const subtotal = Number(order.totalAmount);
  const paidAmount = Number(payment?.amount ?? subtotal);
  const change = Number(payment?.change ?? 0);

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            display: block !important;
          }
          @page { margin: 0; size: 80mm auto; }
        }
        @media screen {
          #receipt-print { display: none; }
        }
      `}</style>

      {/* Receipt content (hidden on screen, shown on print) */}
      <div id="receipt-print" ref={printRef} style={{ fontFamily: 'monospace', fontSize: '12px', width: '72mm', padding: '4mm' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '16px', fontWeight: 'bold' }}>🍵 KEDAI TEHYAN</p>
          <p>Jl. Contoh No. 1, Kota Anda</p>
          <p>Telp: 0812-3456-7890</p>
          <p style={{ borderTop: '1px dashed #000', marginTop: '6px', paddingTop: '6px' }} />
        </div>

        {/* Order info */}
        <div style={{ marginBottom: '8px' }}>
          <p>No. Pesanan : {order.orderNumber}</p>
          <p>Meja       : {order.table?.number ?? '—'}</p>
          <p>Kasir      : POS System</p>
          <p>Waktu      : {formatDateTime(order.createdAt)}</p>
        </div>

        <p style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Items */}
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center', width: '30px' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Harga</th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item, idx) => (
              <tr key={idx}>
                <td style={{ paddingRight: '4px' }}>{item.product?.name ?? '—'}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Totals */}
        <table style={{ width: '100%', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td><strong>TOTAL</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{formatRupiah(subtotal)}</strong></td>
            </tr>
            <tr>
              <td>Metode Bayar</td>
              <td style={{ textAlign: 'right' }}>{METHOD_LABELS[payment?.method] ?? '—'}</td>
            </tr>
            <tr>
              <td>Dibayar</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(paidAmount)}</td>
            </tr>
            <tr>
              <td>Kembalian</td>
              <td style={{ textAlign: 'right' }}>{formatRupiah(change)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <p style={{ borderTop: '1px dashed #000', margin: '8px 0', paddingTop: '8px', textAlign: 'center' }}>
          Terima kasih atas kunjungan Anda!
        </p>
        <p style={{ textAlign: 'center', fontSize: '10px', color: '#666' }}>
          Simpan struk ini sebagai bukti pembayaran.
        </p>
      </div>

      {/* On-screen overlay — dismiss after printing */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden"
        onClick={onClose}
      >
        <div
          className="rounded-2xl bg-white p-6 shadow-2xl text-center max-w-xs w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-4xl">🖨️</span>
          <p className="mt-2 font-semibold text-gray-800">Mencetak Struk…</p>
          <p className="text-sm text-gray-500 mt-1">
            Dialog cetak akan muncul secara otomatis.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 active:scale-95 transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </>
  );
}
