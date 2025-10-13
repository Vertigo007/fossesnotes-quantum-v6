#!/usr/bin/env node
/**
 * Applique la migration communautaire
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../database/fossesnotes.sqlite');
const MIGRATION_PATH = path.join(__dirname, '../migrations/20250817_community_sqlite.sql');

async function applyMigration() {
  console.log('🚀 Application de la migration communautaire...');
  
  // Vérifier que la base de données existe
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Base de données non trouvée:', DB_PATH);
    console.log('💡 Créez d\'abord la base de données avec: npm run init-db');
    process.exit(1);
  }
  
  // Vérifier que le fichier de migration existe
  if (!fs.existsSync(MIGRATION_PATH)) {
    console.error('❌ Fichier de migration non trouvé:', MIGRATION_PATH);
    process.exit(1);
  }
  
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    // Lire le fichier de migration
    const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');
    
    console.log('📝 Application des tables communautaires...');
    
    // Exécuter la migration
    await new Promise((resolve, reject) => {
      db.exec(migrationSQL, (err) => {
        if (err) {
          console.error('❌ Erreur migration:', err.message);
          reject(err);
        } else {
          console.log('✅ Migration appliquée avec succès!');
          resolve();
        }
      });
    });
    
    // Vérifier que les tables ont été créées
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%community%' OR name LIKE '%events%' OR name LIKE '%classroom%' OR name LIKE '%gamification%'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📊 Tables créées:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Exécution
if (require.main === module) {
  applyMigration();
}

module.exports = { applyMigration };



