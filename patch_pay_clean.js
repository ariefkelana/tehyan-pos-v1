const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/PaymentModal.jsx', 'utf8');

c = c.replace(/useEffect\(\(\) => \{\s*if \(isWaitingQris\) \{\s*const handleOrderUpdated =[\s\S]*?return \(\) => socket\.off\('order:updated', handleOrderUpdated\);\s*\}\s*\}, \[isWaitingQris, order\.id, total, setPrintData\]\);/g, "");

fs.writeFileSync('apps/pos/src/components/PaymentModal.jsx', c);