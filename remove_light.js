const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');

// Replace the indicator logic
c = c.replace(/<span className=\{clsx\('h-2\.5 w-2\.5 rounded-full', isConnected \? 'bg-emerald-500 .* : 'bg-red-500 animate-pulse'\)\} title=\{isConnected \? 'Real-time aktif' : 'Terputus'\} \/>/, "");

fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);
