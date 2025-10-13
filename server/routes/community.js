const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authRequired, requirePlan } = require('../utils/auth');

// GET /api/community/feed - Feed des posts
router.get('/feed', async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT p.*, u.email as author_email,
             COUNT(r.id) as reactions_count
      FROM community_posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN community_reactions r ON p.id = r.post_id
      WHERE p.status = 'published'
    `;
    
    const params = [];
    if (search) {
      query += ` AND (p.title_fr LIKE ? OR p.title_en LIKE ? OR p.body_fr LIKE ? OR p.body_en LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const items = await db.manyOrNone(query, params);
    const total = await db.one(`SELECT COUNT(*) as count FROM community_posts WHERE status = 'published'`);
    
    res.json({
      items,
      page: parseInt(page),
      total: total.count,
      hasMore: offset + items.length < total.count
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/community/posts - Créer un post
router.post('/posts', authRequired, requirePlan('pro'), async (req, res) => {
  const { title_fr, title_en, body_fr, body_en, visibility = 'public' } = req.body;
  
  try {
    const post = await db.one(`
      INSERT INTO community_posts (author_id, title_fr, title_en, body_fr, body_en, visibility)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `, [req.user.uid, title_fr, title_en, body_fr, body_en, visibility]);
    
    // Points pour création de post
    await db.none(`INSERT INTO gamification_points_ledger(user_id, action, delta) VALUES(?, 'post.create', 5)`, [req.user.uid]);
    await db.none(`UPDATE users SET points_total = points_total + 5 WHERE id = ?`, [req.user.uid]);
    
    res.json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Erreur création post' });
  }
});

// POST /api/community/posts/:id/react - Réagir à un post
router.post('/posts/:id/react', authRequired, async (req, res) => {
  const postId = parseInt(req.params.id);
  const { type } = req.body; // 'like', 'helpful', 'insightful'
  
  try {
    // Vérifier que le post existe
    const post = await db.oneOrNone(`SELECT * FROM community_posts WHERE id = ? AND status = 'published'`, [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }
    
    // Ajouter la réaction
    await db.none(`
      INSERT OR IGNORE INTO community_reactions (post_id, user_id, type)
      VALUES (?, ?, ?)
    `, [postId, req.user.uid, type]);
    
    // Points pour l'auteur du post (si pas sa propre réaction)
    if (post.author_id !== req.user.uid) {
      await db.none(`INSERT INTO gamification_points_ledger(user_id, action, delta) VALUES(?, 'reaction.received', 1)`, [post.author_id]);
      await db.none(`UPDATE users SET points_total = points_total + 1 WHERE id = ?`, [post.author_id]);
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ error: 'Erreur réaction' });
  }
});

// GET /api/community/posts/:id - Détail d'un post
router.get('/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id);
  
  try {
    const post = await db.oneOrNone(`
      SELECT p.*, u.email as author_email,
             COUNT(r.id) as reactions_count
      FROM community_posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN community_reactions r ON p.id = r.post_id
      WHERE p.id = ? AND p.status = 'published'
      GROUP BY p.id
    `, [postId]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;



