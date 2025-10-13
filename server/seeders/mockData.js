const bcrypt = require('bcryptjs');

// Données mockées pour FossesNotes Community
const mockData = {
  // Badges
  badges: [
    {
      code: 'debutant_pecheur',
      nom: 'Débutant Pêcheur',
      description: 'Premier pas dans l\'univers de la pêche à la mouche',
      icon: '🎣',
      couleur: '#6B7280',
      categorie: 'progression',
      points_requis: 0,
      rarete: 'commune'
    },
    {
      code: 'expert_mouche',
      nom: 'Expert Mouche',
      description: 'Maîtrisez l\'art de la mouche artificielle',
      icon: '🦋',
      couleur: '#3B82F6',
      categorie: 'progression',
      points_requis: 500,
      rarete: 'rare'
    },
    {
      code: 'guide_riviere',
      nom: 'Guide de Rivière',
      description: 'Explorez 10 rivières différentes',
      icon: '🗺️',
      couleur: '#10B981',
      categorie: 'progression',
      points_requis: 1000,
      rarete: 'epique'
    },
    {
      code: 'mentor_communautaire',
      nom: 'Mentor Communautaire',
      description: 'Aidez 100 autres pêcheurs',
      icon: '👨‍🏫',
      couleur: '#F59E0B',
      categorie: 'progression',
      points_requis: 2500,
      rarete: 'legendaire'
    },
    {
      code: 'champion_saumon',
      nom: 'Champion Saumon',
      description: 'Capturez 5 saumons atlantiques',
      icon: '🐟',
      couleur: '#EF4444',
      categorie: 'progression',
      points_requis: 1000,
      rarete: 'epique'
    },
    {
      code: 'printemps_2024',
      nom: 'Printemps 2024',
      description: 'Pêche active pendant le printemps 2024',
      icon: '🌸',
      couleur: '#EC4899',
      categorie: 'saisonnier',
      points_requis: 0,
      rarete: 'commune'
    }
  ],

  // Utilisateurs mockés
  users: [
    {
      email: 'admin@fossesnotes.test',
      password: 'admin123',
      nom: 'Admin',
      prenom: 'FossesNotes',
      username: 'admin_fossesnotes',
      role: 'super_admin',
      bio: 'Administrateur principal de FossesNotes',
      localisation: 'Québec, Canada',
      experience_niveau: 'expert',
      points: 5000,
      niveau: 5,
      badges: ['debutant_pecheur', 'expert_mouche', 'guide_riviere', 'mentor_communautaire'],
      subscription_type: 'elite',
      is_verified: true
    },
    {
      email: 'elite@fossesnotes.test',
      password: 'elite123',
      nom: 'Tremblay',
      prenom: 'Pierre',
      username: 'pierre_tremblay',
      role: 'elite',
      bio: 'Pêcheur passionné depuis 15 ans, spécialiste du saumon atlantique',
      localisation: 'Montréal, Québec',
      experience_niveau: 'expert',
      points: 3200,
      niveau: 4,
      badges: ['debutant_pecheur', 'expert_mouche', 'champion_saumon', 'printemps_2024'],
      subscription_type: 'elite',
      posts_count: 45,
      comments_count: 120,
      likes_received: 340,
      is_verified: true
    },
    {
      email: 'instructor@fossesnotes.test',
      password: 'instructor123',
      nom: 'Dubois',
      prenom: 'Marie',
      username: 'marie_dubois',
      role: 'instructor',
      bio: 'Instructrice certifiée en pêche à la mouche, créatrice de formations',
      localisation: 'Québec, Québec',
      experience_niveau: 'expert',
      points: 2800,
      niveau: 4,
      badges: ['debutant_pecheur', 'expert_mouche', 'guide_riviere'],
      subscription_type: 'elite',
      posts_count: 23,
      comments_count: 89,
      likes_received: 156,
      is_verified: true
    },
    {
      email: 'moderator@fossesnotes.test',
      password: 'moderator123',
      nom: 'Lavoie',
      prenom: 'Jean',
      username: 'jean_lavoie',
      role: 'moderator',
      bio: 'Modérateur de la communauté, pêcheur expérimenté',
      localisation: 'Sherbrooke, Québec',
      experience_niveau: 'avance',
      points: 1800,
      niveau: 3,
      badges: ['debutant_pecheur', 'expert_mouche'],
      subscription_type: 'pro',
      posts_count: 67,
      comments_count: 234,
      likes_received: 445,
      is_verified: true
    },
    {
      email: 'user1@fossesnotes.test',
      password: 'user123',
      nom: 'Gagnon',
      prenom: 'Sophie',
      username: 'sophie_gagnon',
      role: 'user',
      bio: 'Débutante passionnée par la pêche à la mouche',
      localisation: 'Gatineau, Québec',
      experience_niveau: 'debutant',
      points: 450,
      niveau: 2,
      badges: ['debutant_pecheur', 'printemps_2024'],
      subscription_type: 'basic',
      posts_count: 12,
      comments_count: 45,
      likes_received: 78,
      is_verified: true
    },
    {
      email: 'user2@fossesnotes.test',
      password: 'user123',
      nom: 'Bouchard',
      prenom: 'Marc',
      username: 'marc_bouchard',
      role: 'user',
      bio: 'Pêcheur intermédiaire, en apprentissage constant',
      localisation: 'Trois-Rivières, Québec',
      experience_niveau: 'intermediaire',
      points: 850,
      niveau: 3,
      badges: ['debutant_pecheur'],
      subscription_type: 'free',
      posts_count: 8,
      comments_count: 23,
      likes_received: 34,
      is_verified: true
    },
    {
      email: 'club_admin@fossesnotes.test',
      password: 'club123',
      nom: 'Deschamps',
      prenom: 'Claude',
      username: 'claude_deschamps',
      role: 'club_admin',
      bio: 'Président du Club de Pêche à la Mouche de Montréal',
      localisation: 'Montréal, Québec',
      experience_niveau: 'avance',
      points: 1200,
      niveau: 3,
      badges: ['debutant_pecheur', 'expert_mouche'],
      subscription_type: 'pro',
      posts_count: 34,
      comments_count: 67,
      likes_received: 123,
      is_verified: true
    }
  ],

  // Catégories de conversation
  categories: [
    {
      nom: 'Techniques de Pêche',
      slug: 'techniques-peche',
      description: 'Partagez vos techniques et astuces de pêche à la mouche',
      icon: '🎣',
      couleur: '#3B82F6',
      ordre: 1,
      regles: ['Respectez les autres', 'Partagez des photos', 'Soyez constructif'],
      permissions_poster: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin'],
      permissions_lire: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    {
      nom: 'Rivières du Québec',
      slug: 'rivieres-quebec',
      description: 'Discussions sur les rivières québécoises et leurs spécificités',
      icon: '🗺️',
      couleur: '#10B981',
      ordre: 2,
      regles: ['Pas de spots secrets', 'Respectez l\'environnement', 'Partagez vos expériences'],
      permissions_poster: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin'],
      permissions_lire: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    {
      nom: 'Équipement et Matériel',
      slug: 'equipement-materiel',
      description: 'Conseils sur l\'équipement de pêche à la mouche',
      icon: '🛠️',
      couleur: '#F59E0B',
      ordre: 3,
      regles: ['Pas de spam commercial', 'Conseils constructifs', 'Partagez vos découvertes'],
      permissions_poster: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin'],
      permissions_lire: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    {
      nom: 'Événements et Sorties',
      slug: 'evenements-sorties',
      description: 'Organisez des sorties de pêche et partagez vos événements',
      icon: '📅',
      couleur: '#8B5CF6',
      ordre: 4,
      regles: ['Respectez les règlements', 'Soyez ponctuels', 'Partagez les photos'],
      permissions_poster: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin'],
      permissions_lire: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    {
      nom: 'Formations et Éducation',
      slug: 'formations-education',
      description: 'Ressources d\'apprentissage et formations',
      icon: '📚',
      couleur: '#EC4899',
      ordre: 5,
      regles: ['Partagez vos connaissances', 'Soyez patient avec les débutants', 'Questions constructives'],
      permissions_poster: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin'],
      permissions_lire: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    {
      nom: 'Annonces Officielles',
      slug: 'annonces-officielles',
      description: 'Annonces importantes de FossesNotes',
      icon: '📢',
      couleur: '#EF4444',
      ordre: 0,
      est_prive: true,
      permissions_poster: ['super_admin', 'content_admin'],
      permissions_lire: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    },
    {
      nom: 'Aide et Support',
      slug: 'aide-support',
      description: 'Support technique et aide utilisateur',
      icon: '🆘',
      couleur: '#6B7280',
      ordre: 6,
      permissions_poster: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin'],
      permissions_lire: ['user', 'elite', 'moderator', 'instructor', 'content_admin', 'super_admin']
    }
  ],

  // Posts mockés
  posts: [
    {
      titre: 'Ma première capture de saumon atlantique !',
      contenu: 'Après 3 ans de pêche à la mouche, j\'ai enfin réussi à capturer mon premier saumon atlantique sur la rivière Miramichi. Quelle expérience incroyable ! J\'utilisais une mouche sèche #12 de ma propre fabrication. La technique qui a fonctionné : lancer en amont et laisser dériver naturellement. Partagez vos expériences similaires !',
      type: 'partage',
      user_id: 2, // Pierre Tremblay
      category_id: 1, // Techniques de Pêche
      tags: ['saumon', 'miramichi', 'premiere-capture', 'mouche-seche'],
      likes_count: 24,
      comments_count: 8,
      views_count: 156
    },
    {
      titre: 'Meilleures mouches pour la truite en début de saison ?',
      contenu: 'Salut à tous ! Je débute en pêche à la mouche et je me demande quelles sont les meilleures mouches à utiliser en début de saison pour la truite. J\'ai entendu parler des nymphes et des émergences, mais je ne sais pas par quoi commencer. Merci pour vos conseils !',
      type: 'question',
      user_id: 5, // Sophie Gagnon
      category_id: 1, // Techniques de Pêche
      tags: ['debutant', 'truite', 'mouches', 'debut-saison'],
      likes_count: 12,
      comments_count: 15,
      views_count: 89
    },
    {
      titre: 'Conditions actuelles - Rivière Restigouche',
      contenu: 'Juste de retour de la Restigouche. Niveau d\'eau : 45cm, température : 18°C, visibilité : excellente. Les saumons sont actifs tôt le matin et en fin d\'après-midi. Mouches qui fonctionnent : Green Highlander #8 et Blue Charm #10. Bonne pêche à tous !',
      type: 'discussion',
      user_id: 2, // Pierre Tremblay
      category_id: 2, // Rivières du Québec
      tags: ['restigouche', 'conditions', 'saumon', 'rapport'],
      likes_count: 31,
      comments_count: 12,
      views_count: 234
    },
    {
      titre: 'Nouvelle formation : Expert Saumon Atlantique',
      contenu: 'Je suis ravie d\'annoncer le lancement de ma nouvelle formation "Expert Saumon Atlantique" ! Cette formation de 6 semaines couvre tout ce que vous devez savoir pour maîtriser la pêche au saumon. Inscriptions ouvertes dès maintenant !',
      type: 'formation',
      user_id: 3, // Marie Dubois
      category_id: 5, // Formations et Éducation
      tags: ['formation', 'saumon', 'expert', 'nouveau'],
      likes_count: 18,
      comments_count: 6,
      views_count: 145
    },
    {
      titre: 'Sortie de groupe - Rivière Jacques-Cartier',
      contenu: 'Organisation d\'une sortie de groupe sur la Jacques-Cartier le 15 juillet prochain. Départ à 6h du matin, retour vers 18h. Maximum 8 personnes. Niveau intermédiaire requis. Inscription par message privé. Au plaisir de vous rencontrer !',
      type: 'discussion',
      user_id: 4, // Jean Lavoie
      category_id: 4, // Événements et Sorties
      tags: ['sortie-groupe', 'jacques-cartier', 'juillet', 'intermediaire'],
      likes_count: 15,
      comments_count: 9,
      views_count: 78
    }
  ],

  // Commentaires mockés
  comments: [
    {
      contenu: 'Félicitations ! C\'est un moment magique que tu n\'oublieras jamais. La Miramichi est vraiment une rivière exceptionnelle.',
      user_id: 3, // Marie Dubois
      post_id: 1,
      likes_count: 8
    },
    {
      contenu: 'Pour débuter, je recommande les nymphes #14-16 en couleurs naturelles (brun, olive, noir). Commence par des lancers courts et progresse graduellement.',
      user_id: 2, // Pierre Tremblay
      post_id: 2,
      likes_count: 12
    },
    {
      contenu: 'Merci pour ce rapport détaillé ! Je prévois d\'y aller la semaine prochaine. As-tu des conseils sur les meilleures heures ?',
      user_id: 5, // Sophie Gagnon
      post_id: 3,
      likes_count: 5
    },
    {
      contenu: 'Super initiative ! J\'ai hâte de voir le contenu de cette formation.',
      user_id: 4, // Jean Lavoie
      post_id: 4,
      likes_count: 3
    },
    {
      contenu: 'Je suis intéressé ! J\'ai déjà pêché sur la Jacques-Cartier, c\'est magnifique.',
      user_id: 6, // Marc Bouchard
      post_id: 5,
      likes_count: 2
    }
  ],

  // Formations mockées
  courses: [
    {
      titre: 'Bases de la Pêche à la Mouche',
      slug: 'bases-peche-mouche',
      description: 'Apprenez les fondamentaux de la pêche à la mouche avec cette formation complète pour débutants.',
      description_courte: 'Formation complète pour débutants',
      type: 'gratuit',
      prix: 0.00,
      instructeur_id: 3, // Marie Dubois
      niveau: 'debutant',
      duree: 180, // 3 heures
      modules_count: 4,
      lecons_count: 12,
      tags: ['debutant', 'bases', 'techniques'],
      prerequis: ['Aucun prérequis'],
      objectifs: ['Comprendre les bases', 'Maîtriser le lancer', 'Choisir l\'équipement'],
      statut: 'publie',
      est_featured: true,
      note_moyenne: 4.8,
      evaluations_count: 45,
      inscriptions_count: 234
    },
    {
      titre: 'Expert Saumon Atlantique',
      slug: 'expert-saumon-atlantique',
      description: 'Formation avancée pour maîtriser la pêche au saumon atlantique. Techniques spécialisées, lecture d\'eau, mouches spécialisées.',
      description_courte: 'Maîtrisez la pêche au saumon',
      type: 'payant',
      prix: 199.00,
      instructeur_id: 3, // Marie Dubois
      niveau: 'avance',
      duree: 360, // 6 heures
      modules_count: 6,
      lecons_count: 18,
      tags: ['saumon', 'avance', 'techniques-specialisees'],
      prerequis: ['Bases de la pêche à la mouche', 'Expérience intermédiaire'],
      objectifs: ['Maîtriser les techniques saumon', 'Lecture d\'eau avancée', 'Mouches spécialisées'],
      statut: 'publie',
      est_populaire: true,
      note_moyenne: 4.9,
      evaluations_count: 23,
      inscriptions_count: 89
    },
    {
      titre: 'Maître Artisan Mouche',
      slug: 'maitre-artisan-mouche',
      description: 'Apprenez à créer vos propres mouches artificielles. De la théorie à la pratique, devenez un artisan de la mouche.',
      description_courte: 'Créez vos propres mouches',
      type: 'payant',
      prix: 299.00,
      instructeur_id: 3, // Marie Dubois
      niveau: 'intermediaire',
      duree: 480, // 8 heures
      modules_count: 8,
      lecons_count: 24,
      tags: ['mouches', 'artisanat', 'creation'],
      prerequis: ['Bases de la pêche à la mouche'],
      objectifs: ['Créer des mouches sèches', 'Créer des nymphes', 'Créer des streamers'],
      statut: 'publie',
      note_moyenne: 4.7,
      evaluations_count: 34,
      inscriptions_count: 67
    }
  ],

  // Clubs mockés
  clubs: [
    {
      nom: 'Club de Pêche à la Mouche de Montréal',
      slug: 'club-peche-mouche-montreal',
      description: 'Club de pêche à la mouche fondé en 1985, dédié à la promotion et à l\'enseignement de la pêche à la mouche dans la région de Montréal.',
      type: 'club_peche',
      admin_id: 7, // Claude Deschamps
      couleur_principale: '#3B82F6',
      couleur_secondaire: '#10B981',
      localisation: 'Montréal, Québec',
      site_web: 'https://cpm-montreal.ca',
      email_contact: 'info@cpm-montreal.ca',
      telephone: '(514) 555-0123',
      reseaux_sociaux: {
        facebook: 'https://facebook.com/cpm-montreal',
        instagram: 'https://instagram.com/cpm-montreal'
      },
      abonnement_type: 'premium',
      membres_count: 156,
      posts_count: 89,
      evenements_count: 12
    },
    {
      nom: 'Association des Pêcheurs de Saumon du Québec',
      slug: 'association-pecheurs-saumon-quebec',
      description: 'Association dédiée à la conservation et à la pêche du saumon atlantique au Québec.',
      type: 'association',
      admin_id: 2, // Pierre Tremblay
      couleur_principale: '#EF4444',
      couleur_secondaire: '#F59E0B',
      localisation: 'Québec, Québec',
      site_web: 'https://apsq.ca',
      email_contact: 'contact@apsq.ca',
      telephone: '(418) 555-0456',
      reseaux_sociaux: {
        facebook: 'https://facebook.com/apsq',
        twitter: 'https://twitter.com/apsq'
      },
      abonnement_type: 'basique',
      membres_count: 89,
      posts_count: 45,
      evenements_count: 8
    }
  ]
};

module.exports = mockData;




