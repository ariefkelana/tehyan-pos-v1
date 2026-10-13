// File: apps/pos/src/components/WhatsAppSettings.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function WhatsAppSettings() {
  const [status, setStatus] = useState({
    configured: false,
    isConnected: false,
    status: 'NOT_CONFIGURED',
    device: null,
    quota: null,
    expired: null,
    reason: null,
    tokenPreview: null,
  });
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

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
    // Also check local storage for token convenience
    const savedLocal = localStorage.getItem('tehyan_fonnte_token');
    if (savedLocal) {
      setTokenInput(savedLocal);
    }
  }, []);

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast.error('Masukkan Token API Fonnte Anda');
      return;
    }
    setIsSavingToken(true);
    try {
      const res = await api.post('/whatsapp/token', {
        token: tokenInput.trim(),
      });
      if (res.data?.success) {
        localStorage.setItem('tehyan_fonnte_token', tokenInput.trim());
        toast.success(res.data.message || 'Token Fonnte berhasil disimpan!');
        setStatus(res.data.data);
      }
    } catch (err) {
      toast.error(err.message || 'Token Fonnte tidak valid');
    } finally {
      setIsSavingToken(false);
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
        toast.success('✅ Pesan uji coba berhasil dikirim via Fonnte!');
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
            <span>💬</span> WhatsApp Gateway (Fonnte API)
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Integrasi cloud-native 100% kompatibel dengan Vercel: kirim E-Receipt dan panggilan pesanan siap secara otomatis
          </p>
        </div>

        <button
          onClick={() => fetchStatus(false)}
          disabled={isLoading || isSavingToken}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
        >
          <span className={isLoading ? 'animate-spin' : ''}>🔄</span> Cek Status Koneksi
        </button>
      </div>

      {/* Main Grid: Token & Status + Test Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Device Status & Token Config (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Badge Box */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <span>📡</span> Status Perangkat Kedai
            </h3>

            {status.isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl text-white shadow-sm shadow-emerald-200">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-base font-bold text-emerald-950">Terhubung ke WhatsApp Kedai</p>
                    </div>
                    <p className="text-xs font-medium text-emerald-800 mt-0.5">
                      Nomor Aktif: <span className="font-bold">+{status.device}</span>
                    </p>
                    <div className="flex flex-wrap gap-4 text-[11px] text-emerald-700 mt-1">
                      <span>Sisa Kuota: <strong>{status.quota ?? '-'} pesan</strong></span>
                      {status.expired && <span>Masa Aktif: <strong>{status.expired}</strong></span>}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  ✅ Gateway aktif! Setiap pesanan yang dibayar dan setiap status pesanan yang diubah menjadi <strong>READY</strong> akan otomatis dikirimkan ke WhatsApp pelanggan.
                </p>
              </div>
            ) : status.configured ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-2xl text-white">
                    ⚠️
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-950">Token Tersimpan, Perangkat Belum Terhubung</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {status.reason || 'Nomor WhatsApp Anda belum di-scan di dashboard Fonnte.'}
                    </p>
                    {status.tokenPreview && (
                      <p className="text-[11px] text-amber-700 mt-1">
                        Token aktif: <span className="font-mono font-semibold">{status.tokenPreview}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-800">Cara menyambungkan WhatsApp Anda:</p>
                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                    <li>Buka dashboard Fonnte di <a href="https://md.fonnte.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">md.fonnte.com</a>.</li>
                    <li>Pada menu <strong>Device</strong>, klik ikon <strong>Scan QR</strong>.</li>
                    <li>Scan menggunakan WhatsApp ponsel kedai Anda.</li>
                    <li>Setelah itu, klik tombol <strong>"Cek Status Koneksi"</strong> di atas.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-300 text-2xl text-gray-600">
                    ✕
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Token Fonnte Belum Dikonfigurasi</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Masukkan Token API Fonnte Anda pada formulir di bawah untuk mengaktifkan bot.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Token Configuration Box */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <span>🔑</span> Pengaturan API Token Fonnte
            </h3>

            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  API Token Fonnte
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="Tempelkan API Token Fonnte Anda di sini..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-3.5 pr-20 py-2.5 text-xs text-gray-900 font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1"
                  >
                    {showToken ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  Dapatkan token di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">fonnte.com</a> &gt; Menu <strong>Device</strong> &gt; Salin <strong>Token</strong>.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingToken}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
              >
                {isSavingToken ? (
                  <>
                    <span className="animate-spin">⏳</span> Menyimpan &amp; Memverifikasi...
                  </>
                ) : (
                  <>
                    <span>💾</span> Simpan &amp; Hubungkan Token
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panduan 3 Langkah Cepat */}
          <div className="rounded-2xl border border-gray-200 bg-emerald-50/40 p-5 space-y-2">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span>💡</span> Panduan Cepat Mendapatkan Token Fonnte (3 Langkah)
            </h4>
            <ol className="text-[11px] text-emerald-900 list-decimal list-inside space-y-1 leading-relaxed">
              <li>Daftar akun gratis di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="font-bold underline">fonnte.com</a> lalu buka dashboard.</li>
              <li>Pilih menu <strong>Device</strong>, scan QR code dengan WhatsApp kedai Anda (Perangkat Tertaut).</li>
              <li>Salin <strong>Token</strong> yang ada di dashboard Fonnte dan tempelkan ke form di atas, lalu klik Simpan.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Uji Coba Pengiriman Pesan (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
              <span>🧪</span> Uji Coba Pengiriman Langsung
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
                  Format bisa diawali 08... atau 628... (tanda strip dan spasi dibersihkan otomatis).
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
                disabled={isSendingTest || !status.configured}
                className={`w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                  status.configured
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

              {!status.configured && (
                <p className="text-[11px] text-center text-amber-700 bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                  ⚠️ Masukkan dan simpan token Fonnte terlebih dahulu untuk menguji coba.
                </p>
              )}
            </form>
          </div>

          {/* Alur Kerja Otomatis */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <span>⚡</span> Pemicu Notifikasi Otomatis
            </h4>

            <div className="space-y-2.5">
              <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3 space-y-1">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span>🧾</span> E-Receipt Saat Pelanggan Bayar
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Terkirim detik itu juga saat kasir mengonfirmasi bayar (CASH/QRIS), lengkap dengan rincian item belanjaan.
                </p>
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3 space-y-1">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>📢</span> Alert Panggilan Saat "READY"
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Terkirim detik itu juga saat barista/kasir mengubah status pesanan ke READY, memanggil pelanggan untuk mengambil minuman di bar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
