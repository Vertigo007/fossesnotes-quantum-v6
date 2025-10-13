const Plan = require('../models/Plan');

const defaultPlans = [
  {
    name: "Gratuit",
    slug: "free",
    description: "Plan de base pour découvrir FossesNotes",
    price: 0.00,
    currency: "CAD",
    billing_cycle: "monthly",
    features: {
      "rivières": "5 rivières",
      "météo": "Météo basique",
      "journal": "10 entrées/mois",
      "carte": "Carte basique",
      "communauté": "Lecture seulement",
      "ia": "Non disponible",
      "export": "Non disponible",
      "support": "Email uniquement"
    },
    limits: {
      "rivières_max": 5,
      "journal_entries": 10,
      "posts_per_month": 0,
      "photos_per_entry": 1,
      "export_formats": [],
      "ai_requests": 0
    },
    is_active: true,
    is_popular: false,
    sort_order: 1
  },
  {
    name: "Standard",
    slug: "standard",
    description: "Plan complet pour pêcheurs passionnés",
    price: 9.99,
    currency: "CAD",
    billing_cycle: "monthly",
    features: {
      "rivières": "18 rivières",
      "météo": "Météo avancée + prévisions",
      "journal": "Entrées illimitées",
      "carte": "Carte interactive complète",
      "communauté": "Posts et commentaires",
      "ia": "Conseils basiques",
      "export": "PDF et CSV",
      "support": "Support prioritaire"
    },
    limits: {
      "rivières_max": 18,
      "journal_entries": -1, // illimité
      "posts_per_month": 20,
      "photos_per_entry": 5,
      "export_formats": ["pdf", "csv"],
      "ai_requests": 50
    },
    is_active: true,
    is_popular: true,
    sort_order: 2
  },
  {
    name: "Premium",
    slug: "premium",
    description: "Plan premium avec fonctionnalités avancées",
    price: 19.99,
    currency: "CAD",
    billing_cycle: "monthly",
    features: {
      "rivières": "18 rivières + exclusives",
      "météo": "Météo ultra-précise + historique",
      "journal": "Journal avancé + analytics",
      "carte": "Carte 3D + GPS offline",
      "communauté": "Création de groupes",
      "ia": "IA prédictive complète",
      "export": "Tous formats + API",
      "support": "Support 24/7 + coaching"
    },
    limits: {
      "rivières_max": -1, // toutes
      "journal_entries": -1,
      "posts_per_month": -1,
      "photos_per_entry": 10,
      "export_formats": ["pdf", "csv", "excel", "json"],
      "ai_requests": -1
    },
    is_active: true,
    is_popular: false,
    sort_order: 3
  },
  {
    name: "Pro",
    slug: "pro",
    description: "Plan professionnel pour guides et entreprises",
    price: 49.99,
    currency: "CAD",
    billing_cycle: "monthly",
    features: {
      "rivières": "Toutes + données privées",
      "météo": "Données météo professionnelles",
      "journal": "Multi-utilisateurs + rapports",
      "carte": "Cartes personnalisées",
      "communauté": "Modération avancée",
      "ia": "IA personnalisée",
      "export": "API complète + webhooks",
      "support": "Support dédié + formation"
    },
    limits: {
      "rivières_max": -1,
      "journal_entries": -1,
      "posts_per_month": -1,
      "photos_per_entry": -1,
      "export_formats": ["pdf", "csv", "excel", "json", "api"],
      "ai_requests": -1,
      "users_per_account": 10
    },
    is_active: true,
    is_popular: false,
    sort_order: 4
  }
];

const seedPlans = async () => {
  try {
    console.log('🌱 Seeding plans d\'abonnement...');
    
    for (const planData of defaultPlans) {
      const existingPlan = await Plan.findOne({ where: { slug: planData.slug } });
      
      if (!existingPlan) {
        await Plan.create(planData);
        console.log(`✅ Plan créé: ${planData.name}`);
      } else {
        console.log(`⚠️ Plan existe déjà: ${planData.name}`);
      }
    }
    
    console.log('✅ Plans d\'abonnement seedés avec succès');
  } catch (error) {
    console.error('❌ Erreur seeding plans:', error);
  }
};

module.exports = { seedPlans, defaultPlans };



