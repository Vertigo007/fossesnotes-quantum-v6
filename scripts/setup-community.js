#!/usr/bin/env node
/**
 * Setup complet du système communautaire
 */

const { applyMigration } = require('./apply-community-migration');
const { seedBadges, seedCourses, seedSampleEvents } = require('../server/scripts/seedGamification');

async function setupCommunity() {
  console.log('🎯 Setup complet du système communautaire FossesNotes');
  console.log('=' .repeat(50));
  
  try {
    // 1. Appliquer la migration
    console.log('\n📝 Étape 1: Application de la migration...');
    await applyMigration();
    
    // 2. Seeder les données
    console.log('\n🌱 Étape 2: Seeding des données...');
    await seedBadges();
    await seedCourses();
    await seedSampleEvents();
    
    console.log('\n🎉 Setup communautaire terminé avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('  1. Redémarrer le serveur: npm run dev');
    console.log('  2. Tester les fonctionnalités: npm run test:e2e:community');
    console.log('  3. Visiter: http://localhost:3000/community');
    console.log('  4. Visiter: http://localhost:3000/events');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du setup:', error);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  setupCommunity();
}

module.exports = { setupCommunity };



