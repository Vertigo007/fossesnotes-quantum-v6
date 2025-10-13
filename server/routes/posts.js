const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /api/posts - Récupérer tous les posts
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM posts
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      posts: result.rows || []
    });
  } catch (error) {
    console.error('Erreur récupération posts:', error);
    res.json({
      success: true,
      posts: []
    });
  }
});

// POST /api/posts - Créer un nouveau post
router.post('/', async (req, res) => {
  try {
    const post = req.body;
    
    // Pour l'instant, juste retourner le post
    res.status(201).json({
      success: true,
      post: {
        ...post,
        id: Date.now()
      }
    });
  } catch (error) {
    console.error('Erreur création post:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du post'
    });
  }
});

module.exports = router;

