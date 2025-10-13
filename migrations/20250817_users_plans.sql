-- Users + Plans (SQLite version - idempotent)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'elite'
  lang TEXT DEFAULT 'fr',            -- 'fr' | 'en'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS users_plan_idx ON users(plan);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'paypal',
  plan TEXT NOT NULL,                -- 'pro' | 'elite'
  status TEXT NOT NULL,              -- 'active' | 'canceled' | 'pending'
  paypal_order_id TEXT,
  paypal_subscription_id TEXT,
  currency TEXT DEFAULT 'CAD',
  amount_cents INTEGER,
  raw_payload TEXT,                  -- JSON string for SQLite
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS subs_user_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subs_plan_idx ON subscriptions(plan);



