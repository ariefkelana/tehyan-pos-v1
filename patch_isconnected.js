const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');

c = c.replace(/className=\{clsx\(\s*'h-2\.5 w-2\.5 rounded-full',\s*isConnected \? 'bg-emerald-500 shadow-\[0_0_8px_rgba\(16,185,129,0\.5\)\]' : 'bg-red-500 animate-pulse'\s*\)\}\s*title=\{isConnected \? 'Real-time aktif' : 'Terputus'\}/g, "className={clsx('h-2.5 w-2.5 rounded-full', 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]')} title={'Polling aktif'}");

fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);