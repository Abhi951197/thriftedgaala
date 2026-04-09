const express  = require('express');
const User     = require('../models/User');
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const userAuth = require('../middleware/userAuth');

const router = express.Router();

// All routes here require a logged-in user
router.use(userAuth);

// ── PROFILE ───────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('wishlist');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (name  !== undefined) user.name  = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADDRESSES ─────────────────────────────────────────────────────────────────
router.get('/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.json({ addresses: user?.addresses || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const addr = req.body;
    if (addr.isDefault) user.addresses.forEach(a => a.isDefault = false);
    if (user.addresses.length === 0) addr.isDefault = true;
    user.addresses.push(addr);
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/addresses/:id', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CART (persistent across sessions) ─────────────────────────────────────────
router.get('/cart', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.json({ cart: user?.cart || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/cart', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    user.cart = Array.isArray(req.body.cart) ? req.body.cart : [];
    await user.save();
    res.json({ cart: user.cart });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── WISHLIST ──────────────────────────────────────────────────────────────────
router.get('/wishlist', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('wishlist');
    res.json({ wishlist: user?.wishlist || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/wishlist/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const pid  = req.params.productId;
    const has  = user.wishlist.some(id => id.toString() === pid);
    if (has) user.wishlist = user.wishlist.filter(id => id.toString() !== pid);
    else     user.wishlist.push(pid);
    await user.save();
    res.json({ wishlist: user.wishlist, added: !has });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ORDERS (my orders) ────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
