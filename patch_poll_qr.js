const fs = require('fs');
let c = fs.readFileSync('apps/qr-web/components/CheckoutModal.jsx', 'utf8');

const pollingCode = `
  // Poll status for Vercel Serverless compatibility
  useEffect(() => {
    let interval;
    if (orderStatus === 'waiting_qris' && internalOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(\`\${BACKEND_URL}/api/orders/\${internalOrderId}\`);
          const data = await res.json();
          if (data.success && data.data.status === 'PAID') {
            setOrderStatus('success_qris');
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [orderStatus, internalOrderId]);
`;

// Insert after the socket useEffect
c = c.replace(/socketRef\.current\.disconnect\(\);\s*};\s*}, \[table\.id, orderStatus\]\);/g, "socketRef.current.disconnect();\n    };\n  }, [table.id, orderStatus]);\n\n" + pollingCode);

fs.writeFileSync('apps/qr-web/components/CheckoutModal.jsx', c);