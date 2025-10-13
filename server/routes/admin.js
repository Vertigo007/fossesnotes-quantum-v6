const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/admin/stats - Statistiques globales
router.get('/stats', async (req, res) => {
  try {
    // Statistiques utilisateurs
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN plan = 'Basic' THEN 1 END) as basic_users,
        COUNT(CASE WHEN plan = 'Pro' THEN 1 END) as pro_users,
        COUNT(CASE WHEN plan = 'Elite' THEN 1 END) as elite_users,
        COUNT(CASE WHEN date_inscription >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_month,
        AVG(xp_total) as avg_xp,
        AVG(captures_total) as avg_captures
      FROM users
      WHERE statut = 'actif'
    `);

    // Statistiques rivières
    const riverStats = await pool.query(`
      SELECT 
        COUNT(*) as total_rivieres,
        COUNT(CASE WHEN type = 'Saumon atlantique' THEN 1 END) as saumon_rivieres,
        COUNT(CASE WHEN type = 'Truite mouchetée' THEN 1 END) as truite_rivieres,
        COUNT(CASE WHEN classe = 1 THEN 1 END) as elite_rivieres
      FROM cours_eau
    `);

    // Statistiques journal
    const journalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN date_sortie >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as entries_month,
        AVG(nombre_captures) as avg_captures_per_trip
      FROM journal_peche
    `);

    // Statistiques posts
    const postStats = await pool.query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as posts_month,
        SUM(likes_count) as total_likes,
        SUM(commentaires_count) as total_comments
      FROM posts
      WHERE statut = 'approuve'
    `);

    res.json({
      success: true,
      stats: {
        users: userStats.rows[0],
        rivers: riverStats.rows[0],
        journal: journalStats.rows[0],
        posts: postStats.rows[0]
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/admin/users - Gestion utilisateurs
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, offset = 0, plan, statut } = req.query;

    let query = `
      SELECT 
        id, email, nom, prenom, plan, xp_total, niveau, expertise,
        rivières_visitees, captures_total, date_inscription, derniere_connexion, statut
      FROM users 
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (plan) {
      query += ` AND plan = $${paramIndex++}`;
      params.push(plan);
    }

    if (statut) {
      query += ` AND statut = $${paramIndex++}`;
      params.push(statut);
    }

    query += ` ORDER BY date_inscription DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// GET /api/admin/posts - Modération posts
router.get('/posts', async (req, res) => {
  try {
    const { limit = 50, offset = 0, statut } = req.query;

    let query = `
      SELECT 
        p.id, p.titre, p.contenu, p.type_post, p.statut, p.created_at,
        p.likes_count, p.commentaires_count, p.partages_count,
        u.nom, u.prenom, u.email,
        r.nom as riviere_nom
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN cours_eau r ON p.riviere_id = r.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (statut) {
      query += ` AND p.statut = $${paramIndex++}`;
      params.push(statut);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      posts: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des posts admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des posts'
    });
  }
});

// POST /api/admin/login-as - Login as user
router.post('/login-as', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id requis'
      });
    }

    const result = await pool.query(`
      SELECT 
        id, email, nom, prenom, plan, xp_total, niveau, expertise,
        rivières_visitees, captures_total, date_inscription, derniere_connexion
      FROM users 
      WHERE id = $1 AND statut = 'actif'
    `, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Simulation utilisateur activée',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la simulation utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la simulation utilisateur'
    });
  }
});

// PUT /api/admin/users/:id/status - Changer statut utilisateur
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['actif', 'suspendu', 'banni'].includes(statut)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    const result = await pool.query(`
      UPDATE users 
      SET statut = $1
      WHERE id = $2
      RETURNING id, email, nom, prenom, statut
    `, [statut, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: `Statut utilisateur changé à ${statut}`,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de statut'
    });
  }
});

// PUT /api/admin/posts/:id/status - Modérer post
router.put('/posts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['approuve', 'en_attente', 'rejete'].includes(statut)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    const result = await pool.query(`
      UPDATE posts 
      SET statut = $1
      WHERE id = $2
      RETURNING id, titre, statut
    `, [statut, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post non trouvé'
      });
    }

    res.json({
      success: true,
      message: `Statut post changé à ${statut}`,
      post: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la modération du post:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modération du post'
    });
  }
});

module.exports = router; 