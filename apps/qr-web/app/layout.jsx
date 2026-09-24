// File: apps/qr-web/app/layout.jsx

import './globals.css';

export const metadata = {
  title: 'Kedai TehYan — Menu Digital',
  description: 'Pesan langsung dari meja Anda. Mudah, cepat, dan tanpa antre.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#f59e0b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-amber-50">
        {/* Global top brand bar */}
        <header className="sticky top-0 z-40 bg-amber-500 px-4 py-3 shadow-md">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <span className="text-2xl">🍵</span>
            <p className="text-base font-bold text-white leading-tight">Kedai TehYan</p>
          </div>
        </header>

        <main className="mx-auto max-w-lg pb-safe-bottom">{children}</main>

        {/* Global footer */}
        <footer className="mt-8 py-6 text-center text-xs text-amber-700/60">
          © {new Date().getFullYear()} Kedai TehYan. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
