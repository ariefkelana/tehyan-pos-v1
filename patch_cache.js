const fs = require('fs');

// Patch QR Web
let c = fs.readFileSync('apps/qr-web/components/CheckoutModal.jsx', 'utf8');
c = c.replace(/fetch\(\`\$\{BACKEND_URL\}\/api\/orders\/\$\{internalOrderId\}\`\)/g, "fetch(\`\${BACKEND_URL}/api/orders/\${internalOrderId}?t=\${Date.now()}\`)");
fs.writeFileSync('apps/qr-web/components/CheckoutModal.jsx', c);

// Patch POS
let p = fs.readFileSync('apps/pos/src/components/PaymentModal.jsx', 'utf8');
p = p.replace(/api\.get\(\`\/orders\/\$\{order\.id\}\`\)/g, "api.get(\`/orders/\${order.id}?t=\${Date.now()}\`)");
fs.writeFileSync('apps/pos/src/components/PaymentModal.jsx', p);