import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Traductions complètes
const translations = {
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    map: 'Carte',
    journal: 'Journal',
    community: 'Communauté',
    admin: 'Administration',
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    login: 'Connexion',
    register: 'Inscription',
    
    // Dashboard
    welcome: 'Bienvenue',
    recentActivity: 'Activité récente',
    weatherConditions: 'Conditions météo',
    fishingForecast: 'Prévisions de pêche',
    nextTrip: 'Prochaine sortie',
    plan: 'Planifier',
    
    // Map
    rivers: 'Rivières',
    conditions: 'Conditions',
    temperature: 'Température',
    waterLevel: 'Niveau d\'eau',
    visibility: 'Visibilité',
    gpsDirections: 'Directions GPS',
    satellite: 'Satellite',
    terrain: 'Relief',
    outdoor: 'Extérieur',
    road: 'Routière',
    
    // Journal
    newEntry: 'Nouvelle entrée',
    date: 'Date',
    location: 'Localisation',
    species: 'Espèce',
    technique: 'Technique',
    weather: 'Météo',
    notes: 'Notes',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    
    // Community
    posts: 'Publications',
    createPost: 'Créer une publication',
    share: 'Partager',
    like: 'J\'aime',
    comment: 'Commenter',
    followers: 'Abonnés',
    following: 'Abonnements',
    
    // Admin
    users: 'Utilisateurs',
    statistics: 'Statistiques',
    moderation: 'Modération',
    system: 'Système',
    loginAsUser: 'Se connecter en tant qu\'utilisateur',
    changeStatus: 'Changer le statut',
    approve: 'Approuver',
    reject: 'Rejeter',
    
    // Plans
    basic: 'Basique',
    pro: 'Professionnel',
    elite: 'Élite',
    upgrade: 'Améliorer',
    
    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    view: 'Voir',
    add: 'Ajouter',
    remove: 'Supprimer',
    
    // Fishing specific
    salmon: 'Saumon atlantique',
    trout: 'Truite mouchetée',
    flyFishing: 'Pêche à la mouche',
    catchAndRelease: 'Prise et remise à l\'eau',
    fishingLicense: 'Permis de pêche',
    
    // Weather
    sunny: 'Ensoleillé',
    cloudy: 'Nuageux',
    rainy: 'Pluvieux',
    windy: 'Venteux',
    cold: 'Froid',
    warm: 'Chaud',
    
    // Time
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    tomorrow: 'Demain',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    
    // Messages
    noData: 'Aucune donnée disponible',
    noResults: 'Aucun résultat trouvé',
    connectionError: 'Erreur de connexion',
    tryAgain: 'Réessayer',
    comingSoon: 'Bientôt disponible',
    
    // Notifications
    notification: 'Notification',
    newMessage: 'Nouveau message',
    newPost: 'Nouvelle publication',
    weatherAlert: 'Alerte météo',
    fishingAlert: 'Alerte pêche'
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    map: 'Map',
    journal: 'Journal',
    community: 'Community',
    admin: 'Admin',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    
    // Dashboard
    welcome: 'Welcome',
    recentActivity: 'Recent Activity',
    weatherConditions: 'Weather Conditions',
    fishingForecast: 'Fishing Forecast',
    nextTrip: 'Next Trip',
    plan: 'Plan',
    
    // Map
    rivers: 'Rivers',
    conditions: 'Conditions',
    temperature: 'Temperature',
    waterLevel: 'Water Level',
    visibility: 'Visibility',
    gpsDirections: 'GPS Directions',
    satellite: 'Satellite',
    terrain: 'Terrain',
    outdoor: 'Outdoor',
    road: 'Road',
    
    // Journal
    newEntry: 'New Entry',
    date: 'Date',
    location: 'Location',
    species: 'Species',
    technique: 'Technique',
    weather: 'Weather',
    notes: 'Notes',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    
    // Community
    posts: 'Posts',
    createPost: 'Create Post',
    share: 'Share',
    like: 'Like',
    comment: 'Comment',
    followers: 'Followers',
    following: 'Following',
    
    // Admin
    users: 'Users',
    statistics: 'Statistics',
    moderation: 'Moderation',
    system: 'System',
    loginAsUser: 'Login as User',
    changeStatus: 'Change Status',
    approve: 'Approve',
    reject: 'Reject',
    
    // Plans
    basic: 'Basic',
    pro: 'Professional',
    elite: 'Elite',
    upgrade: 'Upgrade',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    view: 'View',
    add: 'Add',
    remove: 'Remove',
    
    // Fishing specific
    salmon: 'Atlantic Salmon',
    trout: 'Brook Trout',
    flyFishing: 'Fly Fishing',
    catchAndRelease: 'Catch and Release',
    fishingLicense: 'Fishing License',
    
    // Weather
    sunny: 'Sunny',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    windy: 'Windy',
    cold: 'Cold',
    warm: 'Warm',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    
    // Messages
    noData: 'No data available',
    noResults: 'No results found',
    connectionError: 'Connection error',
    tryAgain: 'Try again',
    comingSoon: 'Coming soon',
    
    // Notifications
    notification: 'Notification',
    newMessage: 'New message',
    newPost: 'New post',
    weatherAlert: 'Weather alert',
    fishingAlert: 'Fishing alert'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  const [t] = useState(() => (key) => translations[language][key] || key);

  useEffect(() => {
    // Détecter la langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    const savedLang = localStorage.getItem('fossesnotes-language');
    
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    } else if (translations[browserLang]) {
      setLanguage(browserLang);
    }
  }, []);

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      setLanguage(newLang);
      localStorage.setItem('fossesnotes-language', newLang);
    }
  };

  const value = {
    language,
    changeLanguage,
    t,
    translations: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 