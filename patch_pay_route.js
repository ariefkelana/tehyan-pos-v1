const fs = require('fs');
let c = fs.readFileSync('apps/backend/src/routes/api.js', 'utf8');

const newRoute = `
/**
 * POST /api/orders/:id/pay
 * Manual payment for CASH / TRANSFER
 */
router.post('/orders/:id/pay', requireAuth, [
  param('id').isInt(),
  body('method').isIn(['CASH', 'TRANSFER', 'CARD']),
  body('amount').isFloat()
], async (req, res) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const orderId = parseInt(req.params.id, 10);
    const { method, amount } = req.body;
    
    const order = await req.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'PAID') return res.status(400).json({ success: false, message: 'Order is already paid' });

    const totalAmount = parseFloat(order.totalAmount);
    const paidAmount = parseFloat(amount);
    const change = method === 'CASH' ? paidAmount - totalAmount : 0;

    const payment = await req.prisma.$transaction(async (tx) => {
      const p = await tx.payment.upsert({
        where: { orderId },
        update: { method, amount: paidAmount, change, status: 'PAID', paidAt: new Date() },
        create: { orderId, method, amount: paidAmount, change, status: 'PAID', paidAt: new Date() }
      });
      await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
      return p;
    });

    req.io.to('cashier-room').emit('order:updated', { id: orderId, status: 'PAID' });
    req.io.to('table-' + order.tableId).emit('order:paid', { id: orderId });

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('[POST /orders/:id/pay]', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});
`;

c = c.replace("module.exports = router;", newRoute + "\nmodule.exports = router;");
fs.writeFileSync('apps/backend/src/routes/api.js', c);