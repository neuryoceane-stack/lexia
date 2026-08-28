-- Alignement table users sur src/lib/db/schema.ts
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';
--> statement-breakpoint
ALTER TABLE users ADD COLUMN subject TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN school_name TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN weekly_goal INTEGER DEFAULT 20;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
--> statement-breakpoint
ALTER TABLE user_profiles ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE user_profiles ADD COLUMN acquisition_source TEXT;
--> statement-breakpoint
ALTER TABLE user_profiles ADD COLUMN streak_goal INTEGER;
--> statement-breakpoint
ALTER TABLE user_profiles ADD COLUMN institution_code TEXT;
