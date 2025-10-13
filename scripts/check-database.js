const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'fossesnotes.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Vérification de la base de données...');
console.log(`📁 Base de données: ${dbPath}`);

// Vérifier si le fichier existe
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.log('❌ Base de données non trouvée');
  process.exit(1);
}

// Lister les tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('❌ Erreur:', err.message);
    db.close();
    return;
  }
  
  console.log('📋 Tables trouvées:');
  if (rows.length === 0) {
    console.log('   Aucune table');
  } else {
    rows.forEach(row => console.log(`   - ${row.name}`));
  }
  
  // Vérifier la table users spécifiquement
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.log('❌ Table users non trouvée ou erreur');
    } else {
      console.log(`✅ Table users: ${row.count} utilisateurs`);
    }
    
    // Vérifier la structure de la table users
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.log('❌ Impossible de lire la structure de users');
      } else {
        console.log('📊 Structure de la table users:');
        columns.forEach(col => {
          console.log(`   - ${col.name} (${col.type})`);
        });
      }
      
      db.close();
      console.log('✅ Vérification terminée');
    });
  });
});
