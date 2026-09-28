const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/UserManager.jsx', 'utf8');

c = c.replace(/<span className=\{\\ounded-full px-2.5 py-1 text-xs font-semibold \\\{u.role === 'ADMIN' \? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'\}\\\}>/, "<span className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + (u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>");

fs.writeFileSync('apps/pos/src/components/UserManager.jsx', c);
