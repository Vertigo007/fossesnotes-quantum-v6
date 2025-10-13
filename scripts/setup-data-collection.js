#!/usr/bin/env node

const { applyMigration } = require('./apply-data-collection-migration');

async function setupDataCollection() {
  console.log('🚀 Configuration du système de collecte de données...');
  
  try {
    // 1. Apply database migration
    console.log('\n📊 Étape 1: Migration de base de données');
    await applyMigration();
    
    // 2. Verify environment variables
    console.log('\n🔧 Étape 2: Vérification des variables d\'environnement');
    const requiredEnvVars = ['DW_SALT'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️  Variables d\'environnement manquantes:', missingVars.join(', '));
      console.log('💡 Ajoutez DW_SALT=your-secret-salt à votre fichier .env');
    } else {
      console.log('✅ Variables d\'environnement configurées');
    }
    
    // 3. Create admin access log table if it doesn't exist
    console.log('\n📝 Étape 3: Configuration des logs d\'accès admin');
    const db = require('../server/utils/db');
    
    try {
      await db.none(`
        CREATE TABLE IF NOT EXISTS admin_access_log(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          endpoint TEXT,
          params TEXT,
          ip TEXT,
          ua TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Table admin_access_log créée');
    } catch (error) {
      console.log('ℹ️  Table admin_access_log existe déjà');
    }
    
    console.log('\n🎯 Configuration terminée!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Configurez DW_SALT dans votre .env');
    console.log('2. Planifiez le worker ETL: node server/workers/etl_anonymize.js');
    console.log('3. Testez les endpoints: /api/profile/me, /api/admin/reports/summary');
    console.log('4. Lancez les tests: npm run test:e2e:data-collection');
    
  } catch (error) {
    console.error('❌ Erreur configuration:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDataCollection();
}

module.exports = { setupDataCollection };



