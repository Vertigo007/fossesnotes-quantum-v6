const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authRequired } = require('../utils/auth');

const CONSENT_VERSION = '2025-08-17';

// GET /api/profile/me - Récupérer le profil utilisateur
router.get('/me', authRequired, async (req, res) => {
  try {
    const u = await db.one(`SELECT id, email, plan, lang, consent_share, consent_version, consent_updated_at FROM users WHERE id = ?`, [req.user.uid]);
    res.json(u);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/profile/consent - Mettre à jour le consentement
router.post('/consent', authRequired, async (req, res) => {
  try {
    const { share } = req.body || {};
    
    await db.none(`UPDATE users SET consent_share = ?, consent_version = ?, consent_updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [share ? 1 : 0, CONSENT_VERSION, req.user.uid]);
    
    await db.none(`INSERT INTO consent_history(user_id, consent_share, consent_version, ip, ua)
                   VALUES(?, ?, ?, ?, ?)`,
      [req.user.uid, share ? 1 : 0, CONSENT_VERSION, req.ip, req.headers['user-agent'] || null]);
    
    res.json({ ok: true, share: !!share, version: CONSENT_VERSION });
  } catch (error) {
    console.error('Consent update error:', error);
    res.status(500).json({ error: 'Erreur mise à jour consentement' });
  }
});

module.exports = router;



