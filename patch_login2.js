const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/LoginPage.jsx', 'utf8');

c = c.replace(/className="mt-4 flex w-full items-center justify-center rounded-2xl bg-wall py-4 text-sm font-bold text-mural-blue shadow-\[0_8px_30px_rgba\(0,0,0,0\.2\)\] disabled:opacity-60 disabled:cursor-not-allowed transition-transform active:scale-95"/g, 'className="mt-4 flex w-full items-center justify-center rounded-2xl bg-mural-red py-4 text-sm font-bold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-transform active:scale-95 hover:bg-mural-red/90"');

fs.writeFileSync('apps/pos/src/components/LoginPage.jsx', c);