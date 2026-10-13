// File: apps/pos/src/components/ReceiptSettings.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  DEFAULT_RECEIPT_SETTINGS,
  getReceiptSettings,
  saveReceiptSettings,
} from '../lib/receiptSettings.js';
import PrintReceipt from './PrintReceipt.jsx';

export default function ReceiptSettings() {
  const [settings, setSettings] = useState(DEFAULT_RECEIPT_SETTINGS);
  const [isPrintingTest, setIsPrintingTest] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loaded = getReceiptSettings();
    setSettings(loaded);
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    saveReceiptSettings(settings);
    setIsSaved(true);
    toast.success('Pengaturan struk berhasil disimpan!');
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan semua pengaturan struk ke standar bawaan?')) {
      setSettings(DEFAULT_RECEIPT_SETTINGS);
      saveReceiptSettings(DEFAULT_RECEIPT_SETTINGS);
      toast.success('Pengaturan dikembalikan ke default');
    }
  };

  // Mock sample order for preview and test printing
  const mockOrder = {
    orderNumber: 'ORD-SAMPLE',
    table: { number: '02' },
    customerName: 'Kak Dimas',
    createdAt: new Date().toISOString(),
    totalAmount: 36000,
    items: [
      {
        product: { name: 'Teh Tarik Jelly' },
        quantity: 2,
        subtotal: 24000,
        modifiers: JSON.stringify({ suhu: { name: 'Dingin' } }),
        notes: 'Gula normal',
      },
      {
        product: { name: 'Cireng Bumbu Rujak' },
        quantity: 1,
        subtotal: 12000,
        modifiers: null,
        notes: 'Bumbu dipisah',
      },
    ],
  };

  const mockPayment = {
    method: 'CASH',
    amount: 50000,
    change: 14000,
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>🖨️</span> Pengaturan Struk Kasir
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Sesuaikan ukuran kertas printer thermal, identitas toko, dan elemen struk belanja
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleReset}
            className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            Reset Default
          </button>
          <button
            onClick={() => setIsPrintingTest(true)}
            className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>🖨️</span> Test Cetak
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
          >
            <span>💾</span> Simpan Pengaturan
          </button>
        </div>
      </div>

      {/* Main Grid: Form Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Controls Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Paper Size Selection */}
          <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <span>📏</span> 1. Ukuran Kertas Printer Thermal
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Pilih ukuran lebar kertas sesuai dengan tipe printer kasir yang Anda gunakan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 80mm */}
              <label
                onClick={() => handleChange('paperSize', '80mm')}
                className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all ${
                  settings.paperSize === '80mm'
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📄</span>
                  <input
                    type="radio"
                    name="paperSize"
                    value="80mm"
                    checked={settings.paperSize === '80mm'}
                    onChange={() => handleChange('paperSize', '80mm')}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="font-bold text-gray-900 text-sm">80 mm (Standar POS)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Lebar cetak 72mm. Cocok untuk printer kasir desktop USB / LAN (Epson, Xprinter, Iware).
                </p>
                <span className="mt-3 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 self-start">
                  Rekomendasi Utama
                </span>
              </label>

              {/* Option 58mm */}
              <label
                onClick={() => handleChange('paperSize', '58mm')}
                className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-4 transition-all ${
                  settings.paperSize === '58mm'
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📱</span>
                  <input
                    type="radio"
                    name="paperSize"
                    value="58mm"
                    checked={settings.paperSize === '58mm'}
                    onChange={() => handleChange('paperSize', '58mm')}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="font-bold text-gray-900 text-sm">58 mm (Printer Mini)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Lebar cetak 48mm kompak. Cocok untuk printer portable Bluetooth mini / Android POS.
                </p>
                <span className="mt-3 inline-block rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 self-start">
                  Mobile / Bluetooth
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Store Identity (Header) */}
          <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <span>🏪</span> 2. Identitas Kedai (Header Struk)
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Kedai / Usaha
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  placeholder="KEDAI TEHYAN"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Slogan / Sub-judul Toko
                </label>
                <input
                  type="text"
                  value={settings.storeSlogan}
                  onChange={(e) => handleChange('storeSlogan', e.target.value)}
                  placeholder="Spesialis Teh Tarik & Minuman Segar"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alamat Lengkap Kedai
                </label>
                <input
                  type="text"
                  value={settings.storeAddress}
                  onChange={(e) => handleChange('storeAddress', e.target.value)}
                  placeholder="Jl. Margonda Raya, Depok"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    No. Telepon / Kontak
                  </label>
                  <input
                    type="text"
                    value={settings.storePhone}
                    onChange={(e) => handleChange('storePhone', e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-start sm:gap-3 sm:pt-6">
                  <label className="text-xs font-semibold text-gray-700 cursor-pointer select-none" htmlFor="togglePhone">
                    Cetak Nomor Kontak di Struk
                  </label>
                  <input
                    id="togglePhone"
                    type="checkbox"
                    checked={settings.showPhone}
                    onChange={(e) => handleChange('showPhone', e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Toggle Information Visibility */}
          <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <span>👁️</span> 3. Tampilkan / Sembunyikan Informasi Transaksi
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Atur komponen apa saja yang perlu dimuat pada kertas cetakan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { key: 'showOrderNumber', label: 'Nomor Pesanan (Order ID)' },
                { key: 'showTableNumber', label: 'Nomor Meja Pelanggan' },
                { key: 'showCustomerName', label: 'Nama Pemesan' },
                { key: 'showDateTime', label: 'Tanggal & Jam Transaksi' },
                { key: 'showCashierName', label: 'Nama Kasir / Petugas' },
                { key: 'showModifiers', label: 'Varian Produk (Dingin/Panas, dll)' },
                { key: 'showItemNotes', label: 'Catatan Khusus per Item' },
                { key: 'showPaymentMethod', label: 'Metode Pembayaran (Tunai/QRIS)' },
                { key: 'showCashChange', label: 'Rincian Uang Kembalian' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer transition-colors"
                >
                  <span className="text-xs font-medium text-gray-800">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={!!settings[opt.key]}
                    onChange={(e) => handleChange(opt.key, e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Footer Messages */}
          <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <span>💬</span> 4. Pesan Penutup (Footer Struk)
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ucapan Terima Kasih (Baris 1)
                </label>
                <input
                  type="text"
                  value={settings.footerThanks}
                  onChange={(e) => handleChange('footerThanks', e.target.value)}
                  placeholder="Terima kasih atas kunjungan Anda! 🙏"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan Bukti Transaksi (Baris 2)
                </label>
                <input
                  type="text"
                  value={settings.footerNote}
                  onChange={(e) => handleChange('footerNote', e.target.value)}
                  placeholder="Simpan struk ini sebagai bukti pembayaran."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kredit Sistem / Footer Bawah (Baris 3)
                </label>
                <input
                  type="text"
                  value={settings.footerCredit}
                  onChange={(e) => handleChange('footerCredit', e.target.value)}
                  placeholder="Kedai TehYan POS • Cloud System"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Receipt Preview Column (5 Cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="rounded-3xl bg-gray-900 p-5 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <span className="font-bold text-sm">Pratinjau Struk Langsung</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold tracking-wider">
                KERTAS {settings.paperSize}
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Tampilan di bawah diperbarui secara otomatis sesuai dengan input formulir Anda di sebelah kiri.
            </p>

            {/* Simulated Paper Container */}
            <div className="flex justify-center bg-gray-800/60 p-4 rounded-2xl border border-gray-700/60 overflow-hidden">
              <div
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: settings.paperSize === '58mm' ? '10px' : '11.5px',
                  lineHeight: '1.3',
                  width: settings.paperSize === '58mm' ? '240px' : '310px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  padding: settings.paperSize === '58mm' ? '12px 10px' : '16px 14px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: settings.paperSize === '58mm' ? '13px' : '15px', fontWeight: 'bold', margin: '0 0 2px 0' }}>
                    {settings.storeName || 'KEDAI TEHYAN'}
                  </p>
                  {settings.storeSlogan && (
                    <p style={{ fontSize: settings.paperSize === '58mm' ? '8.5px' : '9.5px', margin: '0 0 2px 0', color: '#444' }}>
                      {settings.storeSlogan}
                    </p>
                  )}
                  {settings.storeAddress && (
                    <p style={{ fontSize: settings.paperSize === '58mm' ? '8px' : '9px', margin: '0 0 2px 0', color: '#666' }}>
                      {settings.storeAddress}
                    </p>
                  )}
                  {settings.showPhone && settings.storePhone && (
                    <p style={{ fontSize: settings.paperSize === '58mm' ? '8px' : '9px', margin: '0 0 4px 0', color: '#666' }}>
                      Telp/WA: {settings.storePhone}
                    </p>
                  )}
                  <p style={{ borderTop: '1px dashed #000', margin: '6px 0 0 0' }} />
                </div>

                {/* Info */}
                <div style={{ marginBottom: '6px' }}>
                  {settings.showOrderNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>No. Order :</span>
                      <span style={{ fontWeight: 'bold' }}>ORD-2026-088</span>
                    </div>
                  )}
                  {settings.showTableNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Meja      :</span>
                      <span style={{ fontWeight: 'bold' }}>Meja 02</span>
                    </div>
                  )}
                  {settings.showCustomerName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pemesan   :</span>
                      <span style={{ fontWeight: 'bold' }}>Kak Dimas</span>
                    </div>
                  )}
                  {settings.showDateTime && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Waktu     :</span>
                      <span>13 Okt 2026, 15:30</span>
                    </div>
                  )}
                  {settings.showCashierName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Kasir     :</span>
                      <span>POS System</span>
                    </div>
                  )}
                </div>

                <p style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Items */}
                <table style={{ width: '100%', fontSize: settings.paperSize === '58mm' ? '9.5px' : '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px dashed #000' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '3px' }}>Item</th>
                      <th style={{ textAlign: 'center', width: '25px', paddingBottom: '3px' }}>Qty</th>
                      <th style={{ textAlign: 'right', paddingBottom: '3px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ verticalAlign: 'top' }}>
                      <td style={{ padding: '3px 0' }}>
                        <div style={{ fontWeight: 'bold' }}>Teh Tarik Jelly</div>
                        {settings.showModifiers && (
                          <div style={{ fontSize: '8.5px', color: '#555' }}>[Dingin]</div>
                        )}
                        {settings.showItemNotes && (
                          <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#777' }}>*Gula normal</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '3px 0' }}>2</td>
                      <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatRupiah(24000)}</td>
                    </tr>
                    <tr style={{ verticalAlign: 'top' }}>
                      <td style={{ padding: '3px 0' }}>
                        <div style={{ fontWeight: 'bold' }}>Cireng Rujak</div>
                        {settings.showItemNotes && (
                          <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#777' }}>*Bumbu dipisah</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '3px 0' }}>1</td>
                      <td style={{ textAlign: 'right', padding: '3px 0' }}>{formatRupiah(12000)}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Totals */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: settings.paperSize === '58mm' ? '11px' : '13px' }}>
                    <span>TOTAL</span>
                    <span>{formatRupiah(36000)}</span>
                  </div>
                  {settings.showPaymentMethod && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>Metode</span>
                      <span>Tunai</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Dibayar</span>
                    <span>{formatRupiah(50000)}</span>
                  </div>
                  {settings.showCashChange && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '2px' }}>
                      <span>Kembalian</span>
                      <span>{formatRupiah(14000)}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <p style={{ borderTop: '1px dashed #000', margin: '8px 0 6px 0' }} />
                <div style={{ textAlign: 'center', fontSize: settings.paperSize === '58mm' ? '8.5px' : '9.5px', color: '#333' }}>
                  {settings.footerThanks && (
                    <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>{settings.footerThanks}</p>
                  )}
                  {settings.footerNote && (
                    <p style={{ margin: '0 0 2px 0', fontSize: '8px', color: '#666' }}>{settings.footerNote}</p>
                  )}
                  {settings.footerCredit && (
                    <p style={{ margin: '0', fontSize: '7.5px', color: '#888' }}>{settings.footerCredit}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">Siap uji cetak langsung?</span>
              <button
                onClick={() => setIsPrintingTest(true)}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-gray-900 hover:bg-amber-400 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                <span>🖨️</span> Cetak Lembar Sample
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Print Dialog Trigger */}
      {isPrintingTest && (
        <PrintReceipt
          order={mockOrder}
          payment={mockPayment}
          customSettings={settings}
          onClose={() => setIsPrintingTest(false)}
        />
      )}
    </div>
  );
}
