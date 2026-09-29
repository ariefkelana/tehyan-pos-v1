const fs = require('fs');
let c = fs.readFileSync('apps/qr-web/components/CheckoutModal.jsx', 'utf8');

c = c.replace(/import \{ io \} from 'socket\.io-client';\r?\n/, '');
c = c.replace(/const socketRef = useRef\(null\);\r?\n/, '');

// The useEffect that sets up socket
c = c.replace(/useEffect\(\(\) => \{\s*socketRef\.current = io\(BACKEND_URL[\s\S]*?socketRef\.current\.disconnect\(\);\s*\};\s*\}, \[table\.id, orderStatus\]\);/g, "");

fs.writeFileSync('apps/qr-web/components/CheckoutModal.jsx', c);