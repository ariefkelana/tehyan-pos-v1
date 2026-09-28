const fs = require('fs');
let c = fs.readFileSync('apps/qr-web/components/CheckoutModal.jsx', 'utf8');

c = c.replace(/setConfirmedOrderNumber\(data\.data\.orderNumber\);/g, "setConfirmedOrderNumber(data.data.orderNumber);\n      setInternalOrderId(data.data.id);");
c = c.replace(/orderStatus === 'waiting_qris'/g, "orderStatus === 'qris'");

fs.writeFileSync('apps/qr-web/components/CheckoutModal.jsx', c);