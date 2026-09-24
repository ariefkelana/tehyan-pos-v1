// File: apps/qr-web/app/not-found.jsx

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-7xl">😕</span>
      <h1 className="text-2xl font-bold text-gray-800">Meja Tidak Ditemukan</h1>
      <p className="text-sm text-gray-500 max-w-xs">
        Nomor meja yang Anda scan tidak valid atau belum terdaftar. Hubungi kasir untuk bantuan.
      </p>
      <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-xs text-amber-700">
        💡 Pastikan Anda scan QR code yang benar di meja Anda.
      </div>
    </div>
  );
}
