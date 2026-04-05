require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('./models/Product');

const products = [
  { name:"Vintage Levi's Trucker", desc:"A classic denim jacket with worn-in charm. Perfect for layering.", price:1299, oldPrice:3499, category:"outerwear", badge:"rare", sizes:["S","M","L"], emoji:"🧥" },
  { name:"Y2K Graphic Tee", desc:"2000s energy, zero regrets. Boxy fit, pre-loved graphic print.", price:499, oldPrice:999, category:"tops", badge:"sale", sizes:["XS","S","M","L","XL"], emoji:"👕" },
  { name:"Corduroy Wide-Leg Pants", desc:"Wide leg. Wide stance. Even wider vibes.", price:899, oldPrice:2199, category:"bottoms", badge:"new", sizes:["S","M","L"], emoji:"👖" },
  { name:"Cream Knit Cardigan", desc:"Cozy meets curated. Oversized fit in warm neutral knit.", price:749, oldPrice:1799, category:"tops", badge:"new", sizes:["S","M","L","XL"], emoji:"🧶" },
  { name:"Leather Mini Skirt", desc:"Statement piece. Always. Deep black, slim cut.", price:699, oldPrice:1599, category:"bottoms", badge:"sale", sizes:["XS","S","M"], emoji:"🖤" },
  { name:"Canvas Tote Bag", desc:"Carry everything. Look good doing it.", price:349, oldPrice:799, category:"accessories", badge:"", sizes:["One Size"], emoji:"🎒" },
  { name:"Oversized Flannel Shirt", desc:"The ultimate lazy outfit flex. Plaid flannel, boxy.", price:849, oldPrice:1999, category:"tops", badge:"", sizes:["M","L","XL","XXL"], emoji:"🟫" },
  { name:"Wool Blend Overcoat", desc:"Cold outside, fire inside. Structured wool-blend.", price:2199, oldPrice:5999, category:"outerwear", badge:"rare", sizes:["S","M","L"], emoji:"🧥" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thriftedgaala');
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`✅  Seeded ${products.length} products`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
