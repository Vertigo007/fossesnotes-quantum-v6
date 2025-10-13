-- Migration Communauté - SQLite version
-- Tables pour le système communautaire FossesNotes

-- Posts communautaires
CREATE TABLE IF NOT EXISTS community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title_fr TEXT,
  title_en TEXT,
  body_fr TEXT,
  body_en TEXT,
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public' | 'pro' | 'elite'
  status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'archived'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS posts_author_idx ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON community_posts(visibility);
CREATE INDEX IF NOT EXISTS posts_status_idx ON community_posts(status);
CREATE INDEX IF NOT EXISTS posts_created_idx ON community_posts(created_at);

-- Réactions aux posts
CREATE TABLE IF NOT EXISTS community_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like' | 'helpful' | 'insightful'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS reactions_post_idx ON community_reactions(post_id);
CREATE INDEX IF NOT EXISTS reactions_user_idx ON community_reactions(user_id);
CREATE INDEX IF NOT EXISTS reactions_type_idx ON community_reactions(type);

-- Événements
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  river_slug TEXT REFERENCES rivieres(slug),
  location_text TEXT,
  lat REAL,
  lon REAL,
  host_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public' | 'pro' | 'elite'
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'cancelled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS events_slug_idx ON events(slug);
CREATE INDEX IF NOT EXISTS events_host_idx ON events(host_id);
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);
CREATE INDEX IF NOT EXISTS events_start_idx ON events(start_at);

-- RSVP pour les événements
CREATE TABLE IF NOT EXISTS events_rsvp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'going' | 'waitlist' | 'declined'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS rsvp_event_idx ON events_rsvp(event_id);
CREATE INDEX IF NOT EXISTS rsvp_user_idx ON events_rsvp(user_id);
CREATE INDEX IF NOT EXISTS rsvp_status_idx ON events_rsvp(status);

-- Cours et formations
CREATE TABLE IF NOT EXISTS classroom_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public' | 'pro' | 'elite'
  status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'archived'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS courses_slug_idx ON classroom_courses(slug);
CREATE INDEX IF NOT EXISTS courses_visibility_idx ON classroom_courses(visibility);
CREATE INDEX IF NOT EXISTS courses_status_idx ON classroom_courses(status);

-- Leçons des cours
CREATE TABLE IF NOT EXISTS classroom_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER REFERENCES classroom_courses(id) ON DELETE CASCADE,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_fr TEXT,
  content_en TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'archived'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS lessons_course_idx ON classroom_lessons(course_id);
CREATE INDEX IF NOT EXISTS lessons_order_idx ON classroom_lessons(order_index);
CREATE INDEX IF NOT EXISTS lessons_status_idx ON classroom_lessons(status);

-- Système de gamification
CREATE TABLE IF NOT EXISTS gamification_points_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'post.create' | 'comment.create' | 'reaction.received' | etc.
  delta INTEGER NOT NULL, -- points gagnés/perdus
  metadata TEXT, -- JSON string pour données supplémentaires
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ledger_user_idx ON gamification_points_ledger(user_id);
CREATE INDEX IF NOT EXISTS ledger_action_idx ON gamification_points_ledger(action);
CREATE INDEX IF NOT EXISTS ledger_created_idx ON gamification_points_ledger(created_at);

-- Badges et niveaux
CREATE TABLE IF NOT EXISTS gamification_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  icon TEXT, -- nom de l'icône
  points_required INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS badges_slug_idx ON gamification_badges(slug);
CREATE INDEX IF NOT EXISTS badges_points_idx ON gamification_badges(points_required);

-- Badges attribués aux utilisateurs
CREATE TABLE IF NOT EXISTS gamification_user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES gamification_badges(id) ON DELETE CASCADE,
  awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx ON gamification_user_badges(user_id);
CREATE INDEX IF NOT EXISTS user_badges_badge_idx ON gamification_user_badges(badge_id);

-- Mise à jour de la table users pour les points
ALTER TABLE users ADD COLUMN points_total INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN points_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN last_login_streak DATE;

CREATE INDEX IF NOT EXISTS users_points_idx ON users(points_total);
CREATE INDEX IF NOT EXISTS users_level_idx ON users(points_level);



