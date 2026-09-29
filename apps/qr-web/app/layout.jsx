// File: apps/qr-web/app/layout.jsx

import './globals.css';
import BackgroundMural from '../components/BackgroundMural.jsx';

export const metadata = {
  title: 'Kedai Teh Yan',
  description: 'Pesan langsung dari meja Anda. Mudah, cepat, dan tanpa antre.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#8b2727',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="min-h-screen bg-transparent font-sans text-gray-800 relative z-0">`n        <BackgroundMural opacity="opacity-10" />
        {/* Global top brand bar */}
        <header className="sticky top-0 z-40 bg-[rgba(245,242,235,0.9)] backdrop-blur px-4 py-3 shadow-sm border-b border-gray-200">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <div className="bg-wall border-[3px] border-mural-red p-[3px] transform hover:scale-105 transition-transform duration-300">
              <div className="border-[2px] border-mural-blue px-3 py-1 bg-wall flex justify-center items-center">
                <span className="font-cursive text-xl font-bold text-mural-blue" style={{lineHeight: 1}}>Teh Yan</span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-lg pb-safe-bottom">{children}</main>

        {/* Global footer */}
        <footer className="mt-8 py-6 text-center text-xs text-gray-500 font-light border-t border-gray-200">
          &copy; {new Date().getFullYear()} Kedai Teh Yan. Seluruh Hak Cipta Dilindungi.
        </footer>
      </body>
    </html>
  );
}