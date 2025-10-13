const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/posts - Posts avec filtres
router.get('/', async (req, res) => {
  try {
    const { 
      user_id, 
      riviere_id, 
      type_post, 
      limit = 20, 
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        p.id, p.titre, p.contenu, p.type_post, p.photos_urls,
        p.likes_count, p.commentaires_count, p.partages_count,
        p.statut, p.created_at,
        u.id as user_id, u.nom, u.prenom, u.plan, u.niveau,
        r.nom as riviere_nom, r.province, r.region
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN cours_eau r ON p.riviere_id = r.id
      WHERE p.statut = 'approuve'
    `;
    
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND p.user_id = $${paramIndex++}`;
      params.push(user_id);
    }

    if (riviere_id) {
      query += ` AND p.riviere_id = $${paramIndex++}`;
      params.push(riviere_id);
    }

    if (type_post) {
      query += ` AND p.type_post = $${paramIndex++}`;
      params.push(type_post);
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
    console.error('Erreur lors de la récupération des posts:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des posts'
    });
  }
});

// POST /api/posts - Nouveau post
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      riviere_id,
      titre,
      contenu,
      type_post,
      photos_urls,
      coordonnees_gps,
      conditions_meteo
    } = req.body;

    // Validation des données requises
    if (!user_id || !contenu) {
      return res.status(400).json({
        success: false,
        error: 'user_id et contenu sont requis'
      });
    }

    const result = await pool.query(`
      INSERT INTO posts (
        user_id, riviere_id, titre, contenu, type_post,
        photos_urls, coordonnees_gps, conditions_meteo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      user_id, riviere_id, titre, contenu, type_post,
      photos_urls, coordonnees_gps, conditions_meteo
    ]);

    res.status(201).json({
      success: true,
      message: 'Post créé avec succès',
      post: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la création du post:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du post'
    });
  }
});

// PUT /api/posts/:id - Modifier post
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à mettre à jour'
      });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      UPDATE posts 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, ...values]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Post mis à jour avec succès',
      post: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du post:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du post'
    });
  }
});

// DELETE /api/posts/:id - Supprimer post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Post supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du post'
    });
  }
});

// POST /api/posts/:id/like - Liker post
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE posts 
      SET likes_count = likes_count + 1
      WHERE id = $1
      RETURNING likes_count
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Post liké avec succès',
      likes_count: result.rows[0].likes_count
    });

  } catch (error) {
    console.error('Erreur lors du like du post:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du like du post'
    });
  }
});

// POST /api/posts/:id/comment - Commenter post
router.post('/:id/comment', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, contenu } = req.body;

    if (!user_id || !contenu) {
      return res.status(400).json({
        success: false,
        error: 'user_id et contenu sont requis'
      });
    }

    // Ici on pourrait créer une table comments séparée
    // Pour l'instant, on incrémente juste le compteur
    const result = await pool.query(`
      UPDATE posts 
      SET commentaires_count = commentaires_count + 1
      WHERE id = $1
      RETURNING commentaires_count
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      commentaires_count: result.rows[0].commentaires_count
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout du commentaire'
    });
  }
});

module.exports = router; 