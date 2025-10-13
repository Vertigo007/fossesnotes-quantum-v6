import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const T = {
  fr: {
    upgrade: 'Passer en Pro',
    upgradeElite: 'Passer en Elite',
    login: 'Se connecter',
    required: 'Plan requis',
    proRequired: 'Plan Pro requis',
    eliteRequired: 'Plan Elite requis'
  },
  en: {
    upgrade: 'Upgrade to Pro',
    upgradeElite: 'Upgrade to Elite',
    login: 'Login',
    required: 'Plan required',
    proRequired: 'Pro plan required',
    eliteRequired: 'Elite plan required'
  }
};

export default function PaywallGuard({ 
  children, 
  minPlan = 'free',
  fallback = null,
  showUpgrade = true 
}) {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const t = T[language];

  // Si pas de plan minimum requis, afficher le contenu
  if (minPlan === 'free') {
    return children;
  }

  // Si pas connecté, afficher le fallback ou un message de connexion
  if (!isAuthenticated) {
    if (fallback) return fallback;
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800 mb-2">{t.required}</p>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => window.location.href = '/login'}
        >
          {t.login}
        </button>
      </div>
    );
  }

  // Vérifier le plan de l'utilisateur
  const userPlan = user?.plan || 'free';
  const planOrder = { free: 0, pro: 1, elite: 2 };
  
  if (planOrder[userPlan] >= planOrder[minPlan]) {
    return children;
  }

  // Plan insuffisant
  if (fallback) return fallback;

  const getUpgradeText = () => {
    if (minPlan === 'elite') return t.upgradeElite;
    return t.upgrade;
  };

  const getUpgradeUrl = () => {
    if (minPlan === 'elite') return '/pricing?plan=elite';
    return '/pricing?plan=pro';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
      <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {minPlan === 'elite' ? t.eliteRequired : t.proRequired}
        </h3>
        <p className="text-gray-600 mb-4">
          {language === 'fr' 
            ? 'Débloque cette fonctionnalité avec un plan supérieur'
            : 'Unlock this feature with a higher plan'
          }
        </p>
      </div>
      
      {showUpgrade && (
        <div className="space-y-2">
          <button 
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            onClick={() => window.location.href = getUpgradeUrl()}
          >
            {getUpgradeText()}
          </button>
          
          <button 
            className="w-full text-blue-600 hover:text-blue-700 text-sm"
            onClick={() => window.location.href = '/pricing'}
          >
            {language === 'fr' ? 'Voir tous les plans' : 'View all plans'}
          </button>
        </div>
      )}
    </div>
  );
}

// Composants spécialisés pour chaque plan
export function ProGuard({ children, ...props }) {
  return <PaywallGuard minPlan="pro" {...props}>{children}</PaywallGuard>;
}

export function EliteGuard({ children, ...props }) {
  return <PaywallGuard minPlan="elite" {...props}>{children}</PaywallGuard>;
}



