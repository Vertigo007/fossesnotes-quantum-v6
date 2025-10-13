const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/users - Liste des utilisateurs (admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, email, nom, prenom, plan, xp_total, niveau, expertise,
        rivières_visitees, captures_total, date_inscription, derniere_connexion, statut
      FROM users 
      ORDER BY date_inscription DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// GET /api/users/:id - Profil utilisateur spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        id, email, nom, prenom, plan, xp_total, niveau, expertise,
        rivières_visitees, captures_total, date_inscription, derniere_connexion
      FROM users 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

// PUT /api/users/:id - Mise à jour profil utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, plan, expertise } = req.body;

    const result = await pool.query(`
      UPDATE users 
      SET nom = COALESCE($1, nom),
          prenom = COALESCE($2, prenom),
          plan = COALESCE($3, plan),
          expertise = COALESCE($4, expertise)
      WHERE id = $5
      RETURNING id, email, nom, prenom, plan, xp_total, niveau, expertise
    `, [nom, prenom, plan, expertise, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// DELETE /api/users/:id - Suppression utilisateur (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
});

module.exports = router; 