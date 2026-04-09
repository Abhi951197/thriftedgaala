require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');
const passport     = require('passport');
const path         = require('path');
const connectDB    = require('./config/db');
const User         = require('./models/User');

const app = express();

// ── DB ────────────────────────────────────────────────────────────────────────
connectDB();

// ── RAZORPAY (optional) ───────────────────────────────────────────────────────
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  const Razorpay = require('razorpay');
  app.set('razorpay', new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  }));
  console.log('💳  Razorpay enabled');
} else {
  console.log('📱  Razorpay not configured — GPay QR fallback active');
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/thriftedgaala',
    ttl: 30 * 24 * 60 * 60, // 30 days for user sessions
  }),
  cookie: {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000,
  },
}));

// ── PASSPORT (Google OAuth) ───────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) { done(err); }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  (process.env.BASE_URL || 'http://localhost:3000') + '/api/auth/google/callback',
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });
      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          user.provider = user.password ? 'local' : 'google';
        }
        if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
        user.lastLogin = new Date();
        await user.save();
      } else {
        user = await User.create({
          name:     profile.displayName,
          email,
          googleId: profile.id,
          avatar:   profile.photos?.[0]?.value,
          provider: 'google',
          lastLogin: new Date(),
        });
      }
      done(null, user);
    } catch (err) { done(err); }
  }));
  console.log('🔐  Google OAuth enabled');
} else {
  console.log('🔐  Google OAuth not configured — email/password only');
}

// ── API ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/user',     require('./routes/user'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));

// ── HTML PAGES ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀  thriftedGaala running → http://localhost:${PORT}`));
