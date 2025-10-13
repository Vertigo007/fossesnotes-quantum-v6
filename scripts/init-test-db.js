const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données de test
const dbPath = path.join(__dirname, '../test-database.sqlite');

// Supprimer l'ancienne base de test si elle existe
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Ancienne base de test supprimée');
}

// Créer une nouvelle base de données
const db = new sqlite3.Database(dbPath);

// Script SQL pour créer les tables
const createTablesSQL = `
-- Table users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  plan VARCHAR(20) DEFAULT 'free',
  lang VARCHAR(5) DEFAULT 'fr',
  xp_total INTEGER DEFAULT 0,
  niveau INTEGER DEFAULT 1,
  expertise VARCHAR(50) DEFAULT 'Débutant',
  rivieres_visitees INTEGER DEFAULT 0,
  captures_total INTEGER DEFAULT 0,
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion DATETIME,
  statut VARCHAR(20) DEFAULT 'actif',
  consent_share BOOLEAN DEFAULT FALSE,
  consent_version TEXT,
  consent_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  paypal_order_id VARCHAR(255),
  paypal_payment_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'CAD',
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table consent_history
CREATE TABLE IF NOT EXISTS consent_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  consent_share BOOLEAN NOT NULL,
  consent_version TEXT,
  ip TEXT,
  ua TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table fishing_logs
CREATE TABLE IF NOT EXISTS fishing_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  riviere_id INTEGER,
  date_sortie DATE NOT NULL,
  heure_debut TIME,
  heure_fin TIME,
  temperature_air DECIMAL(4,1),
  temperature_eau DECIMAL(4,1),
  niveau_eau INTEGER,
  ph_eau DECIMAL(3,1),
  oxygene_mg_l DECIMAL(4,1),
  conditions_meteo VARCHAR(100),
  nombre_captures INTEGER DEFAULT 0,
  especes_capturees TEXT, -- JSON
  mouches_utilisees TEXT, -- JSON
  observations TEXT,
  photos_urls TEXT, -- JSON
  coordonnees_gps TEXT, -- JSON
  privacy VARCHAR(20) DEFAULT 'private',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table dw_fact_catches
CREATE TABLE IF NOT EXISTS dw_fact_catches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  river_slug TEXT,
  pool_bucket TEXT,
  date_utc DATE,
  hour_bucket INTEGER,
  species TEXT,
  method TEXT,
  fly_name_norm TEXT,
  length_cm DECIMAL,
  weight_kg DECIMAL,
  cpue_unit INTEGER,
  weather_json TEXT, -- JSON
  hydro_json TEXT, -- JSON
  hatches_json TEXT, -- JSON
  user_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insérer des données de test
INSERT INTO users (email, password_hash, nom, prenom, plan, lang) VALUES 
('test@example.com', '$2b$10$test.hash', 'Test', 'User', 'free', 'fr');

INSERT INTO users (email, password_hash, nom, prenom, plan, lang) VALUES 
('pro@example.com', '$2b$10$test.hash', 'Pro', 'User', 'pro', 'fr');

INSERT INTO users (email, password_hash, nom, prenom, plan, lang) VALUES 
('elite@example.com', '$2b$10$test.hash', 'Elite', 'User', 'elite', 'fr');
`;

// Exécuter le script
db.exec(createTablesSQL, (err) => {
  if (err) {
    console.error('❌ Erreur création tables:', err);
  } else {
    console.log('✅ Tables créées avec succès');
  }
  
  db.close((err) => {
    if (err) {
      console.error('❌ Erreur fermeture DB:', err);
    } else {
      console.log('🎉 Base de données de test initialisée !');
    }
  });
});