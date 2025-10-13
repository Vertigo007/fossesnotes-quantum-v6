#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'fossesnotes.sqlite');
const MIGRATION_PATH = path.join(__dirname, '..', 'migrations', '20250817_bigdata_consent_sqlite.sql');

async function applyMigration() {
  console.log('🔄 Application de la migration Big Data & Consentement...');
  
  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');
    
    // Open database
    const db = new sqlite3.Database(DB_PATH);
    
    // Execute migration
    await new Promise((resolve, reject) => {
      db.exec(migrationSQL, (err) => {
        if (err) {
          console.error('❌ Erreur migration:', err);
          reject(err);
        } else {
          console.log('✅ Migration Big Data appliquée avec succès');
          resolve();
        }
      });
    });
    
    // Verify tables were created
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('consent_history', 'dw_fact_catches')", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📊 Tables créées:', tables.map(t => t.name));
    
    // Close database
    db.close();
    
    console.log('🎯 Migration Big Data terminée');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  applyMigration();
}

module.exports = { applyMigration };



