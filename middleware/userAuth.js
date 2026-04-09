module.exports = function userAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Please sign in to continue.' });
};
