-- Migration Journal de Pêche Intelligent - SQLite version
-- Système d'enrichissement automatique (météo, hydro, éclosions)

-- === Référentiel (si non déjà là) ===
CREATE TABLE IF NOT EXISTS rivers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  name_fr TEXT, name_en TEXT
);

CREATE TABLE IF NOT EXISTS pools(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  river_id INTEGER REFERENCES rivers(id) ON DELETE CASCADE,
  name_fr TEXT, name_en TEXT,
  geom TEXT -- JSON string pour SQLite
);

-- === Flies (mouches) ===
CREATE TABLE IF NOT EXISTS flies(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name_fr TEXT, name_en TEXT,
  pattern TEXT, -- texte libre (recette)
  tags TEXT -- JSON string pour SQLite
);

-- === Snapshots quotidiens par rivière (météo/hydro) ===
CREATE TABLE IF NOT EXISTS river_daily_snapshots(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  river_id INTEGER REFERENCES rivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,                 -- jour (UTC)
  weather_json TEXT,                  -- JSON string (résumé jour)
  hydro_json TEXT,                    -- JSON string (débit, hauteur, température eau)
  hatches_json TEXT,                  -- JSON string (prévisions/observations d'éclosions)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(river_id, date)
);

-- === Journal (sorties) & prises ===
CREATE TABLE IF NOT EXISTS fishing_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  privacy TEXT DEFAULT 'private' CHECK (privacy IN ('private','friends','community')),
  notes_fr TEXT, notes_en TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fishing_log_rivers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES fishing_logs(id) ON DELETE CASCADE,
  river_id INTEGER REFERENCES rivers(id) ON DELETE CASCADE,
  pool_id INTEGER REFERENCES pools(id) ON DELETE SET NULL, -- facultatif
  snapshot_date DATE,                 -- le jour qui sert d'enrichissement
  enrich_weather TEXT,                -- JSON string
  enrich_hydro TEXT,                  -- JSON string
  enrich_hatches TEXT                 -- JSON string
);

CREATE TABLE IF NOT EXISTS fishing_catches(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id INTEGER REFERENCES fishing_logs(id) ON DELETE CASCADE,
  river_id INTEGER REFERENCES rivers(id) ON DELETE SET NULL,
  pool_id INTEGER REFERENCES pools(id) ON DELETE SET NULL,
  caught_at DATETIME NOT NULL,
  species TEXT DEFAULT 'Atlantic Salmon',
  length_cm REAL,
  weight_kg REAL,
  method TEXT,              -- dry/wet/nymph/spey…
  fly_id INTEGER REFERENCES flies(id) ON DELETE SET NULL,
  fly_name TEXT,            -- si non répertoriée
  released BOOLEAN DEFAULT 1,
  photo_url TEXT,
  meta_json TEXT,           -- JSON string (profondeur, vitesse, tippet, etc.)
  enrich_weather TEXT,      -- JSON string
  enrich_hydro TEXT,        -- JSON string
  enrich_hatches TEXT,      -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_catches_caughtat ON fishing_catches(caught_at);
CREATE INDEX IF NOT EXISTS idx_logs_user_started ON fishing_logs(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_river_date ON river_daily_snapshots(river_id, date);
CREATE INDEX IF NOT EXISTS idx_log_rivers_log ON fishing_log_rivers(log_id);
CREATE INDEX IF NOT EXISTS idx_catches_log ON fishing_catches(log_id);

-- Triggers pour updated_at
CREATE TRIGGER IF NOT EXISTS update_fishing_logs_timestamp 
  AFTER UPDATE ON fishing_logs
  BEGIN
    UPDATE fishing_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;



