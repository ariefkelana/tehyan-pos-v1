'use strict';
const express = require('express');
const midtransClient = require('midtrans-client');
const router = express.Router();

const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SANDBOX_KEY',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_SANDBOX_KEY'
});

router.post('/qris', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });
    const order = await req.prisma.order.findUnique({ where: { id: parseInt(orderId, 10) } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'PAID') return res.status(400).json({ success: false, message: 'Order is already paid' });

    const midtransOrderId = 'ORDER-' + order.id + '-' + Date.now();
    const parameter = {
      payment_type: 'gopay',
      transaction_details: { order_id: midtransOrderId, gross_amount: Math.round(Number(order.totalAmount)) },
      custom_field1: order.id.toString()
    };

    const response = await coreApi.charge(parameter);
    if (response.status_code === '201') {
      const qrUrl = response.actions?.find(a => a.name === 'generate-qr-code')?.url;
      await req.prisma.payment.upsert({
        where: { orderId: order.id },
        update: { method: 'QRIS', amount: order.totalAmount, transactionId: midtransOrderId, status: 'UNPAID' },
        create: { orderId: order.id, method: 'QRIS', amount: order.totalAmount, transactionId: midtransOrderId, status: 'UNPAID' }
      });
      res.json({ success: true, qrUrl, midtransOrderId });
    } else {
      res.status(500).json({ success: false, message: 'Gagal membuat QRIS', error: response });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/webhook', express.json(), async (req, res) => {
  try {
    const notification = await coreApi.transaction.notification(req.body);
    const orderIdStr = notification.custom_field1;
    if (!orderIdStr) return res.status(200).send('OK');

    const internalOrderId = parseInt(orderIdStr, 10);
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let paymentStatus = 'UNPAID';
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus !== 'challenge') paymentStatus = 'PAID';
    }

    if (paymentStatus === 'PAID') {
      await req.prisma.$transaction(async (tx) => {
        await tx.payment.update({ where: { orderId: internalOrderId }, data: { status: 'PAID', paidAt: new Date() } });
        await tx.order.update({ where: { id: internalOrderId }, data: { status: 'PAID' } });
      });
      req.io.to('cashier-room').emit('order:updated', { id: internalOrderId, status: 'PAID' });
      const order = await req.prisma.order.findUnique({ where: { id: internalOrderId } });
      if (order) req.io.to('table-' + order.tableId).emit('order:paid', { id: internalOrderId });
    }
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Error');
  }
});

module.exports = router;