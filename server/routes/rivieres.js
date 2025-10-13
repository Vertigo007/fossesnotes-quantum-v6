const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const Riviere = require('../models/Riviere')(sequelize);

// GET /api/rivieres - Toutes les rivières avec filtres
router.get('/', async (req, res) => {
  try {
    const { 
      province_etat, 
      region, 
      type, 
      classe, 
      pays,
      lat, 
      lng, 
      radius = 100 
    } = req.query;

    let whereClause = {};

    // Filtres
    if (province_etat && province_etat !== 'all') {
      whereClause.province_etat = province_etat;
    }

    if (region) {
      whereClause.region = region;
    }

    if (type) {
      whereClause.type = type;
    }

    if (classe && classe !== 'all') {
      whereClause.classe = parseInt(classe);
    }

    if (pays && pays !== 'all') {
      whereClause.pays = pays;
    }

    // Recherche géographique
    if (lat && lng) {
      whereClause.latitude = {
        [sequelize.Op.between]: [parseFloat(lat) - radius/111, parseFloat(lat) + radius/111]
      };
      whereClause.longitude = {
        [sequelize.Op.between]: [parseFloat(lng) - radius/111, parseFloat(lng) + radius/111]
      };
    }

    const rivieres = await Riviere.findAll({
      where: whereClause,
      order: [['nom', 'ASC']]
    });
    
    res.json({
      success: true,
      count: rivieres.length,
      rivieres: rivieres
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des rivières:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rivières'
    });
  }
});

// GET /api/rivieres/:id - Rivière spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const riviere = await Riviere.findByPk(id);

    if (!riviere) {
      return res.status(404).json({
        success: false,
        error: 'Rivière non trouvée'
      });
    }

    res.json({
      success: true,
      riviere: riviere
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la rivière:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la rivière'
    });
  }
});

// GET /api/rivieres/stats/summary - Statistiques des rivières
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Riviere.findAll({
      attributes: [
        'classe',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['classe'],
      raw: true
    });

    const total = await Riviere.count();
    const provinces = await Riviere.findAll({
      attributes: [
        'province_etat',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['province_etat'],
      raw: true
    });

    const pays = await Riviere.findAll({
      attributes: [
        'pays',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['pays'],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        total,
        parClasse: stats,
        parProvince: provinces,
        parPays: pays
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/rivieres/search/:term - Recherche de rivières
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    
    const rivieres = await Riviere.findAll({
      where: {
        [sequelize.Op.or]: [
          { nom: { [sequelize.Op.iLike]: `%${term}%` } },
          { nom_anglais: { [sequelize.Op.iLike]: `%${term}%` } },
          { region: { [sequelize.Op.iLike]: `%${term}%` } },
          { province_etat: { [sequelize.Op.iLike]: `%${term}%` } }
        ]
      },
      order: [['nom', 'ASC']],
      limit: 20
    });

    res.json({
      success: true,
      count: rivieres.length,
      rivieres: rivieres
    });

  } catch (error) {
    console.error('Erreur lors de la recherche de rivières:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche de rivières'
    });
  }
});

// GET /api/rivieres/nearby/:id - Rivières à proximité
router.get('/nearby/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { radius = 50 } = req.query; // Rayon en km
    
    const riviere = await Riviere.findByPk(id);
    
    if (!riviere) {
      return res.status(404).json({
        success: false,
        error: 'Rivière non trouvée'
      });
    }

    const nearbyRivieres = await Riviere.findAll({
      where: {
        id: { [sequelize.Op.ne]: id },
        latitude: {
          [sequelize.Op.between]: [riviere.latitude - radius/111, riviere.latitude + radius/111]
        },
        longitude: {
          [sequelize.Op.between]: [riviere.longitude - radius/111, riviere.longitude + radius/111]
        }
      },
      order: [['nom', 'ASC']],
      limit: 10
    });

    res.json({
      success: true,
      count: nearbyRivieres.length,
      rivieres: nearbyRivieres
    });

  } catch (error) {
    console.error('Erreur lors de la recherche de rivières à proximité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche de rivières à proximité'
    });
  }
});

module.exports = router; 