-- Add language column to lists for Bibliothèque filter (one language at a time)
ALTER TABLE `lists` ADD COLUMN `language` text;
