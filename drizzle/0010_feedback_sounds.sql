-- Préférence sons de feedback (évaluation)
ALTER TABLE user_preferences ADD COLUMN feedback_sounds_enabled INTEGER NOT NULL DEFAULT 1;
