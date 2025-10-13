const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données (utiliser test-database.sqlite en mode test)
const dbPath = process.env.NODE_ENV === 'test' 
  ? path.join(__dirname, '../../test-database.sqlite')
  : path.join(__dirname, '../../fossesnotes.sqlite');

// Créer une connexion à la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur connexion DB:', err);
  } else {
    console.log('✅ Connecté à la base de données SQLite');
  }
});

// Fonction utilitaire pour exécuter des requêtes avec Promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ rows });
      }
    });
  });
};

// Fonction pour exécuter une requête unique (INSERT, UPDATE, DELETE)
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ 
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

// Fonction pour récupérer une seule ligne
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Alias pour compatibilité
const oneOrNone = get;

// Fonction pour insérer et retourner l'ID
const oneInsert = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        // Retourner l'objet avec l'ID créé
        resolve({
          id: this.lastID,
          ...params.reduce((obj, param, index) => {
            // Essayer de mapper les paramètres aux colonnes (approximation)
            const columns = sql.match(/INSERT INTO \w+ \((.*?)\)/i);
            if (columns && columns[1]) {
              const columnNames = columns[1].split(',').map(col => col.trim());
              if (columnNames[index]) {
                obj[columnNames[index]] = param;
              }
            }
            return obj;
          }, {})
        });
      }
    });
  });
};

module.exports = {
  db,
  query,
  run,
  get,
  oneOrNone,
  oneInsert
};