// File: apps/pos/src/components/PrintReceipt.jsx
/**
 * PrintReceipt — Generates a professional 80mm/58mm thermal receipt layout
 * and triggers window.print() via React Portal attached to document.body.
 * Layout and content are dynamically driven by Admin Receipt Settings.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getReceiptSettings } from '../lib/receiptSettings.js';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(v ?? 0));

const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const METHOD_LABELS = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', CARD: 'Kartu' };

export default function PrintReceipt({ order, payment, onClose, customSettings }) {
  const printRef = useRef(null);
  const settings = customSettings || getReceiptSettings();
  const is58mm = settings.paperSize === '58mm';

  useEffect(() => {
    // Auto-trigger print after brief paint delay
    const timer = setTimeout(() => {
      window.print();
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const subtotal = Number(order.totalAmount);
  const paidAmount = Number(payment?.amount ?? subtotal);
  const change = Number(payment?.change ?? 0);

  return (
    <>
      {/* Optimized Thermal Print Styles based on 80mm vs 58mm settings */}
      <style>{`
        @media print {
          /* Hide the main react app root completely */
          #root { display: none !important; }
          
          @page {
            size: ${is58mm ? '58mm' : '80mm'} auto;
            margin: 0mm;
          }
          
          html, body {
            width: ${is58mm ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #receipt-print {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${is58mm ? '48mm' : '72mm'} !important;
            margin: 0 auto !important;
            padding: ${is58mm ? '2mm 1mm' : '4mm 2mm'} !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
          }
        }
        @media screen {
          #receipt-print { display: none; }
        }
      `}</style>

      {/* On-Screen Modal Overlay (Dismissable) */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden"
        onClick={onClose}
      >
        <div
          className="rounded-3xl bg-white p-6 shadow-2xl text-center max-w-xs w-full border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
            <span className="text-3xl">🖨️</span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Mencetak Struk ({settings.paperSize})...</h3>
          <p className="text-xs text-gray-500 mt-1">
            Dialog cetak printer akan muncul otomatis. Silakan pilih printer kasir Anda.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
            >
              Cetak Ulang
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Actual Receipt Layout (Mounted to body for print reliability) */}
      {createPortal(
        <div
          id="receipt-print"
          ref={printRef}
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: is58mm ? '9.5px' : '11px',
            lineHeight: is58mm ? '1.25' : '1.35',
            color: '#000000',
            width: is58mm ? '48mm' : '72mm',
            padding: is58mm ? '2mm 1mm' : '4mm 2mm',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Header Toko */}
          <div style={{ textAlign: 'center', marginBottom: is58mm ? '5px' : '8px' }}>
            <p style={{ fontSize: is58mm ? '13px' : '15px', fontWeight: 'bold', margin: '0 0 2px 0', letterSpacing: '0.5px' }}>
              {settings.storeName || 'KEDAI TEHYAN'}
            </p>
            {settings.storeSlogan && (
              <p style={{ fontSize: is58mm ? '8.5px' : '10px', margin: '0 0 2px 0', color: '#333' }}>
                {settings.storeSlogan}
              </p>
            )}
            {settings.storeAddress && (
              <p style={{ fontSize: is58mm ? '8px' : '9px', margin: '0 0 2px 0', color: '#555' }}>
                {settings.storeAddress}
              </p>
            )}
            {settings.showPhone && settings.storePhone && (
              <p style={{ fontSize: is58mm ? '8px' : '9px', margin: '0 0 4px 0', color: '#555' }}>
                Telp/WA: {settings.storePhone}
              </p>
            )}
            <p style={{ borderTop: '1px dashed #000', margin: is58mm ? '4px 0 0 0' : '6px 0 0 0' }} />
          </div>

          {/* Metadata Transaksi */}
          <div style={{ fontSize: is58mm ? '9.5px' : '11px', marginBottom: is58mm ? '4px' : '6px' }}>
            {settings.showOrderNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5px' }}>
                <span>No. Order :</span>
                <span style={{ fontWeight: 'bold' }}>{order.orderNumber}</span>
              </div>
            )}
            {settings.showTableNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5px' }}>
                <span>Meja      :</span>
                <span style={{ fontWeight: 'bold' }}>Meja {order.table?.number ?? '—'}</span>
              </div>
            )}
            {settings.showCustomerName && order.customerName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5px' }}>
                <span>Pemesan   :</span>
                <span style={{ fontWeight: 'bold' }}>{order.customerName}</span>
              </div>
            )}
            {settings.showDateTime && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5px' }}>
                <span>Waktu     :</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            )}
            {settings.showCashierName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kasir     :</span>
                <span>POS System</span>
              </div>
            )}
          </div>

          <p style={{ borderTop: '1px dashed #000', margin: is58mm ? '4px 0' : '6px 0' }} />

          {/* Rincian Item Pesanan */}
          <table style={{ width: '100%', fontSize: is58mm ? '9.5px' : '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed #000' }}>
                <th style={{ textAlign: 'left', paddingBottom: '3px', fontWeight: 'bold' }}>Item</th>
                <th style={{ textAlign: 'center', width: is58mm ? '22px' : '28px', paddingBottom: '3px', fontWeight: 'bold' }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: '3px', fontWeight: 'bold' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items ?? []).map((item, idx) => {
                let modifierText = '';
                if (settings.showModifiers && item.modifiers) {
                  try {
                    const parsed = JSON.parse(item.modifiers);
                    modifierText = Object.values(parsed)
                      .map((m) => m?.name || m)
                      .join(', ');
                  } catch {
                    modifierText = '';
                  }
                }

                return (
                  <tr key={idx} style={{ verticalAlign: 'top' }}>
                    <td style={{ padding: '3px 0' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.product?.name ?? '—'}</div>
                      {modifierText && (
                        <div style={{ fontSize: is58mm ? '8.5px' : '9.5px', color: '#444' }}>
                          [{modifierText}]
                        </div>
                      )}
                      {settings.showItemNotes && item.notes && (
                        <div style={{ fontSize: is58mm ? '8px' : '9px', fontStyle: 'italic', color: '#666' }}>
                          *{item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatRupiah(item.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p style={{ borderTop: '1px dashed #000', margin: is58mm ? '4px 0' : '6px 0' }} />

          {/* Total & Informasi Pembayaran */}
          <div style={{ fontSize: is58mm ? '9.5px' : '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: is58mm ? '11px' : '13px', fontWeight: 'bold', marginBottom: '3px' }}>
              <span>TOTAL</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {settings.showPaymentMethod && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5px' }}>
                <span>Metode Bayar</span>
                <span>{METHOD_LABELS[payment?.method] ?? 'Tunai'}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5px' }}>
              <span>Dibayar</span>
              <span>{formatRupiah(paidAmount)}</span>
            </div>
            {settings.showCashChange && payment?.method === 'CASH' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Kembalian</span>
                <span>{formatRupiah(change)}</span>
              </div>
            )}
          </div>

          {/* Catatan / Footer Struk */}
          <p style={{ borderTop: '1px dashed #000', margin: is58mm ? '6px 0 4px 0' : '8px 0 6px 0' }} />
          <div style={{ textAlign: 'center', fontSize: is58mm ? '8.5px' : '10px', color: '#222' }}>
            {settings.footerThanks && (
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>{settings.footerThanks}</p>
            )}
            {settings.footerNote && (
              <p style={{ margin: '0 0 3px 0', fontSize: is58mm ? '8px' : '9px', color: '#555' }}>
                {settings.footerNote}
              </p>
            )}
            {settings.footerCredit && (
              <p style={{ margin: '0', fontSize: is58mm ? '7.5px' : '8.5px', color: '#777' }}>
                {settings.footerCredit}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}