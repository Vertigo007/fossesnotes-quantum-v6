import React from 'react';

const T = {
  fr: {
    title: 'Choisis ton plan',
    free: { 
      name: 'Gratuit', 
      price: '0$', 
      features: [
        'Carte de base',
        'Rivières publiques', 
        'POI de démonstration',
        'Accès limité aux données'
      ] 
    },
    pro: { 
      name: 'Pro', 
      price: '199$/an', 
      features: [
        'Couches premium',
        'Packs hors-ligne',
        'Mises à jour régulières',
        'Météo 7 jours',
        'Données avancées'
      ] 
    },
    elite: { 
      name: 'Elite', 
      price: '399$/an', 
      features: [
        'Tout Pro',
        'Sections avancées',
        'Priorité support',
        'Température de l\'eau',
        'Niveaux et débits',
        'Prédictions IA'
      ] 
    },
    ctaFree: 'Utiliser',
    ctaPro: 'Passer en Pro',
    ctaElite: 'Passer en Elite',
    ctaManage: 'Gérer mon abonnement',
    ctaMap: 'Aller à la carte'
  },
  en: {
    title: 'Choose your plan',
    free: { 
      name: 'Free', 
      price: '$0', 
      features: [
        'Base map',
        'Public rivers', 
        'Demo POIs',
        'Limited data access'
      ] 
    },
    pro: { 
      name: 'Pro', 
      price: '$199/yr', 
      features: [
        'Premium layers',
        'Offline packs',
        'Regular updates',
        '7-day weather',
        'Advanced data'
      ] 
    },
    elite: { 
      name: 'Elite', 
      price: '$399/yr', 
      features: [
        'All Pro',
        'Advanced sections',
        'Priority support',
        'Water temperature',
        'Water levels & flow',
        'AI predictions'
      ] 
    },
    ctaFree: 'Use Free',
    ctaPro: 'Upgrade to Pro',
    ctaElite: 'Upgrade to Elite',
    ctaManage: 'Manage subscription',
    ctaMap: 'Go to map'
  }
};

export default function PricingPlans({ 
  lang = 'fr', 
  onSelect,
  user = null,
  isLoggedIn = false 
}) {
  const t = T[lang];
  
  const cards = [
    { key: 'free', ...t.free },
    { key: 'pro', ...t.pro },
    { key: 'elite', ...t.elite }
  ];

  const handleSelect = (plan) => {
    if (onSelect) {
      onSelect(plan);
    } else {
      // Comportement par défaut
      if (plan === 'free') {
        window.location.href = '/map';
      } else {
        window.location.href = '/pricing';
      }
    }
  };

  const getButtonText = (planKey) => {
    if (!isLoggedIn) {
      return planKey === 'free' ? t.ctaFree : 
             planKey === 'pro' ? t.ctaPro : t.ctaElite;
    }
    
    // Utilisateur connecté
    if (user) {
      const userPlan = user.plan || 'free';
      const planOrder = { free: 0, pro: 1, elite: 2 };
      
      if (planOrder[userPlan] >= planOrder[planKey]) {
        return t.ctaMap; // Plan actuel ou supérieur
      } else {
        return planKey === 'pro' ? t.ctaPro : t.ctaElite; // Upgrade
      }
    }
    
    return planKey === 'free' ? t.ctaFree : 
           planKey === 'pro' ? t.ctaPro : t.ctaElite;
  };

  const getButtonAction = (planKey) => {
    if (!isLoggedIn) {
      return () => handleSelect(planKey);
    }
    
    if (user) {
      const userPlan = user.plan || 'free';
      const planOrder = { free: 0, pro: 1, elite: 2 };
      
      if (planOrder[userPlan] >= planOrder[planKey]) {
        return () => window.location.href = '/map';
      } else {
        return () => handleSelect(planKey);
      }
    }
    
    return () => handleSelect(planKey);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">{t.title}</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {cards.map(card => (
          <div 
            key={card.key} 
            className={`border rounded-xl p-5 shadow-sm bg-white relative ${
              user && user.plan === card.key ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {user && user.plan === card.key && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {lang === 'fr' ? 'Actuel' : 'Current'}
              </div>
            )}
            
            <div className="text-xl font-semibold mb-2">{card.name}</div>
            <div className="text-3xl font-bold mb-4 text-blue-600">{card.price}</div>
            
            <ul className="space-y-2 mb-6">
              {card.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              className={`w-full py-2 rounded-md font-medium transition-colors ${
                card.key === 'free' 
                  ? 'bg-gray-800 text-white hover:bg-gray-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={getButtonAction(card.key)}
            >
              {getButtonText(card.key)}
            </button>
          </div>
        ))}
      </div>
      
      {isLoggedIn && user && (user.plan === 'pro' || user.plan === 'elite') && (
        <div className="mt-6 text-center">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => window.location.href = '/account'}
          >
            {t.ctaManage}
          </button>
        </div>
      )}
    </div>
  );
}



