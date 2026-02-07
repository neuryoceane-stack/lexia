-- Langue optionnelle sur les sessions (filtre Synthèse par langue)
ALTER TABLE revision_sessions ADD COLUMN language text;

-- Préférences utilisateur (type d'avatar pour la Synthèse)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id text PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE cascade,
  avatar_type text NOT NULL DEFAULT 'arbre',
  updated_at integer NOT NULL,
  CHECK (avatar_type IN ('arbre', 'phenix', 'koala'))
);
