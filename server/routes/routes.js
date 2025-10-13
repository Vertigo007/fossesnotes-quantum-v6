const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const sequelize = require('../config/database');
const Route = require('../models/Route')(sequelize);
const User = require('../models/User')(sequelize);

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// GET /api/routes - Récupérer toutes les routes de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routes = await Route.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      routes: routes
    });
  } catch (error) {
    console.error('Erreur récupération routes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des routes'
    });
  }
});

// GET /api/routes/:id - Récupérer une route spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const route = await Route.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route non trouvée'
      });
    }

    res.json({
      success: true,
      route: route
    });
  } catch (error) {
    console.error('Erreur récupération route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la route'
    });
  }
});

// POST /api/routes - Créer une nouvelle route
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, date, destinations, stats } = req.body;

    // Validation
    if (!name || !destinations || destinations.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Nom et au moins 2 destinations requis'
      });
    }

    // Vérifier les limites du plan utilisateur
    const user = await User.findByPk(req.user.id);
    const planLimits = {
      free: { maxRoutes: 1, maxDestinations: 3 },
      standard: { maxRoutes: 3, maxDestinations: 5 },
      premium: { maxRoutes: 5, maxDestinations: 8 },
      elite: { maxRoutes: 10, maxDestinations: 15 }
    };

    const currentPlan = user.plan || 'free';
    const limits = planLimits[currentPlan];

    // Vérifier le nombre de routes existantes
    const existingRoutes = await Route.count({
      where: { userId: req.user.id }
    });

    if (existingRoutes >= limits.maxRoutes) {
      return res.status(400).json({
        success: false,
        message: `Limite atteinte: ${limits.maxRoutes} routes maximum pour votre plan`
      });
    }

    // Vérifier le nombre de destinations
    if (destinations.length > limits.maxDestinations) {
      return res.status(400).json({
        success: false,
        message: `Limite atteinte: ${limits.maxDestinations} destinations maximum pour votre plan`
      });
    }

    // Créer la route
    const route = await Route.create({
      userId: req.user.id,
      name,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      destinations,
      stats: stats || {}
    });

    res.status(201).json({
      success: true,
      message: 'Route créée avec succès',
      route: route
    });
  } catch (error) {
    console.error('Erreur création route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la route'
    });
  }
});

// PUT /api/routes/:id - Mettre à jour une route
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, date, destinations, stats, status } = req.body;

    const route = await Route.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route non trouvée'
      });
    }

    // Validation
    if (destinations && destinations.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Au moins 2 destinations requises'
      });
    }

    // Vérifier les limites du plan utilisateur
    const user = await User.findByPk(req.user.id);
    const planLimits = {
      free: { maxRoutes: 1, maxDestinations: 3 },
      standard: { maxRoutes: 3, maxDestinations: 5 },
      premium: { maxRoutes: 5, maxDestinations: 8 },
      elite: { maxRoutes: 10, maxDestinations: 15 }
    };

    const currentPlan = user.plan || 'free';
    const limits = planLimits[currentPlan];

    // Vérifier le nombre de destinations
    if (destinations && destinations.length > limits.maxDestinations) {
      return res.status(400).json({
        success: false,
        message: `Limite atteinte: ${limits.maxDestinations} destinations maximum pour votre plan`
      });
    }

    // Mettre à jour la route
    await route.update({
      name: name || route.name,
      description: description !== undefined ? description : route.description,
      date: date || route.date,
      destinations: destinations || route.destinations,
      stats: stats || route.stats,
      status: status || route.status
    });

    res.json({
      success: true,
      message: 'Route mise à jour avec succès',
      route: route
    });
  } catch (error) {
    console.error('Erreur mise à jour route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la route'
    });
  }
});

// DELETE /api/routes/:id - Supprimer une route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const route = await Route.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route non trouvée'
      });
    }

    await route.destroy();

    res.json({
      success: true,
      message: 'Route supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression route:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la route'
    });
  }
});

// GET /api/routes/:id/pdf - Générer un PDF de la route
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const route = await Route.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route non trouvée'
      });
    }

    // Créer le PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Configuration de la réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${route.name.replace(/\s+/g, '_')}_route.pdf"`);

    // Pipe le PDF vers la réponse
    doc.pipe(res);

    // En-tête
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('FossesNotes QUANTUM', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(16)
       .font('Helvetica')
       .text('Planificateur de routes de pêche', { align: 'center' })
       .moveDown(2);

    // Informations de la route
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(route.name)
       .moveDown(0.5);

    if (route.description) {
      doc.fontSize(12)
         .font('Helvetica')
         .text(route.description)
         .moveDown(1);
    }

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Date: ${new Date(route.date).toLocaleDateString()}`)
       .moveDown(1);

    // Statistiques
    if (route.stats) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Statistiques de la route')
         .moveDown(0.5);

      doc.fontSize(12)
         .font('Helvetica')
         .text(`Distance totale: ${route.stats.totalDistance || 0} km`)
         .text(`Temps de trajet: ${Math.floor((route.stats.totalTime || 0) / 60)}h ${(route.stats.totalTime || 0) % 60}min`)
         .text(`Nombre de destinations: ${route.destinations.length}`)
         .moveDown(1);
    }

    // Itinéraire
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Itinéraire')
       .moveDown(0.5);

    route.destinations.forEach((destination, index) => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${destination.name}`)
         .moveDown(0.2);

      if (destination.type === 'river') {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`   Type: Rivière à saumon`)
           .text(`   Province: ${destination.province || 'N/A'}`)
           .text(`   Région: ${destination.region || 'N/A'}`);

        if (destination.riverData) {
          const river = destination.riverData;
          if (river.nombre_fosses) {
            doc.text(`   Nombre de fosses: ${river.nombre_fosses}`);
          }
          if (river.classe) {
            const classeNames = { 1: 'Elite', 2: 'Standard', 3: 'Débutant' };
            doc.text(`   Classe: ${classeNames[river.classe] || 'N/A'}`);
          }
        }
      } else {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`   Type: Destination personnalisée`);
      }

      if (destination.latitude && destination.longitude) {
        doc.text(`   Coordonnées: ${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`);
      }

      doc.moveDown(0.5);
    });

    // Pied de page
    doc.moveDown(2);
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Généré le ${new Date().toLocaleDateString()} par FossesNotes QUANTUM`, { align: 'center' });

    // Finaliser le PDF
    doc.end();

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF'
    });
  }
});

// GET /api/routes/public - Récupérer les routes publiques
router.get('/public/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, province, classe } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isPublic: true };
    if (province) whereClause['destinations.province'] = province;
    if (classe) whereClause['destinations.classe'] = parseInt(classe);

    const routes = await Route.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'plan']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      routes: routes.rows,
      total: routes.count,
      page: parseInt(page),
      totalPages: Math.ceil(routes.count / limit)
    });
  } catch (error) {
    console.error('Erreur récupération routes publiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des routes publiques'
    });
  }
});

module.exports = router;



