const express  = require('express');
const passport = require('passport');
const User     = require('../models/User');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
function userSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.userId = user._id.toString();
    req.session.save(err => err ? reject(err) : resolve());
  });
}

// ── GET /api/auth/me  ─ who am I? ────────────────────────────────────────────
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.json({ user: null });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/register  ─ email + password ──────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password,
      provider: 'local',
      lastLogin: new Date(),
    });
    await userSession(req, user);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login  ─ email + password ─────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    user.lastLogin = new Date();
    await user.save();
    await userSession(req, user);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  delete req.session.userId;
  req.session.save(() => res.json({ ok: true }));
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google/status', (_req, res) => {
  res.json({ enabled: googleEnabled });
});

if (googleEnabled) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/?authError=google' }),
    async (req, res) => {
      try {
        if (req.user) {
          await userSession(req, req.user);
        }
        res.redirect('/?authSuccess=1');
      } catch (err) {
        res.redirect('/?authError=session');
      }
    }
  );
}

module.exports = router;
