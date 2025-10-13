const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/journal/:userId - Entrées journal utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT 
        j.id, j.date_sortie, j.heure_debut, j.heure_fin,
        j.temperature_air, j.temperature_eau, j.niveau_eau, j.ph_eau, j.oxygene_mg_l,
        j.conditions_meteo, j.nombre_captures, j.especes_capturees, j.mouches_utilisees,
        j.observations, j.photos_urls, j.created_at,
        r.nom as riviere_nom, r.province, r.region
      FROM journal_peche j
      LEFT JOIN cours_eau r ON j.riviere_id = r.id
      WHERE j.user_id = $1
      ORDER BY j.date_sortie DESC, j.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      count: result.rows.length,
      entries: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du journal:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du journal'
    });
  }
});

// POST /api/journal - Nouvelle entrée
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      riviere_id,
      date_sortie,
      heure_debut,
      heure_fin,
      temperature_air,
      temperature_eau,
      niveau_eau,
      ph_eau,
      oxygene_mg_l,
      conditions_meteo,
      nombre_captures,
      especes_capturees,
      mouches_utilisees,
      observations,
      photos_urls,
      coordonnees_gps
    } = req.body;

    // Validation des données requises
    if (!user_id || !riviere_id || !date_sortie) {
      return res.status(400).json({
        success: false,
        error: 'user_id, riviere_id et date_sortie sont requis'
      });
    }

    const result = await pool.query(`
      INSERT INTO journal_peche (
        user_id, riviere_id, date_sortie, heure_debut, heure_fin,
        temperature_air, temperature_eau, niveau_eau, ph_eau, oxygene_mg_l,
        conditions_meteo, nombre_captures, especes_capturees, mouches_utilisees,
        observations, photos_urls, coordonnees_gps
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      user_id, riviere_id, date_sortie, heure_debut, heure_fin,
      temperature_air, temperature_eau, niveau_eau, ph_eau, oxygene_mg_l,
      conditions_meteo, nombre_captures, especes_capturees, mouches_utilisees,
      observations, photos_urls, coordonnees_gps
    ]);

    res.status(201).json({
      success: true,
      message: 'Entrée journal créée avec succès',
      entry: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'entrée journal:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'entrée journal'
    });
  }
});

// PUT /api/journal/:id - Modifier entrée
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Construire la requête dynamique
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
      UPDATE journal_peche 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, ...values]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entrée journal non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Entrée journal mise à jour avec succès',
      entry: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'entrée journal:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'entrée journal'
    });
  }
});

// DELETE /api/journal/:id - Supprimer entrée
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM journal_peche WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entrée journal non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Entrée journal supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'entrée journal:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'entrée journal'
    });
  }
});

module.exports = router; 