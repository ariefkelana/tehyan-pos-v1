const fs = require('fs');
let c = fs.readFileSync('apps/pos/src/components/PaymentModal.jsx', 'utf8');

const pollingCode = `
  // Poll status for Vercel Serverless compatibility
  useEffect(() => {
    let interval;
    if (isWaitingQris && order?.id) {
      interval = setInterval(async () => {
        try {
          const { data } = await api.get(\`/orders/\${order.id}\`);
          if (data.success && data.data.status === 'PAID') {
            toast.success('Pembayaran QRIS Berhasil Masuk!');
            setPrintData({ payment: { orderId: order.id, method: 'QRIS', amount: total, change: 0, status: 'PAID' } });
            clearInterval(interval);
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isWaitingQris, order?.id, total, setPrintData]);
`;

// Insert it somewhere. Let's just append it before `const handleSubmit = async (e) => {`
c = c.replace("  const handleSubmit = async (e) => {", pollingCode + "\n  const handleSubmit = async (e) => {");

fs.writeFileSync('apps/pos/src/components/PaymentModal.jsx', c);