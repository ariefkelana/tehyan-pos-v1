const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');
c = c.replace("transports: ['websocket', 'polling']", "transports: ['polling'], upgrade: false");
fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);