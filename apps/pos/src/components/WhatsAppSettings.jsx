// File: apps/pos/src/components/WhatsAppSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function WhatsAppSettings() {
  const [status, setStatus] = useState({
    status: 'DISCONNECTED',
    isConnected: false,
    qrCode: null,
    connectedNumber: null,
    lastConnectedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const pollIntervalRef = useRef(null);

  // Fetch status from backend
  const fetchStatus = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.get('/whatsapp/status');
      if (res.data?.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.error('[WhatsAppSettings] Failed to fetch status:', err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto poll every 3.5 seconds to track QR scan or connection updates
    pollIntervalRef.current = setInterval(() => {
      fetchStatus(true);
    }, 3500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleConnect = async () => {
    setIsActionLoading(true);
    try {
      await api.post('/whatsapp/connect');
      toast.success('Inisialisasi WhatsApp dimulai...');
      await fetchStatus(true);
    } catch (err) {
      toast.error(err.message || 'Gagal memulai koneksi WhatsApp');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Yakin ingin memutuskan koneksi akun WhatsApp ini?')) return;
    setIsActionLoading(true);
    try {
      await api.post('/whatsapp/disconnect');
      toast.success('Koneksi WhatsApp berhasil diputuskan.');
      await fetchStatus(true);
    } catch (err) {
      toast.error(err.message || 'Gagal memutuskan WhatsApp');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error('Masukkan nomor WhatsApp tujuan uji coba');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await api.post('/whatsapp/send-test', {
        phone: testPhone.trim(),
        message: testMessage.trim() || undefined,
      });
      if (res.data?.success) {
        toast.success('✅ Pesan uji coba berhasil dikirim!');
        setTestMessage('');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim pesan uji coba');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>💬</span> WhatsApp Bot Otomatis (Self-Hosted)
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Integrasi bot pesan otomatis tanpa pihak ketiga: kirim E-Receipt dan notifikasi pesanan siap secara mandiri
          </p>
        </div>

        <button
          onClick={() => fetchStatus(false)}
          disabled={isLoading || isActionLoading}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
        >
          <span className={isLoading ? 'animate-spin' : ''}>🔄</span> Segarkan Status
        </button>
      </div>

      {/* Main Grid: Status / QR Code + Test Sender */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Status & QR Scanner (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Box */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <span>📡</span> Status Koneksi Bot
            </h3>

            {status.status === 'CONNECTED' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl text-white shadow-sm shadow-emerald-200">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-base font-bold text-emerald-950">Terhubung ke WhatsApp</p>
                    </div>
                    <p className="text-xs font-medium text-emerald-700 mt-0.5">
                      Nomor Kedai: <span className="font-bold">+{status.connectedNumber || 'Aktif'}</span>
                    </p>
                    {status.lastConnectedAt && (
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        Aktif sejak: {new Date(status.lastConnectedAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">
                    Bot aktif di latar belakang dan siap mengirim notifikasi otomatis.
                  </p>
                  <button
                    onClick={handleDisconnect}
                    disabled={isActionLoading}
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 active:scale-95 transition-all shadow-sm"
                  >
                    Putuskan Hubungan (Logout)
                  </button>
                </div>
              </div>
            ) : status.status === 'WAITING_QR' ? (
              <div className="space-y-5 text-center">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-left">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <span className="text-lg">📸</span> Pindai Kode QR WhatsApp
                  </div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Buka WhatsApp di ponsel kedai Anda, masuk ke <strong>Pengaturan &gt; Perangkat Tertaut &gt; Tautkan Perangkat</strong>, lalu scan kode QR di bawah ini:
                  </p>
                </div>

                <div className="flex justify-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  {status.qrCode ? (
                    <div className="relative inline-block rounded-2xl bg-white p-4 shadow-md border border-gray-200">
                      <img
                        src={status.qrCode}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 mx-auto object-contain"
                      />
                      <p className="text-[11px] text-gray-400 mt-2 font-mono">
                        Kode QR diperbarui otomatis
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <span className="text-3xl animate-spin">⏳</span>
                      <p className="text-xs text-gray-500">Menghasilkan kode QR baru...</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleConnect}
                    disabled={isActionLoading}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                  >
                    Minta Kode QR Baru
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-300 text-2xl text-gray-600">
                    ✕
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Bot WhatsApp Belum Ditautkan</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Klik tombol di bawah untuk menampilkan kode QR dan menautkan nomor kedai.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={isActionLoading}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>📲</span> Tautkan Akun WhatsApp Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Feature Explanations */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <span>⚡</span> Alur Otomatisasi Sistem
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <span>🧾</span> E-Receipt Otomatis
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Terkirim detik itu juga saat pelanggan menyelesaikan pembayaran (CASH/QRIS), lengkap dengan rincian menu dan total belanja.
                </p>
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <span>📢</span> Notifikasi Siap Ambil
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Terkirim otomatis saat barista/kasir mengubah status pesanan ke <strong>READY</strong>, memanggil pelanggan untuk mengambil pesanan di kasir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Uji Coba Kirim Pesan (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
              <span>🧪</span> Uji Coba Pengiriman
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Kirimkan pesan uji coba ke nomor WhatsApp Anda sendiri untuk memastikan bot terhubung dan dapat mengirim pesan dengan lancar.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor WhatsApp Tujuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Format bisa diawali 08... atau 628... (tanda strip dan spasi akan dibersihkan otomatis).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pesan Kustom (Opsional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Kosongkan jika ingin menggunakan draf pesan tes bawaan..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingTest || status.status !== 'CONNECTED'}
                className={`w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                  status.status === 'CONNECTED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-200'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSendingTest ? (
                  <>
                    <span className="animate-spin">⏳</span> Mengirim...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Kirim Pesan Uji Coba
                  </>
                )}
              </button>

              {status.status !== 'CONNECTED' && (
                <p className="text-[11px] text-center text-amber-700 bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                  ⚠️ Pindai kode QR terlebih dahulu agar bot terhubung sebelum melakukan uji coba.
                </p>
              )}
            </form>
          </div>

          {/* Cara Kerja Self-Hosted Card */}
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-emerald-50/30 p-5 space-y-2.5">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>🛡️</span> Keunggulan Metode Self-Hosted (Baileys)
            </h4>
            <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc list-inside">
              <li><strong>100% Gratis:</strong> Tanpa langganan bulanan ke penyedia gateway pihak ketiga.</li>
              <li><strong>Nomor Asli Kedai:</strong> Pesan dikirim langsung dari nomor WhatsApp resmi kedai Anda.</li>
              <li><strong>Multi-Device:</strong> Ponsel kedai tetap bisa dipakai chat seperti biasa tanpa terganggu.</li>
              <li><strong>Otomatis:</strong> Kasir tidak perlu membuka tab WhatsApp Web lagi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
