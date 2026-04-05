# ThriftedGaala — Claude Code Context

## Project Overview
Gen-Z pre-loved fashion e-commerce brand. Full-stack Node.js + Express + MongoDB app with a store frontend and a separate admin portal.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Session:** express-session + connect-mongo (8hr TTL, persists across restarts)
- **File Uploads:** Multer (disk storage)
- **Payments:** Razorpay (optional, 2%/transaction) — falls back to GPay QR image if not configured
- **Frontend:** Vanilla HTML/CSS/JS (no framework)

## Running the Project
```bash
npm install          # install dependencies
npm run seed         # seed 8 sample products into MongoDB
npm run dev          # start with nodemon (hot reload)
npm start            # start without hot reload
```
- Store: `http://localhost:3000`
- Admin: `http://localhost:3000/admin` (password in `.env` → `ADMIN_PASSWORD`)

## Environment Variables (`.env`)
```
PORT=3000
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=<random string>
ADMIN_PASSWORD=admin123
NODE_ENV=development
RAZORPAY_KEY_ID=       # leave blank to use GPay QR fallback
RAZORPAY_KEY_SECRET=   # leave blank to use GPay QR fallback
```

## Design Tokens (must not change)
| Token | Value | Usage |
|---|---|---|
| `--cream` | `#F5F0E8` | page background |
| `--black` | `#0A0A0A` | text, dark sections |
| `--accent` | `#FF4D1C` | CTA buttons, highlights |
| `--sage` | `#8FAF7E` | tags, secondary accents |
| `--lavender` | `#C4B5D4` | card hovers, soft accents |
| `--yellow` | `#F2D45C` | badge highlights |
| Display font | Cormorant Garamond | headings, hero |
| Body font | DM Sans | all body copy, UI labels |

## File Structure
```
ThriftedGaala/
├── config/
│   └── db.js                  # Mongoose connect, exits on failure
├── middleware/
│   ├── adminAuth.js            # session guard for /api/admin/* routes
│   └── upload.js              # multer: productUpload (5MB) + gpayUpload (2MB)
├── models/
│   ├── Product.js             # name, desc, price, oldPrice, category, badge, sizes[], image, emoji, inStock
│   └── Order.js               # orderId, customer, items[], totals, payment{method,razorpay*,verified}, status
├── routes/
│   ├── products.js            # GET /api/products, GET /api/products/:id
│   ├── orders.js              # POST /api/orders, razorpay create/verify, GET /api/orders/:orderId
│   └── admin.js               # login/logout/status, stats, products CRUD, orders list+status, gpay QR upload
├── public/
│   ├── index.html             # store frontend (Gen-Z redesign — see below)
│   ├── uploads/
│   │   ├── products/          # uploaded product images
│   │   └── gpay/qr.png        # admin-uploaded GPay QR image
│   └── admin/
│       └── index.html         # admin portal
├── server.js                  # entry point
├── seed.js                    # seeds 8 sample products
├── .env                       # secrets (not committed)
└── package.json
```

## Store Frontend (`public/index.html`) — Completed
Gen-Z fashion editorial redesign with:
- **Hero:** 3-line stacked Cormorant Garamond — solid / CSS-outlined (`-webkit-text-stroke`) / accent italic. Right side: 2×2 product tile grid.
- **Sticky filter bar:** `position:sticky; top:var(--nav-h); z-index:200` — filters by category + sort
- **Product cards:** `aspect-ratio:3/4` portrait, hover slide-up quick-add button
- **Dark categories section:** Black background, numbered items (01–04)
- **Feature strip:** Giant Cormorant numerals (500+ pieces, etc.)
- **Scroll animations:** `data-reveal` + `data-delay` attributes, IntersectionObserver
- **Cart & checkout:** Slide-in cart panel → 2-step checkout overlay → order confirmation
- **Payment:** Razorpay order flow OR GPay QR display (COD also supported)

### Critical DOM IDs (must not change — JS depends on them)
`cart-badge`, `pgrid`, `det-img`, `det-body`, `cart-ov`, `cart-pan`, `co-ov`, `cfm-ov`, `co-name`, `co-phone`, `co-addr`, `co-city`, `co-pin`, `co-pay`, `gpay-section`, `gpay-qr-img`, `rzp-section`, `cfm-id`, `cfm-total`, `hero-grid`

### JS Functions (all 31 preserved — do not rename)
`openDetail`, `closeDetail`, `addToCart`, `renderCart`, `openCart`, `closeCart`, `updateBadge`, `openCheckout`, `closeCheckout`, `placeOrder`, `verifyRazorpay`, `showConfirm`, `filterProducts`, `loadProducts`, `renderHeroGrid`, `initReveal`, and others.

## Admin Portal (`public/admin/index.html`) — Functional, Not Redesigned
Dark-theme admin with:
- Login gate (auto-login if session exists via `GET /api/admin/status`)
- **Orders tab:** stats cards, searchable table, expandable rows, status dropdown
- **Products tab:** card grid, add/edit modal with image upload + preview
- **Settings tab:** Razorpay status indicator, GPay QR image upload

> The admin portal UI uses the original functional dark theme and has NOT been given the Gen-Z redesign treatment yet.

## API Routes Summary
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | — | list products (filter: category, sort) |
| GET | `/api/products/:id` | — | single product |
| POST | `/api/orders` | — | place COD or GPay order |
| POST | `/api/orders/razorpay/create` | — | create Razorpay order |
| POST | `/api/orders/razorpay/verify` | — | verify Razorpay payment (HMAC) |
| GET | `/api/orders/:orderId` | — | get order by ID |
| GET | `/api/admin/status` | — | check if admin session active |
| POST | `/api/admin/login` | — | login (sets session) |
| POST | `/api/admin/logout` | admin | destroy session |
| GET | `/api/admin/stats` | admin | order counts + revenue |
| GET | `/api/admin/products` | admin | all products |
| POST | `/api/admin/products` | admin | create product (multipart) |
| PUT | `/api/admin/products/:id` | admin | update product (multipart) |
| DELETE | `/api/admin/products/:id` | admin | delete product |
| GET | `/api/admin/orders` | admin | all orders (filter: status, search) |
| PATCH | `/api/admin/orders/:id/status` | admin | update order status |
| GET | `/api/admin/settings` | admin | get Razorpay config status + GPay QR path |
| POST | `/api/admin/gpay-qr` | admin | upload GPay QR image |

## What Needs To Be Done

### High Priority
- [ ] **Admin portal UI redesign** — Apply same Gen-Z aesthetic (Cormorant + DM Sans, brand colors) to `public/admin/index.html`. Currently uses a plain dark functional theme.
- [ ] **Product images in seed** — `seed.js` seeds 8 products with no images. Add real placeholder images or Unsplash URLs for demo purposes.
- [ ] **Input validation** — Add server-side validation (e.g., required fields, price > 0, valid phone number) on order and product creation routes.

### Medium Priority
- [ ] **Razorpay keys** — User needs to sign up at razorpay.com and fill in `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in `.env` to enable card/UPI payments.
- [ ] **GPay QR upload** — Admin needs to upload their GPay QR image via the Settings tab before GPay payment option works at checkout.
- [ ] **Order email/SMS notifications** — No notification system exists. Could add Nodemailer or Twilio for order confirmations.
- [ ] **Pagination** — `GET /api/products` and `GET /api/admin/orders` return all documents. Add pagination for scale.
- [ ] **Image optimization** — Uploaded images are stored as-is. Could add Sharp for resizing/compressing on upload.

### Low Priority / Nice to Have
- [ ] **Inventory tracking** — `inStock` bool exists but no quantity tracking. Add stock count per size.
- [ ] **Search** — No full-text product search on the store frontend. Could add a search bar.
- [ ] **Wishlist** — No wishlist/favorites feature.
- [ ] **Deployment** — Set `NODE_ENV=production` in env, deploy to Railway/Render/Fly.io, update `secure: true` for cookies.
- [ ] **Rate limiting** — No rate limiting on auth or order endpoints. Add `express-rate-limit` before production.
- [ ] **CSRF protection** — Sessions are set up but no CSRF tokens on forms.
