const express = require('express');
const router = express.Router();
const { hashPassword, checkPassword, signJWT } = require('../utils/auth');
const { oneOrNone, oneInsert } = require('../utils/db');
const { generateTokens, refreshAccessToken } = require('../utils/jwt');

router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, prenom, lang } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email/password requis' });
    
    const exists = await oneOrNone('SELECT id FROM users WHERE email = ?', [email]);
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });
    
    const password_hash = await hashPassword(password);
    const result = await oneInsert(
      `INSERT INTO users(email, password_hash, nom, prenom, lang) 
       VALUES(?, ?, ?, ?, ?)`,
      [email, password_hash, nom || null, prenom || null, lang || 'fr']
    );
    
    const user = {
      id: result.id,
      email: result.email,
      plan: result.plan,
      lang: result.lang
    };
    
    const tokens = generateTokens(user);
    res.json({ 
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user 
    });
  } catch (e) {
    res.status(500).json({ error: 'Register failed', detail: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email/password requis' });
    
    const user = await oneOrNone('SELECT id, email, password_hash, nom, prenom, plan, lang FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    
    const ok = await checkPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });
    
    const tokens = generateTokens(user);
    res.json({ 
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: { 
        id: user.id, 
        email: user.email, 
        nom: user.nom,
        prenom: user.prenom,
        plan: user.plan, 
        lang: user.lang 
      } 
    });
  } catch (e) {
    res.status(500).json({ error: 'Login failed', detail: e.message });
  }
});

// Route pour rafraîchir le token d'accès
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requis' });
    }

    const decoded = refreshAccessToken(refreshToken);
    
    // Récupérer les données utilisateur depuis la base
    const user = await oneOrNone('SELECT id, email, plan, lang FROM users WHERE id = ?', [decoded.userId]);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const tokens = generateTokens(user);
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (e) {
    res.status(401).json({ error: 'Refresh token invalide', detail: e.message });
  }
});

module.exports = router; 