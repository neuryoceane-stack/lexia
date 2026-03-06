-- SM-2 columns for revisions table
ALTER TABLE `revisions` ADD COLUMN `ease_factor` real DEFAULT 2.5;
ALTER TABLE `revisions` ADD COLUMN `interval` integer DEFAULT 1;
ALTER TABLE `revisions` ADD COLUMN `repetitions` integer DEFAULT 0;
ALTER TABLE `revisions` ADD COLUMN `rating` integer;
