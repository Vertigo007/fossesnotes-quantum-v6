#!/usr/bin/env node
/**
 * Seed Gamification System
 * Crée les badges et niveaux de base pour la gamification
 */

const { db } = require('../utils/db');

const badges = [
  {
    slug: 'first-post',
    name_fr: 'Premier Post',
    name_en: 'First Post',
    description_fr: 'A publié son premier post dans la communauté',
    description_en: 'Published their first post in the community',
    icon: '📝',
    points_required: 5
  },
  {
    slug: 'helpful-member',
    name_fr: 'Membre Utile',
    name_en: 'Helpful Member',
    description_fr: 'A reçu 10 réactions "Utile"',
    description_en: 'Received 10 "Helpful" reactions',
    icon: '👍',
    points_required: 50
  },
  {
    slug: 'insightful-thinker',
    name_fr: 'Penseur Perspicace',
    name_en: 'Insightful Thinker',
    description_fr: 'A reçu 5 réactions "Pertinent"',
    description_en: 'Received 5 "Insightful" reactions',
    icon: '💡',
    points_required: 100
  },
  {
    slug: 'event-organizer',
    name_fr: 'Organisateur d\'Événements',
    name_en: 'Event Organizer',
    description_fr: 'A organisé un événement communautaire',
    description_en: 'Organized a community event',
    icon: '🎣',
    points_required: 200
  },
  {
    slug: 'course-completer',
    name_fr: 'Formation Complétée',
    name_en: 'Course Completer',
    description_fr: 'A complété un cours de formation',
    description_en: 'Completed a training course',
    icon: '🎓',
    points_required: 150
  },
  {
    slug: 'streak-master',
    name_fr: 'Maître de la Régularité',
    name_en: 'Streak Master',
    description_fr: 'S\'est connecté 7 jours de suite',
    description_en: 'Logged in 7 days in a row',
    icon: '🔥',
    points_required: 75
  },
  {
    slug: 'river-explorer',
    name_fr: 'Explorateur de Rivières',
    name_en: 'River Explorer',
    description_fr: 'A visité 10 rivières différentes',
    description_en: 'Visited 10 different rivers',
    icon: '🏞️',
    points_required: 300
  },
  {
    slug: 'elite-member',
    name_fr: 'Membre Elite',
    name_en: 'Elite Member',
    description_fr: 'Membre du plan Elite',
    description_en: 'Elite plan member',
    icon: '👑',
    points_required: 500
  }
];

const courses = [
  {
    slug: 'pêche-mouche-débutant',
    title_fr: 'Pêche à la Mouche - Niveau Débutant',
    title_en: 'Fly Fishing - Beginner Level',
    description_fr: 'Apprenez les bases de la pêche à la mouche',
    description_en: 'Learn the basics of fly fishing',
    visibility: 'public'
  },
  {
    slug: 'techniques-avancées',
    title_fr: 'Techniques Avancées',
    title_en: 'Advanced Techniques',
    description_fr: 'Techniques avancées pour pêcheurs expérimentés',
    description_en: 'Advanced techniques for experienced anglers',
    visibility: 'pro'
  },
  {
    slug: 'sélection-mouches',
    title_fr: 'Sélection et Montage de Mouches',
    title_en: 'Fly Selection and Tying',
    description_fr: 'Comment choisir et monter vos mouches',
    description_en: 'How to select and tie your flies',
    visibility: 'elite'
  }
];

const lessons = [
  {
    course_slug: 'pêche-mouche-débutant',
    title_fr: 'Introduction à la Pêche à la Mouche',
    title_en: 'Introduction to Fly Fishing',
    content_fr: 'Découvrez l\'histoire et les principes de la pêche à la mouche.',
    content_en: 'Discover the history and principles of fly fishing.',
    order_index: 1
  },
  {
    course_slug: 'pêche-mouche-débutant',
    title_fr: 'Équipement de Base',
    title_en: 'Basic Equipment',
    content_fr: 'Les cannes, moulinets et accessoires essentiels.',
    content_en: 'Essential rods, reels and accessories.',
    order_index: 2
  },
  {
    course_slug: 'techniques-avancées',
    title_fr: 'Lancers Spécialisés',
    title_en: 'Specialized Casting',
    content_fr: 'Techniques de lancer pour situations difficiles.',
    content_en: 'Casting techniques for difficult situations.',
    order_index: 1
  }
];

async function seedBadges() {
  console.log('🎖️  Création des badges...');
  
  for (const badge of badges) {
    try {
      await db.none(`
        INSERT OR IGNORE INTO gamification_badges 
        (slug, name_fr, name_en, description_fr, description_en, icon, points_required)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [badge.slug, badge.name_fr, badge.name_en, badge.description_fr, badge.description_en, badge.icon, badge.points_required]);
      
      console.log(`✅ Badge créé: ${badge.name_fr}`);
    } catch (error) {
      console.error(`❌ Erreur badge ${badge.slug}:`, error.message);
    }
  }
}

async function seedCourses() {
  console.log('📚 Création des cours...');
  
  for (const course of courses) {
    try {
      const result = await db.one(`
        INSERT OR IGNORE INTO classroom_courses 
        (slug, title_fr, title_en, description_fr, description_en, visibility)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id
      `, [course.slug, course.title_fr, course.title_en, course.description_fr, course.description_en, course.visibility]);
      
      console.log(`✅ Cours créé: ${course.title_fr}`);
      
      // Ajouter les leçons pour ce cours
      const courseLessons = lessons.filter(l => l.course_slug === course.slug);
      for (const lesson of courseLessons) {
        await db.none(`
          INSERT OR IGNORE INTO classroom_lessons 
          (course_id, title_fr, title_en, content_fr, content_en, order_index)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [result.id, lesson.title_fr, lesson.title_en, lesson.content_fr, lesson.content_en, lesson.order_index]);
        
        console.log(`  📖 Leçon ajoutée: ${lesson.title_fr}`);
      }
    } catch (error) {
      console.error(`❌ Erreur cours ${course.slug}:`, error.message);
    }
  }
}

async function seedSampleEvents() {
  console.log('🎣 Création d\'événements d\'exemple...');
  
  const sampleEvents = [
    {
      slug: 'sortie-matapedia-2024',
      title_fr: 'Sortie Pêche - Rivière Matapédia',
      title_en: 'Fishing Trip - Matapedia River',
      description_fr: 'Sortie de pêche en groupe sur la rivière Matapédia. Niveau intermédiaire requis.',
      description_en: 'Group fishing trip on the Matapedia River. Intermediate level required.',
      start_at: '2024-06-15 08:00:00',
      end_at: '2024-06-15 18:00:00',
      river_slug: 'matapedia-river',
      location_text: 'Pont de la Rivière Matapédia, QC',
      lat: 48.0,
      lon: -67.2,
      visibility: 'pro',
      capacity: 12
    },
    {
      slug: 'formation-mouches-2024',
      title_fr: 'Formation Montage de Mouches',
      title_en: 'Fly Tying Workshop',
      description_fr: 'Atelier de montage de mouches pour débutants. Matériel fourni.',
      description_en: 'Fly tying workshop for beginners. Materials provided.',
      start_at: '2024-07-20 14:00:00',
      end_at: '2024-07-20 17:00:00',
      location_text: 'Centre de Pêche, Montréal',
      lat: 45.5017,
      lon: -73.5673,
      visibility: 'public',
      capacity: 20
    }
  ];
  
  for (const event of sampleEvents) {
    try {
      await db.none(`
        INSERT OR IGNORE INTO events 
        (slug, title_fr, title_en, description_fr, description_en, start_at, end_at, 
         river_slug, location_text, lat, lon, visibility, capacity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
      `, [event.slug, event.title_fr, event.title_en, event.description_fr, event.description_en,
          event.start_at, event.end_at, event.river_slug || null, event.location_text,
          event.lat, event.lon, event.visibility, event.capacity]);
      
      console.log(`✅ Événement créé: ${event.title_fr}`);
    } catch (error) {
      console.error(`❌ Erreur événement ${event.slug}:`, error.message);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Initialisation du système de gamification...');
    
    await seedBadges();
    await seedCourses();
    await seedSampleEvents();
    
    console.log('\n🎉 Système de gamification initialisé avec succès!');
    console.log(`📊 ${badges.length} badges créés`);
    console.log(`📚 ${courses.length} cours créés`);
    console.log(`🎣 Événements d'exemple créés`);
    
  } catch (error) {
    console.error('❌ Erreur initialisation gamification:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = { seedBadges, seedCourses, seedSampleEvents };



