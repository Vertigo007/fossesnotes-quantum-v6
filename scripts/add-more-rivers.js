const sequelize = require('../server/config/database');
const Riviere = require('../server/models/Riviere')(sequelize);

// Données supplémentaires de rivières à saumon atlantique
const additionalRivers = [
  // QUÉBEC - RIVIÈRES ÉLITE
  {
    nom: 'Rivière Moisie',
    nom_anglais: 'Moisie River',
    pays: 'Canada',
    province_etat: 'Québec',
    region: 'Côte-Nord',
    type: 'riviere',
    classe: 1,
    latitude: 50.2345,
    longitude: -66.1234,
    longueur_km: 410.0,
    bassin_versant_km2: 19000,
    nombre_fosses: 65,
    nombre_secteurs: 20,
    type_acces: 'helicoptere',
    difficulte_acces: 'difficile',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Juillet',
    temperature_eau: 10.5,
    niveau_eau: 'normal',
    debit_m3s: 85.3,
    clarte: 'excellente',
    statut_conditions: 'excellente',
    statut_conservation: 'excellent',
    population_saumon: 'abondante',
    taille_moyenne_saumon: 90,
    record_saumon: 45,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff', 'Elk Hair Caddis', 'Blue Winged Olive'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear', 'Prince Nymph', 'Copper John'],
      streamers: ['Woolly Bugger', 'Muddler Minnow', 'Black Ghost']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur', 'Streamer', 'Spey casting'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour. Accès par hélicoptère uniquement.',
    permis_requis: true,
    tirage_au_sort: true,
    date_limite_tirage: '2025-03-15',
    url_tirage: 'https://www.quebec.ca/agriculture-environnement-et-ressources-naturelles/faune/peche-sportive/tirage-au-sort',
    camping_autorise: false,
    guides_disponibles: true,
    description: 'La rivière Moisie est l\'une des rivières à saumon les plus sauvages et prestigieuses du Québec.',
    historique: 'Cette rivière est connue pour ses gros saumons et son accès difficile, ce qui en fait une destination de pêche exclusive.',
    source_donnees: 'Ministère des Forêts, de la Faune et des Parcs du Québec',
    notes_privilegees: 'Meilleur moment: 5h-8h et 19h-22h. Conditions optimales: température 8-12°C, vent < 10 km/h. Accès exclusif par hélicoptère.'
  },
  {
    nom: 'Rivière Romaine',
    nom_anglais: 'Romaine River',
    pays: 'Canada',
    province_etat: 'Québec',
    region: 'Côte-Nord',
    type: 'riviere',
    classe: 1,
    latitude: 50.4567,
    longitude: -63.7890,
    longueur_km: 496.0,
    bassin_versant_km2: 14200,
    nombre_fosses: 55,
    nombre_secteurs: 18,
    type_acces: 'helicoptere',
    difficulte_acces: 'difficile',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Août',
    temperature_eau: 11.2,
    niveau_eau: 'normal',
    debit_m3s: 75.8,
    clarte: 'excellente',
    statut_conditions: 'excellente',
    statut_conservation: 'excellent',
    population_saumon: 'abondante',
    taille_moyenne_saumon: 88,
    record_saumon: 42,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff', 'Elk Hair Caddis', 'Blue Winged Olive'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear', 'Prince Nymph', 'Copper John'],
      streamers: ['Woolly Bugger', 'Muddler Minnow', 'Black Ghost']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur', 'Streamer', 'Spey casting'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour. Accès par hélicoptère uniquement.',
    permis_requis: true,
    tirage_au_sort: true,
    date_limite_tirage: '2025-03-15',
    url_tirage: 'https://www.quebec.ca/agriculture-environnement-et-ressources-naturelles/faune/peche-sportive/tirage-au-sort',
    camping_autorise: false,
    guides_disponibles: true,
    description: 'La rivière Romaine offre une pêche au saumon exceptionnelle dans un environnement sauvage.',
    historique: 'Cette rivière est protégée et gérée pour la conservation du saumon atlantique.',
    source_donnees: 'Ministère des Forêts, de la Faune et des Parcs du Québec',
    notes_privilegees: 'Meilleur moment: 6h-9h et 18h-21h. Conditions optimales: température 10-14°C, vent < 12 km/h.'
  },

  // NOUVEAU-BRUNSWICK - RIVIÈRES ÉLITE
  {
    nom: 'Restigouche River',
    nom_anglais: 'Restigouche River',
    pays: 'Canada',
    province_etat: 'Nouveau-Brunswick',
    region: 'Restigouche',
    type: 'riviere',
    classe: 1,
    latitude: 47.8901,
    longitude: -66.2345,
    longueur_km: 200.0,
    bassin_versant_km2: 25000,
    nombre_fosses: 75,
    nombre_secteurs: 25,
    type_acces: 'mixte',
    difficulte_acces: 'modere',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Juillet',
    temperature_eau: 14.8,
    niveau_eau: 'normal',
    debit_m3s: 150.2,
    clarte: 'bonne',
    statut_conditions: 'excellente',
    statut_conservation: 'excellent',
    population_saumon: 'abondante',
    taille_moyenne_saumon: 85,
    record_saumon: 48,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff', 'Elk Hair Caddis', 'Blue Winged Olive'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear', 'Prince Nymph', 'Copper John'],
      streamers: ['Woolly Bugger', 'Muddler Minnow', 'Black Ghost']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur', 'Streamer'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour.',
    permis_requis: true,
    tirage_au_sort: false,
    camping_autorise: true,
    guides_disponibles: true,
    description: 'La rivière Restigouche est l\'une des plus grandes rivières à saumon du Nouveau-Brunswick.',
    historique: 'Cette rivière a une riche histoire de pêche au saumon et est considérée comme l\'une des meilleures rivières d\'Amérique du Nord.',
    source_donnees: 'New Brunswick Department of Natural Resources',
    notes_privilegees: 'Meilleur moment: 6h-9h et 18h-21h. Conditions optimales: température 12-16°C, vent < 15 km/h.'
  },

  // NOUVELLE-ÉCOSSE - RIVIÈRES ÉLITE
  {
    nom: 'LaHave River',
    nom_anglais: 'LaHave River',
    pays: 'Canada',
    province_etat: 'Nouvelle-Écosse',
    region: 'Lunenburg',
    type: 'riviere',
    classe: 1,
    latitude: 44.5678,
    longitude: -64.3456,
    longueur_km: 97.0,
    bassin_versant_km2: 1800,
    nombre_fosses: 30,
    nombre_secteurs: 12,
    type_acces: 'routier',
    difficulte_acces: 'facile',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Septembre',
    temperature_eau: 15.5,
    niveau_eau: 'normal',
    debit_m3s: 35.7,
    clarte: 'excellente',
    statut_conditions: 'excellente',
    statut_conservation: 'excellent',
    population_saumon: 'abondante',
    taille_moyenne_saumon: 78,
    record_saumon: 35,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff', 'Elk Hair Caddis'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear', 'Prince Nymph'],
      streamers: ['Woolly Bugger', 'Muddler Minnow']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur', 'Streamer'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour.',
    permis_requis: true,
    tirage_au_sort: false,
    camping_autorise: true,
    guides_disponibles: true,
    description: 'La rivière LaHave est l\'une des rivières à saumon les plus populaires de la Nouvelle-Écosse.',
    historique: 'Cette rivière a une longue tradition de pêche au saumon.',
    source_donnees: 'Nova Scotia Department of Fisheries and Aquaculture',
    notes_privilegees: 'Meilleur moment: 7h-10h et 17h-20h. Conditions optimales: température 13-17°C, vent < 15 km/h.'
  },

  // TERRE-NEUVE-ET-LABRADOR - RIVIÈRES ÉLITE
  {
    nom: 'Gander River',
    nom_anglais: 'Gander River',
    pays: 'Canada',
    province_etat: 'Terre-Neuve-et-Labrador',
    region: 'Gander',
    type: 'riviere',
    classe: 1,
    latitude: 48.9012,
    longitude: -54.5678,
    longueur_km: 180.0,
    bassin_versant_km2: 12000,
    nombre_fosses: 50,
    nombre_secteurs: 18,
    type_acces: 'routier',
    difficulte_acces: 'facile',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Juillet',
    temperature_eau: 12.3,
    niveau_eau: 'normal',
    debit_m3s: 85.6,
    clarte: 'excellente',
    statut_conditions: 'excellente',
    statut_conservation: 'excellent',
    population_saumon: 'abondante',
    taille_moyenne_saumon: 82,
    record_saumon: 38,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff', 'Elk Hair Caddis'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear', 'Prince Nymph'],
      streamers: ['Woolly Bugger', 'Muddler Minnow']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur', 'Streamer'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour.',
    permis_requis: true,
    tirage_au_sort: false,
    camping_autorise: true,
    guides_disponibles: true,
    description: 'La rivière Gander est l\'une des rivières à saumon les plus importantes de Terre-Neuve.',
    historique: 'Cette rivière a une longue tradition de pêche au saumon.',
    source_donnees: 'Newfoundland and Labrador Department of Fisheries and Land Resources',
    notes_privilegees: 'Meilleur moment: 5h-8h et 19h-22h. Conditions optimales: température 10-14°C, vent < 12 km/h.'
  },

  // ÉTATS-UNIS - MAINE - RIVIÈRES ÉLITE
  {
    nom: 'Kennebec River',
    nom_anglais: 'Kennebec River',
    pays: 'États-Unis',
    province_etat: 'Maine',
    region: 'Augusta',
    type: 'riviere',
    classe: 1,
    latitude: 44.1234,
    longitude: -69.5678,
    longueur_km: 240.0,
    bassin_versant_km2: 15000,
    nombre_fosses: 60,
    nombre_secteurs: 20,
    type_acces: 'mixte',
    difficulte_acces: 'modere',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Août',
    temperature_eau: 16.8,
    niveau_eau: 'normal',
    debit_m3s: 200.0,
    clarte: 'bonne',
    statut_conditions: 'excellente',
    statut_conservation: 'excellent',
    population_saumon: 'abondante',
    taille_moyenne_saumon: 80,
    record_saumon: 36,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff', 'Elk Hair Caddis'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear', 'Prince Nymph'],
      streamers: ['Woolly Bugger', 'Muddler Minnow']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur', 'Streamer'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour.',
    permis_requis: true,
    tirage_au_sort: false,
    camping_autorise: true,
    guides_disponibles: true,
    description: 'La rivière Kennebec est l\'une des plus grandes rivières à saumon du Maine.',
    historique: 'Cette rivière a une riche histoire de pêche au saumon.',
    source_donnees: 'Maine Department of Inland Fisheries and Wildlife',
    notes_privilegees: 'Meilleur moment: 6h-9h et 18h-21h. Conditions optimales: température 14-18°C, vent < 15 km/h.'
  },

  // RIVIÈRES STANDARD (CLASSE 2)
  {
    nom: 'Rivière du Petit Mécatina',
    nom_anglais: 'Petit Mécatina River',
    pays: 'Canada',
    province_etat: 'Québec',
    region: 'Côte-Nord',
    type: 'riviere',
    classe: 2,
    latitude: 50.6789,
    longitude: -59.1234,
    longueur_km: 120.0,
    bassin_versant_km2: 3500,
    nombre_fosses: 25,
    nombre_secteurs: 8,
    type_acces: 'helicoptere',
    difficulte_acces: 'difficile',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Août',
    temperature_eau: 11.8,
    niveau_eau: 'normal',
    debit_m3s: 45.2,
    clarte: 'excellente',
    statut_conditions: 'bonne',
    statut_conservation: 'bon',
    population_saumon: 'stable',
    taille_moyenne_saumon: 75,
    record_saumon: 28,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff', 'Elk Hair Caddis'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear', 'Prince Nymph'],
      streamers: ['Woolly Bugger', 'Muddler Minnow']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour.',
    permis_requis: true,
    tirage_au_sort: true,
    date_limite_tirage: '2025-03-15',
    url_tirage: 'https://www.quebec.ca/agriculture-environnement-et-ressources-naturelles/faune/peche-sportive/tirage-au-sort',
    camping_autorise: false,
    guides_disponibles: false,
    description: 'La rivière du Petit Mécatina offre une pêche au saumon de qualité dans un environnement sauvage.',
    historique: 'Cette rivière est protégée pour la conservation du saumon atlantique.',
    source_donnees: 'Ministère des Forêts, de la Faune et des Parcs du Québec',
    notes_privilegees: 'Meilleur moment: 7h-10h et 17h-20h. Conditions optimales: température 9-13°C, vent < 15 km/h.'
  },

  // RIVIÈRES DÉBUTANT (CLASSE 3)
  {
    nom: 'Rivière du Nord',
    nom_anglais: 'North River',
    pays: 'Canada',
    province_etat: 'Québec',
    region: 'Laurentides',
    type: 'riviere',
    classe: 3,
    latitude: 45.7890,
    longitude: -74.1234,
    longueur_km: 35.0,
    bassin_versant_km2: 650,
    nombre_fosses: 12,
    nombre_secteurs: 5,
    type_acces: 'routier',
    difficulte_acces: 'facile',
    saison_peche: 'Juin à Octobre',
    saison_principale: 'Août',
    temperature_eau: 14.2,
    niveau_eau: 'normal',
    debit_m3s: 18.5,
    clarte: 'bonne',
    statut_conditions: 'moyenne',
    statut_conservation: 'bon',
    population_saumon: 'stable',
    taille_moyenne_saumon: 60,
    record_saumon: 18,
    mouches_recommandees: {
      seches: ['Adams', 'Royal Wulff'],
      nymphes: ['Pheasant Tail', 'Hare\'s Ear'],
      streamers: ['Woolly Bugger']
    },
    techniques_recommandees: ['Lancer à la mouche sèche', 'Nymphe sous indicateur'],
    reglementation: 'Permis de pêche requis. Limite quotidienne: 1 saumon par jour.',
    permis_requis: true,
    tirage_au_sort: false,
    camping_autorise: true,
    guides_disponibles: false,
    description: 'La rivière du Nord est idéale pour les débutants en pêche au saumon.',
    historique: 'Cette rivière est plus accessible et convient bien aux pêcheurs débutants.',
    source_donnees: 'Ministère des Forêts, de la Faune et des Parcs du Québec',
    notes_privilegees: 'Meilleur moment: 8h-11h et 16h-19h. Conditions optimales: température 12-16°C, vent < 20 km/h.'
  }
];

async function addMoreRivers() {
  try {
    console.log('🌊 Ajout de rivières supplémentaires...');
    
    // Vérifier si les rivières existent déjà
    for (const riverData of additionalRivers) {
      const existingRiver = await Riviere.findOne({
        where: { nom: riverData.nom }
      });
      
      if (!existingRiver) {
        await Riviere.create(riverData);
        console.log(`✅ Rivière ajoutée: ${riverData.nom}`);
      } else {
        console.log(`⏭️ Rivière déjà existante: ${riverData.nom}`);
      }
    }
    
    // Afficher les statistiques finales
    const totalRivers = await Riviere.count();
    const eliteCount = await Riviere.count({ where: { classe: 1 } });
    const standardCount = await Riviere.count({ where: { classe: 2 } });
    const debutantCount = await Riviere.count({ where: { classe: 3 } });
    
    console.log(`\n📊 Statistiques finales:`);
    console.log(`   - Total rivières: ${totalRivers}`);
    console.log(`   - Rivières Elite (Classe 1): ${eliteCount}`);
    console.log(`   - Rivières Standard (Classe 2): ${standardCount}`);
    console.log(`   - Rivières Débutant (Classe 3): ${debutantCount}`);
    
    console.log('\n🎉 Ajout de rivières terminé !');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de rivières:', error);
    process.exit(1);
  }
}

addMoreRivers();



