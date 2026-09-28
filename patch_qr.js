const fs = require('fs');
let c = fs.readFileSync('apps/qr-web/components/CheckoutModal.jsx', 'utf8');
c = c.replace("modifiers: item.selectedMods", "modifiers: item.selectedMods ? JSON.stringify(item.selectedMods) : null");
fs.writeFileSync('apps/qr-web/components/CheckoutModal.jsx', c);