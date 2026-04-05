const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const filter = { inStock: true };
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    let query = Product.find(filter);
    const sort = req.query.sort;
    if (sort === 'price-asc')  query = query.sort({ price:  1 });
    else if (sort === 'price-desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });
    const products = await query.lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
