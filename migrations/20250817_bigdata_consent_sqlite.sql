-- Migration Big Data & Consent - SQLite version
-- Système de collecte opt-in et anonymisation des données de pêche

-- === Consentement utilisateur ===
ALTER TABLE users ADD COLUMN consent_share INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN consent_version TEXT;
ALTER TABLE users ADD COLUMN consent_updated_at TEXT;

-- === Historique des consentements ===
CREATE TABLE IF NOT EXISTS consent_history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  consent_share INTEGER,
  consent_version TEXT,
  ip TEXT,
  ua TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- === Data warehouse (anonymisé) ===
CREATE TABLE IF NOT EXISTS dw_fact_catches(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  river_slug TEXT,
  pool_bucket TEXT,          -- pool flouté/jitter 300–1000 m → code bucket
  date_utc TEXT,
  hour_bucket INTEGER,       -- 0..23
  species TEXT,
  method TEXT,
  fly_name_norm TEXT,
  length_cm REAL,
  weight_kg REAL,
  cpue_unit INTEGER,         -- 1 par prise (somme utile pour CPUE)
  weather_json TEXT,         -- JSON string pour SQLite
  hydro_json TEXT,           -- JSON string pour SQLite
  hatches_json TEXT,         -- JSON string pour SQLite
  user_hash TEXT,            -- hash(user_id + salt)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_dw_by_river_date ON dw_fact_catches(river_slug, date_utc);
CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dw_species_method ON dw_fact_catches(species, method);
CREATE INDEX IF NOT EXISTS idx_dw_date_hour ON dw_fact_catches(date_utc, hour_bucket);



