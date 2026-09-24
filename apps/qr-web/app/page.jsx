// File: apps/qr-web/app/page.jsx
// Root page — shown when user visits "/" without a table ID

import Link from 'next/link';

export const metadata = {
  title: 'Kedai TehYan — Selamat Datang',
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center bg-zinc-50 pb-20">
      <span className="text-8xl drop-shadow-xl animate-bounce">🍵</span>
      <div>
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Kedai TehYan</h1>
        <p className="mt-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">Sistem Pemesanan Digital</p>
      </div>

      <div className="w-full max-w-sm rounded-[2rem] bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 text-left space-y-4">
        <p className="text-sm font-black text-zinc-900 uppercase tracking-wide">Cara Memesan:</p>
        <ol className="space-y-4 text-sm font-medium text-gray-500">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-black text-xs shrink-0">1</span>
            Scan QR code yang ada di meja Anda
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-black text-xs shrink-0">2</span>
            Pilih menu & sesuaikan pesanan (topping/es)
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-black text-xs shrink-0">3</span>
            Kirim pesanan dan lakukan pembayaran di kasir
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white font-black text-xs shrink-0">4</span>
            Tunggu notifikasi WA saat minuman siap! 🎉
          </li>
        </ol>
      </div>

      <p className="text-xs font-bold text-gray-400 mt-4">
        Butuh bantuan? Silakan hubungi kasir.
      </p>
    </div>
  );
}
