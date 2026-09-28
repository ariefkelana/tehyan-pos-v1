const fs = require('fs');

let payments = fs.readFileSync('apps/backend/src/routes/payments.js', 'utf8');
payments = payments.replace("payment_type: 'qris'", "payment_type: 'gopay'");
fs.writeFileSync('apps/backend/src/routes/payments.js', payments);

let checkout = fs.readFileSync('apps/qr-web/components/CheckoutModal.jsx', 'utf8');
checkout = checkout.replace("const res = await fetch(\\/api/orders\\, {", "const res = await fetch(BACKEND_URL + '/api/orders', {");
fs.writeFileSync('apps/qr-web/components/CheckoutModal.jsx', checkout);