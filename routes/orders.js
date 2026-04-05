const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const Order    = require('../models/Order');

function genOrderId() {
  return 'TG-' + Math.floor(100000 + Math.random() * 900000);
}

// ── POST /api/orders  (COD or GPay) ───────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, shipping, total, payment } = req.body;
    if (!customer || !items?.length || !total || !payment?.method) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!/^\d{10}$/.test(customer.phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }
    if (!/^\d{6}$/.test(customer.pin)) {
      return res.status(400).json({ error: 'Invalid PIN code.' });
    }
    const orderId = genOrderId();
    const order = await Order.create({
      orderId, customer, items, subtotal, shipping, total,
      payment: { method: payment.method, verified: payment.method === 'COD' },
    });
    res.status(201).json({ orderId: order.orderId, total: order.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders/razorpay/create ─────────────────────────────────────
router.post('/razorpay/create', async (req, res) => {
  const Razorpay = req.app.get('razorpay');
  if (!Razorpay) return res.status(503).json({ error: 'Razorpay not configured.' });
  try {
    const { amount } = req.body; // in paise
    const rzpOrder = await Razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: genOrderId(),
    });
    res.json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders/razorpay/verify ─────────────────────────────────────
router.post('/razorpay/verify', async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderData } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (expected !== razorpaySignature) {
      return res.status(400).json({ error: 'Payment verification failed.' });
    }
    // Save verified order
    const { customer, items, subtotal, shipping, total } = orderData;
    const orderId = genOrderId();
    const order = await Order.create({
      orderId, customer, items, subtotal, shipping, total,
      payment: {
        method: 'Razorpay',
        razorpayOrderId,
        razorpayPaymentId,
        verified: true,
      },
    });
    res.status(201).json({ orderId: order.orderId, total: order.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders/:orderId  (customer status lookup) ───────────────────
router.get('/:orderId', async (req, res) => {
  try {
    const o = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!o) return res.status(404).json({ error: 'Order not found.' });
    res.json({ orderId: o.orderId, status: o.status, total: o.total, createdAt: o.createdAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
