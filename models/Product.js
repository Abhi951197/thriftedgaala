const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  desc:       { type: String, default: '' },
  price:      { type: Number, required: true, min: 0 },
  oldPrice:   { type: Number, default: 0 },
  category:   { type: String, enum: ['tops','bottoms','outerwear','accessories'], required: true },
  badge:      { type: String, enum: ['new','sale','rare',''], default: '' },
  sizes:      { type: [String], default: ['S','M','L'] },
  image:      { type: String, default: '' },   // /uploads/products/<filename>
  emoji:      { type: String, default: '👕' }, // fallback when no image
  inStock:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
