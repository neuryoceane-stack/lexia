-- Migration : ajouter la colonne preferred_language à user_preferences
-- À exécuter si la table a été créée avant l’ajout de cette colonne.
-- Ex. Turso : turso db shell <NOM_DB> < 001_add_preferred_language.sql

ALTER TABLE user_preferences ADD COLUMN preferred_language text;
