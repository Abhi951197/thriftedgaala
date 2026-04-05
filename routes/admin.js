const express   = require('express');
const router    = express.Router();
const fs        = require('fs');
const path      = require('path');
const Product   = require('../models/Product');
const Order     = require('../models/Order');
const adminAuth = require('../middleware/adminAuth');
const { productUpload, gpayUpload } = require('../middleware/upload');

// ── AUTH ──────────────────────────────────────────────────────────────────────

// GET /api/admin/status
router.get('/status', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.isAdmin) });
});

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.save(err => {
      if (err) return res.status(500).json({ error: 'Session error.' });
      res.json({ ok: true });
    });
  } else {
    res.status(401).json({ error: 'Incorrect password.' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── SETTINGS ──────────────────────────────────────────────────────────────────

// GET /api/admin/settings  (public — store needs this to decide payment flow)
router.get('/settings', (req, res) => {
  const razorpayEnabled = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const gpayQrPath = path.join(__dirname, '../public/uploads/gpay/qr.png');
  const gpayQrUrl  = fs.existsSync(gpayQrPath) ? '/uploads/gpay/qr.png' : null;
  res.json({ razorpayEnabled, razorpayKeyId: razorpayEnabled ? process.env.RAZORPAY_KEY_ID : null, gpayQrUrl });
});

// POST /api/admin/gpay-qr  — upload / replace GPay QR image
router.post('/gpay-qr', adminAuth, gpayUpload.single('qr'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  res.json({ url: '/uploads/gpay/qr.png' });
});

// ── STATS ─────────────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [total, pending, delivered, revenueAgg] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);
    res.json({ total, pending, delivered, revenue: revenueAgg[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

// GET /api/admin/products
router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products
router.post('/products', adminAuth, productUpload.single('image'), async (req, res) => {
  try {
    const { name, desc, price, oldPrice, category, badge, emoji } = req.body;
    const sizes = req.body.sizes
      ? req.body.sizes.split(',').map(s => s.trim()).filter(Boolean)
      : ['S','M','L'];
    const image = req.file ? `/uploads/products/${req.file.filename}` : '';
    const product = await Product.create({
      name, desc, price: +price, oldPrice: +(oldPrice||0),
      category, badge: badge||'', sizes, image, emoji: emoji||'👕',
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', adminAuth, productUpload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const { name, desc, price, oldPrice, category, badge, emoji, inStock } = req.body;
    const sizes = req.body.sizes
      ? req.body.sizes.split(',').map(s => s.trim()).filter(Boolean)
      : product.sizes;

    if (name)     product.name     = name;
    if (desc !== undefined) product.desc = desc;
    if (price)    product.price    = +price;
    if (oldPrice !== undefined) product.oldPrice = +(oldPrice||0);
    if (category) product.category = category;
    if (badge !== undefined) product.badge = badge||'';
    if (emoji)    product.emoji    = emoji;
    if (sizes.length) product.sizes = sizes;
    if (inStock !== undefined) product.inStock = inStock === 'true' || inStock === true;

    if (req.file) {
      // Delete old image if it exists
      if (product.image) {
        const oldPath = path.join(__dirname, '../public', product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      product.image = `/uploads/products/${req.file.filename}`;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.image) {
      const imgPath = path.join(__dirname, '../public', product.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ORDERS ────────────────────────────────────────────────────────────────────

// GET /api/admin/orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.q) {
      const re = new RegExp(req.query.q, 'i');
      filter.$or = [{ orderId: re }, { 'customer.name': re }, { 'customer.phone': re }];
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ ok: true, status: order.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
