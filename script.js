const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/CashierView.jsx', 'utf8');
c = c.replace(/axios\.get.*/g, "axios.get(API_BASE + '/orders', { headers: { Authorization: 'Bearer ' + localStorage.getItem('pos_token') } });");
c = c.replace(/axios\.patch.*/g, "axios.patch(API_BASE + '/orders/' + orderId + '/status', { status: newStatus }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('pos_token') } });");
fs.writeFileSync('apps/pos/src/components/CashierView.jsx', c);
