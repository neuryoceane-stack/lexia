-- À coller dans: turso db shell lexia
-- Ordre respectant les clés étrangères

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text,
  name text,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS word_families (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS lists (
  id text PRIMARY KEY NOT NULL,
  family_id text NOT NULL REFERENCES word_families(id) ON DELETE CASCADE,
  name text NOT NULL,
  source text DEFAULT 'manual' NOT NULL,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS words (
  id text PRIMARY KEY NOT NULL,
  list_id text NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  term text NOT NULL,
  definition text NOT NULL,
  rank integer DEFAULT 0 NOT NULL,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS revisions (
  id text PRIMARY KEY NOT NULL,
  word_id text NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  success integer NOT NULL,
  next_review_at integer NOT NULL,
  created_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS garden_progress (
  user_id text PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp integer DEFAULT 0 NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  unlocked_zones text DEFAULT '[]',
  plants_count integer DEFAULT 0 NOT NULL,
  updated_at integer NOT NULL
);

CREATE TABLE IF NOT EXISTS revision_sessions (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode text NOT NULL,
  direction text NOT NULL,
  started_at integer NOT NULL,
  ended_at integer NOT NULL,
  duration_seconds integer NOT NULL,
  words_seen integer DEFAULT 0 NOT NULL,
  words_retained integer DEFAULT 0 NOT NULL,
  words_written integer DEFAULT 0 NOT NULL,
  created_at integer NOT NULL
);

ALTER TABLE lists ADD COLUMN language text;

ALTER TABLE revision_sessions ADD COLUMN language text;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id text PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_type text NOT NULL DEFAULT 'arbre',
  preferred_language text,
  preferred_language_2 text,
  preferred_languages text,
  updated_at integer NOT NULL
);
