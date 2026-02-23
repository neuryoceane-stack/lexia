-- Rôle utilisateur (étudiant / professeur)
ALTER TABLE user_profiles ADD COLUMN role TEXT;

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identifier TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  language TEXT,
  created_at INTEGER NOT NULL
);

-- Membres de classe (salle d'attente)
CREATE TABLE IF NOT EXISTS class_members (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  joined_at INTEGER NOT NULL
);

-- Listes assignées à une classe (mode fantôme)
CREATE TABLE IF NOT EXISTS class_lists (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  is_visible INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  added_at INTEGER NOT NULL
);
