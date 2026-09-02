-- Lien filleul → parrain (code saisi à l'inscription)
ALTER TABLE users ADD COLUMN referred_by_user_id TEXT REFERENCES users(id);
