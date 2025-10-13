const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// GET /api/journal - Récupérer toutes les entrées (pour l'instant sans auth)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM journal_entries
      ORDER BY date_sortie DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      entries: result.rows || []
    });
  } catch (error) {
    console.error('Erreur récupération journal:', error);
    res.json({
      success: true,
      entries: []
    });
  }
});

// POST /api/journal - Créer une nouvelle entrée
router.post('/', async (req, res) => {
  try {
    const entry = req.body;
    
    // Pour l'instant, juste retourner l'entrée
    // Plus tard, on l'insérera dans la DB
    res.status(201).json({
      success: true,
      entry: {
        ...entry,
        id: Date.now()
      }
    });
  } catch (error) {
    console.error('Erreur création entrée:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'entrée'
    });
  }
});

module.exports = router;

