const fs = require('fs');
let c = fs.readFileSync('apps/qr-web/components/OrderStatusBanner.jsx', 'utf8');

// Remove socket import
c = c.replace(/import \{ io \} from 'socket\.io-client';\r?\n/, "");
c = c.replace(/const socketRef = useRef\(null\);\r?\n/, "");

// Replace useEffect
c = c.replace(/useEffect\(\(\) => \{\s*if \(!tableId\) return;\s*const socket = io[\s\S]*?return \(\) => socket\.disconnect\(\);\s*\}, \[tableId\]\);/g, `useEffect(() => {
    if (!tableId || !orderNumber) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(\`\${BACKEND_URL}/api/tables/\${tableId}\`);
        if (res.ok) {
           const data = await res.json();
           // Find the order that matches orderNumber
           const matchingOrder = data.data.orders?.find(o => o.orderNumber === orderNumber);
           if (matchingOrder) {
              setOrderStatus(matchingOrder.status);
           }
        }
      } catch (e) {
        // ignore
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [tableId, orderNumber]);`);

fs.writeFileSync('apps/qr-web/components/OrderStatusBanner.jsx', c);