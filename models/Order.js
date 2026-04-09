const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  customer: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    address: { type: String, required: true },
    city:    { type: String, required: true },
    pin:     { type: String, required: true },
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:  String,
    price: Number,
    qty:   Number,
    size:  String,
    image: String,
    emoji: String,
  }],
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 60 },
  total:    { type: Number, required: true },
  payment: {
    method:           { type: String, enum: ['COD','GPay','Razorpay'], required: true },
    razorpayOrderId:  { type: String, default: null },
    razorpayPaymentId:{ type: String, default: null },
    verified:         { type: Boolean, default: false },
  },
  status: {
    type: String,
    enum: ['pending','confirmed','shipped','delivered','cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
