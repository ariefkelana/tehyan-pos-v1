const fs=require('fs');
let c=fs.readFileSync('apps/pos/src/App.jsx', 'utf8');
c=c.replace(/\{ id: 'cashier'.*/, "{ id: 'cashier', label: 'Kasir', icon: '💰' },");
c=c.replace(/\{ id: 'menu'.*/, "{ id: 'menu', label: 'Menu', icon: '🍽️' },");
c=c.replace(/\{ id: 'tables'.*/, "{ id: 'tables', label: 'Meja', icon: '🪑' },");
c=c.replace(/\{ id: 'reports'.*/, "{ id: 'reports', label: 'Laporan', icon: '📊' },");
c=c.replace(/\{ id: 'users'.*/, "{ id: 'users', label: 'Akun', icon: '👥' },");
fs.writeFileSync('apps/pos/src/App.jsx', c);