const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function hashPassword(plain) {
  const saltRounds = 12;
  return bcrypt.hash(plain, saltRounds);
}

async function checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signJWT(user) {
  // inclure role/plan & i18n
  return jwt.sign(
    { uid: user.id, userId: user.id, email: user.email, plan: user.plan, lang: user.lang || 'fr' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requirePlan(minPlan) {
  const order = { free: 0, pro: 1, elite: 2 };
  return (req, res, next) => {
    const plan = req.user?.plan || 'free';
    if (order[plan] >= order[minPlan]) return next();
    return res.status(403).json({ error: 'Insufficient plan', need: minPlan, have: plan });
  };
}

module.exports = { hashPassword, checkPassword, signJWT, authRequired, requirePlan };



