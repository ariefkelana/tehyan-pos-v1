const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/ReportsDashboard.jsx', 'utf8');
c = c.replace(/const paidOrders = filteredOrders\.filter\(\(o\) => o\.status === 'PAID'\);/g, "const paidOrders = filteredOrders.filter((o) => ['PAID', 'PREPARING', 'READY', 'SERVED'].includes(o.status));");
fs.writeFileSync('apps/pos/src/components/ReportsDashboard.jsx', c);
