const express = require('express');
const router = express.Router();
const { authRequired, requirePlan } = require('../utils/auth');

// Couches premium (Pro/Elite)
router.get('/layers', authRequired, requirePlan('pro'), async (req, res) => {
  try {
    // Retourner les couches premium selon le plan
    const layers = [
      {
        id: 'weather-7d',
        name: 'Météo 7 jours',
        description: 'Prévisions météorologiques détaillées',
        available: ['pro', 'elite']
      },
      {
        id: 'water-temp',
        name: 'Température de l\'eau',
        description: 'Données de température en temps réel',
        available: ['elite']
      },
      {
        id: 'water-level',
        name: 'Niveau d\'eau',
        description: 'Niveaux et débits des rivières',
        available: ['elite']
      },
      {
        id: 'ai-predictions',
        name: 'Prédictions IA',
        description: 'Algorithmes propriétaires de prédiction',
        available: ['elite']
      }
    ];
    
    // Filtrer selon le plan de l'utilisateur
    const userPlan = req.user.plan;
    const availableLayers = layers.filter(layer => 
      layer.available.includes(userPlan)
    );
    
    res.json({ 
      layers: availableLayers,
      userPlan,
      totalLayers: availableLayers.length
    });
  } catch (error) {
    console.error('Erreur récupération couches:', error);
    res.status(500).json({ error: 'Erreur récupération couches' });
  }
});

// Packs hors-ligne (Pro/Elite)
router.get('/packs/:river_id', authRequired, requirePlan('pro'), async (req, res) => {
  try {
    const { river_id } = req.params;
    const userPlan = req.user.plan;
    
    // Simuler la génération d'une URL signée
    const packId = `pack-${river_id}-${Date.now()}`;
    const signedUrl = `https://storage.fossesnotes.com/packs/${packId}.zip?token=${packId}`;
    
    res.json({ 
      riverId: river_id,
      packId,
      signedUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      size: '15.2 MB',
      includes: [
        'Carte détaillée de la rivière',
        'Données des fosses',
        'Points d\'intérêt',
        'Données météo (si Elite)',
        'Prédictions IA (si Elite)'
      ]
    });
  } catch (error) {
    console.error('Erreur génération pack:', error);
    res.status(500).json({ error: 'Erreur génération pack' });
  }
});

// Données utilisateur premium
router.get('/profile', authRequired, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userPlan = req.user.plan;
    
    // Données de base pour tous les plans
    const profile = {
      id: userId,
      email: req.user.email,
      plan: userPlan,
      lang: req.user.lang,
      stats: {
        riversVisited: 12,
        totalFishingHours: 48,
        catches: 23
      }
    };
    
    // Données supplémentaires pour Pro/Elite
    if (userPlan === 'pro' || userPlan === 'elite') {
      profile.premium = {
        offlinePacks: 5,
        savedRoutes: 8,
        customMarkers: 15
      };
    }
    
    // Données exclusives pour Elite
    if (userPlan === 'elite') {
      profile.elite = {
        aiPredictions: 42,
        waterDataAccess: true,
        prioritySupport: true,
        betaFeatures: ['advanced-analytics', 'social-features']
      };
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur récupération profil' });
  }
});

// Statistiques avancées (Elite seulement)
router.get('/analytics', authRequired, requirePlan('elite'), async (req, res) => {
  try {
    const analytics = {
      fishingTrends: {
        bestHours: ['6:00-8:00', '18:00-20:00'],
        bestSeasons: ['Printemps', 'Automne'],
        weatherConditions: {
          optimal: 'Nuageux avec légère pluie',
          avoid: 'Vent fort > 20km/h'
        }
      },
      riverRankings: [
        { name: 'Rivière Matapédia', score: 9.2, visits: 156 },
        { name: 'Rivière Restigouche', score: 8.8, visits: 134 },
        { name: 'Rivière Cascapédia', score: 8.5, visits: 98 }
      ],
      aiInsights: [
        'Pic d\'activité prévu cette semaine sur la Matapédia',
        'Conditions optimales sur la Restigouche dans 3 jours',
        'Nouveau spot découvert par l\'IA sur la Cascapédia'
      ]
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Erreur récupération analytics:', error);
    res.status(500).json({ error: 'Erreur récupération analytics' });
  }
});

module.exports = router;



