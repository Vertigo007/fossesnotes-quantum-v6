const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/plans - Récupérer tous les plans actifs (public)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['price', 'ASC']],
      attributes: ['id', 'name', 'slug', 'description', 'price', 'currency', 'billing_cycle', 'features', 'limits', 'is_popular']
    });

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Erreur récupération plans:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans'
    });
  }
});

// GET /api/plans/:id - Récupérer un plan spécifique
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    res.json({
      success: true,
      plan: plan
    });
  } catch (error) {
    console.error('Erreur récupération plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du plan'
    });
  }
});

// POST /api/plans - Créer un nouveau plan (admin seulement)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency,
      billing_cycle,
      features,
      limits,
      is_popular,
      sort_order
    } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le slug sont requis'
      });
    }

    // Vérifier si le slug existe déjà
    const existingPlan = await Plan.findOne({ where: { slug } });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Un plan avec ce slug existe déjà'
      });
    }

    const plan = await Plan.create({
      name,
      slug,
      description,
      price: price || 0,
      currency: currency || 'CAD',
      billing_cycle: billing_cycle || 'monthly',
      features: features || {},
      limits: limits || {},
      is_popular: is_popular || false,
      sort_order: sort_order || 0
    });

    res.status(201).json({
      success: true,
      plan: plan,
      message: 'Plan créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du plan'
    });
  }
});

// PUT /api/plans/:id - Mettre à jour un plan (admin seulement)
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    const {
      name,
      slug,
      description,
      price,
      currency,
      billing_cycle,
      features,
      limits,
      is_active,
      is_popular,
      sort_order
    } = req.body;

    // Vérifier si le slug existe déjà (sauf pour ce plan)
    if (slug && slug !== plan.slug) {
      const existingPlan = await Plan.findOne({ where: { slug } });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Un plan avec ce slug existe déjà'
        });
      }
    }

    await plan.update({
      name: name || plan.name,
      slug: slug || plan.slug,
      description: description !== undefined ? description : plan.description,
      price: price !== undefined ? price : plan.price,
      currency: currency || plan.currency,
      billing_cycle: billing_cycle || plan.billing_cycle,
      features: features || plan.features,
      limits: limits || plan.limits,
      is_active: is_active !== undefined ? is_active : plan.is_active,
      is_popular: is_popular !== undefined ? is_popular : plan.is_popular,
      sort_order: sort_order !== undefined ? sort_order : plan.sort_order
    });

    res.json({
      success: true,
      plan: plan,
      message: 'Plan mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du plan'
    });
  }
});

// DELETE /api/plans/:id - Supprimer un plan (admin seulement)
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Plan supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du plan'
    });
  }
});

// GET /api/plans/admin/all - Récupérer tous les plans (admin seulement)
router.get('/admin/all', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const plans = await Plan.findAll({
      order: [['sort_order', 'ASC'], ['price', 'ASC']]
    });

    res.json({
      success: true,
      plans: plans
    });
  } catch (error) {
    console.error('Erreur récupération plans admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans'
    });
  }
});

module.exports = router;
