// File: apps/backend/src/routes/api.js

'use strict';

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { sendWhatsApp } = require('../utils/whatsapp');

const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ─── Helper ──────────────────────────────────────────────────────────────────
/**
 * Extracts validation errors and sends a 422 response if any exist.
 * @returns {boolean} true if there were errors (response already sent)
 */
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTS / MENU
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/products
 * Returns all available products, optionally filtered by category.
 */
router.get('/products', [query('categoryId').optional().isInt()], async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const { categoryId, search } = req.query;

    const products = await req.prisma.product.findMany({
      where: {
        isAvailable: true,
        ...(categoryId && { categoryId: parseInt(categoryId, 10) }),
        ...(search && {
          name: { contains: search },
        }),
      },
      include: { 
        category: true,
        modifiers: { include: { options: true } }
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('[GET /products]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/products/:id', [param('id').isInt()], async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  try {
    const product = await req.prisma.product.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: { 
        category: true,
        modifiers: {
          include: { options: true },
        }
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[GET /products/:id]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
});

/**
 * POST /api/products
 * Create a new product.
 */
router.post(
  '/products',
  requireAuth,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Product name is required.'),
    body('price').isDecimal({ decimal_digits: '0,2' }).withMessage('Price must be a valid decimal.'),
    body('categoryId').isInt({ min: 1 }).withMessage('Valid categoryId is required.'),
    body('description').optional().trim(),
    body('imageUrl').optional().trim().isURL().withMessage('imageUrl must be a valid URL.'),
    body('isAvailable').optional().isBoolean(),
    body('stock').optional().isInt({ min: 0 }),
    body('isStockTracked').optional().isBoolean(),
    body('modifiers').optional().isArray(),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;

    try {
      const { name, price, categoryId, description, imageUrl, isAvailable, stock, isStockTracked, modifiers } = req.body;

      const product = await req.prisma.product.create({
        data: {
          name,
          price,
          categoryId: parseInt(categoryId, 10),
          description: description || null,
          imageUrl: imageUrl || null,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          stock: stock !== undefined ? parseInt(stock, 10) : 0,
          isStockTracked: isStockTracked !== undefined ? isStockTracked : false,
          ...(modifiers && {
            modifiers: {
              create: modifiers.map((mod) => ({
                name: mod.name,
                isRequired: mod.isRequired || false,
                multiple: mod.multiple || false,
                options: {
                  create: (mod.options || []).map((opt) => ({
                    name: opt.name,
                    additionalPrice: opt.additionalPrice || 0,
                  })),
                },
              })),
            },
          }),
        },
        include: { 
          category: true,
          modifiers: { include: { options: true } }
        },
      });

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      console.error('[POST /products]', error);
      if (error.code === 'P2003') {
        return res.status(400).json({ success: false, message: 'Category not found.' });
      }
      res.status(500).json({ success: false, message: 'Failed to create product.' });
    }
  }
);

/**
 * PATCH /api/products/:id
 * Update a product (partial update).
 */
router.patch(
  '/products/:id',
  [
    param('id').isInt(),
    body('name').optional().trim().notEmpty(),
    body('price').optional().isDecimal({ decimal_digits: '0,2' }),
    body('categoryId').optional().isInt({ min: 1 }),
    body('isAvailable').optional().isBoolean(),
    body('stock').optional().isInt({ min: 0 }),
    body('isStockTracked').optional().isBoolean(),
    body('modifiers').optional().isArray(),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;

    try {
      const id = parseInt(req.params.id, 10);
      const { name, price, categoryId, description, imageUrl, isAvailable, stock, isStockTracked, modifiers } = req.body;

      const product = await req.prisma.$transaction(async (tx) => {
        if (modifiers !== undefined) {
          // Delete existing modifiers so we can replace them cleanly
          await tx.productModifier.deleteMany({ where: { productId: id } });
        }

        return await tx.product.update({
          where: { id },
          data: {
            ...(name !== undefined && { name }),
            ...(price !== undefined && { price }),
            ...(categoryId !== undefined && { categoryId: parseInt(categoryId, 10) }),
            ...(description !== undefined && { description }),
            ...(imageUrl !== undefined && { imageUrl }),
            ...(isAvailable !== undefined && { isAvailable }),
            ...(stock !== undefined && { stock: parseInt(stock, 10) }),
            ...(isStockTracked !== undefined && { isStockTracked }),
            ...(modifiers && {
              modifiers: {
                create: modifiers.map((mod) => ({
                  name: mod.name,
                  isRequired: mod.isRequired || false,
                  multiple: mod.multiple || false,
                  options: {
                    create: (mod.options || []).map((opt) => ({
                      name: opt.name,
                      additionalPrice: opt.additionalPrice || 0,
                    })),
                  },
                })),
              },
            }),
          },
          include: { 
            category: true,
            modifiers: { include: { options: true } }
          },
        });
      });

      res.json({ success: true, data: product });
    } catch (error) {
      console.error('[PATCH /products/:id]', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      res.status(500).json({ success: false, message: 'Failed to update product.' });
    }
  }
);

/**
 * DELETE /api/products/:id
 */
router.delete('/products/:id', requireAuth, requireAdmin, [param('id').isInt()], async (req, res) => {
  if (handleValidationErrors(req, res)) return;

  try {
    await req.prisma.product.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

router.get('/categories', async (req, res) => {
  try {
    const categories = await req.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// TABLES
// ════════════════════════════════════════════════════════════════════════════

router.get('/tables', requireAuth, async (req, res) => {
  try {
    const tables = await req.prisma.table.findMany({ orderBy: { number: 'asc' } });
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tables.' });
  }
});

router.get('/tables/:id', [param('id').isInt()], async (req, res) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const table = await req.prisma.table.findUnique({
      where: { id: parseInt(req.params.id, 10) },
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch table.' });
  }
});

/**
 * PATCH /api/tables/:id
 * Manually update table status (used by TableManager in POS).
 */
router.patch(
  '/tables/:id',
  requireAuth,
  [
    param('id').isInt(),
    body('status')
      .isIn(['AVAILABLE', 'OCCUPIED', 'RESERVED'])
      .withMessage('Invalid table status.'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    try {
      const table = await req.prisma.table.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { status: req.body.status },
      });
      res.json({ success: true, data: table });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Table not found.' });
      }
      res.status(500).json({ success: false, message: 'Failed to update table.' });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/orders
 * Creates a new order from QR Web customer page.
 * Emits `new-order` event to the cashier room via Socket.io.
 */
router.post(
  '/orders',
  [
    body('tableId').isInt({ min: 1 }).withMessage('Valid tableId is required.'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required.'),
    body('items.*.productId').isInt({ min: 1 }).withMessage('Each item must have a valid productId.'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1.'),
    body('items.*.notes').optional().trim(),
    body('notes').optional().trim(),
    body('customerWa').optional().trim(),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { tableId, items, notes, customerWa } = req.body;

    try {
      // Verify table exists
      const table = await req.prisma.table.findUnique({
        where: { id: parseInt(tableId, 10) },
      });
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found.' });
      }

      // Fetch all requested products in one query
      const productIds = items.map((i) => parseInt(i.productId, 10));
      const products = await req.prisma.product.findMany({
        where: { id: { in: productIds }, isAvailable: true },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more products are unavailable or do not exist.',
        });
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Check stock
      for (const item of items) {
        const product = productMap.get(parseInt(item.productId, 10));
        const qty = parseInt(item.quantity, 10);
        if (product.isStockTracked && product.stock < qty) {
          return res.status(400).json({
            success: false,
            message: `Stok untuk ${product.name} tidak mencukupi (Sisa: ${product.stock}).`,
          });
        }
      }

      // Calculate totals
      const orderItems = items.map((item) => {
        const product = productMap.get(parseInt(item.productId, 10));
        let unitPrice = parseFloat(product.price.toString());
        
        let parsedModifiers = null;
        if (item.modifiers) {
          try {
            parsedModifiers = JSON.parse(item.modifiers);
            const modsPrice = parsedModifiers.reduce((acc, m) => acc + parseFloat(m.additionalPrice || 0), 0);
            unitPrice += modsPrice;
          } catch (e) {
            console.error('Invalid modifiers JSON', e);
          }
        }

        const quantity = parseInt(item.quantity, 10);
        const subtotal = unitPrice * quantity;
        return {
          productId: product.id,
          quantity,
          unitPrice,
          subtotal,
          notes: item.notes || null,
          modifiers: item.modifiers || null,
        };
      });

      const totalAmount = orderItems.reduce((acc, i) => acc + i.subtotal, 0);

      // Generate human-readable order number: ORD-YYYYMMDD-XXXX
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `ORD-${datePart}-${uuidv4().slice(0, 6).toUpperCase()}`;

      // Create order + items in a single transaction
      const order = await req.prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            tableId: parseInt(tableId, 10),
            totalAmount,
            notes: notes || null,
            customerWa: customerWa || null,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: { include: { product: true } },
            table: true,
          },
        });

        // Update table status to OCCUPIED
        await tx.table.update({
          where: { id: parseInt(tableId, 10) },
          data: { status: 'OCCUPIED' },
        });

        // Deduct stock
        for (const item of orderItems) {
          const product = productMap.get(item.productId);
          if (product.isStockTracked) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }

        return newOrder; }, { maxWait: 10000, timeout: 20000 });

      // ── Emit real-time event to cashier room ──────────────────────────────
      req.io.to('cashier-room').emit('new-order', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.table.number,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
        items: order.items.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          subtotal: i.subtotal,
          notes: i.notes,
          modifiers: i.modifiers,
        })),
        createdAt: order.createdAt,
      });

      // Notify customer's table room that order was received
      req.io.to(`table-${tableId}`).emit('order:confirmed', {
        orderNumber: order.orderNumber,
        status: order.status,
      });

      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error('[POST /orders]', error);
      res.status(500).json({ success: false, message: 'Order Error: ' + error.message });
    }
  }
);

/**
 * GET /api/orders
 * Get all orders (for cashier dashboard). Optional status filter.
 */
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const { status, tableId } = req.query;

    const orders = await req.prisma.order.findMany({
      where: {
        ...(status && { status }),
        ...(tableId && { tableId: parseInt(tableId, 10) }),
      },
      include: {
        items: { include: { product: true } },
        table: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('[GET /orders]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/orders/:id', [param('id').isInt()], async (req, res) => {
  if (handleValidationErrors(req, res)) return;
  try {
    const order = await req.prisma.order.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: { items: { include: { product: true } }, table: true, payment: true },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status (used by cashier).
 */
router.patch(
  '/orders/:id/status',
  requireAuth,
  [
    param('id').isInt(),
    body('status')
      .isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED'])
      .withMessage('Invalid status value.'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;

    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;

      const order = await req.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id },
          data: { status },
          include: { table: true },
        });

        if (status === 'CANCELLED') {
          await tx.table.update({
            where: { id: updatedOrder.tableId },
            data: { status: 'AVAILABLE' },
          });
        }

        return updatedOrder;
      });

      // Notify customer table room about status change
      req.io.to(`table-${order.tableId}`).emit('order:status-updated', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });

      // Notify all cashiers
      req.io.to('cashier-room').emit('order:updated', {
        orderId: order.id,
        status: order.status,
      });

      // WA Notification if Ready
      if (status === 'READY' && order.customerWa) {
        const msg = `Halo! 👋\n\nPesanan Anda dari Kedai TehYan (Order #${order.orderNumber}) sudah *SIAP DIAMBIL* di kasir.\n\nTerima kasih!`;
        await sendWhatsApp(order.customerWa, msg);
      }

      res.json({ success: true, data: order });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      res.status(500).json({ success: false, message: 'Failed to update order status.' });
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/payments
 * Process payment for an order.
 */
router.post(
  '/payments',
  requireAuth,
  [
    body('orderId').isInt({ min: 1 }).withMessage('Valid orderId is required.'),
    body('method')
      .isIn(['CASH', 'QRIS', 'TRANSFER', 'CARD'])
      .withMessage('Invalid payment method.'),
    body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal.'),
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;

    try {
      const { orderId, method, amount } = req.body;
      const parsedOrderId = parseInt(orderId, 10);
      const parsedAmount = parseFloat(amount);

      const order = await req.prisma.order.findUnique({
        where: { id: parsedOrderId },
        include: { payment: true },
      });

      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      if (order.payment) return res.status(409).json({ success: false, message: 'Order already paid.' });

      const totalAmount = parseFloat(order.totalAmount.toString());
      if (parsedAmount < totalAmount) {
        return res.status(400).json({
          success: false,
          message: `Payment amount (${parsedAmount}) is less than total (${totalAmount}).`,
        });
      }

      const change = parsedAmount - totalAmount;

      const payment = await req.prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
          data: {
            orderId: parsedOrderId,
            method,
            amount: parsedAmount,
            change,
            status: 'PAID',
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: parsedOrderId },
          data: { status: 'PAID' },
        });

        return newPayment; }, { maxWait: 10000, timeout: 20000 });

      req.io.to('cashier-room').emit('payment:completed', {
        orderId: parsedOrderId,
        paymentId: payment.id,
        method: payment.method,
        amount: payment.amount,
        change: payment.change,
      });

      req.io.to(`table-${order.tableId}`).emit('order:paid', { orderId: parsedOrderId });

      if (order.customerWa) {
        const fmt = (v) => 'Rp' + Number(v).toLocaleString('id-ID');
        const receipt = `*KEDAI TEHYAN*\nTerima kasih atas pesanan Anda!\n\nNo. Order: ${order.orderNumber}\nTotal: ${fmt(order.totalAmount)}\nDibayar: ${fmt(payment.amount)}\nKembali: ${fmt(payment.change)}\n\nPesanan sedang diproses dan akan kami beritahu jika sudah siap.`;
        await sendWhatsApp(order.customerWa, receipt);
      }

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      console.error('[POST /payments]', error);
      res.status(500).json({ success: false, message: 'Failed to process payment.' });
    }
  }
);


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

module.exports = router;
