import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const wordFamilies = sqliteTable("word_families", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const lists = sqliteTable("lists", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => wordFamilies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  source: text("source", { enum: ["manual", "ocr", "pdf"] }).notNull().default("manual"),
  /** Code langue ISO 639-3 (ex. eng, fra) pour filtrer la bibliothèque par langue. */
  language: text("language"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const words = sqliteTable("words", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  rank: integer("rank").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  wordId: text("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  success: integer("success", { mode: "boolean" }).notNull(),
  nextReviewAt: integer("next_review_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Statistiques d'une session d'apprentissage (alimente la Synthèse). */
export const revisionSessions = sqliteTable("revision_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode", { enum: ["flashcard", "dictee"] }).notNull(),
  /** term_to_def = afficher term, répondre definition ; def_to_term = inverse */
  direction: text("direction", { enum: ["term_to_def", "def_to_term"] }).notNull(),
  /** Code langue ISO (ex. eng, fra) pour filtre Synthèse par langue. */
  language: text("language"),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp" }).notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  wordsSeen: integer("words_seen").notNull().default(0),
  wordsRetained: integer("words_retained").notNull().default(0),
  wordsWritten: integer("words_written").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const gardenProgress = sqliteTable("garden_progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  unlockedZones: text("unlocked_zones", { mode: "json" }).$type<string[]>().default([]),
  plantsCount: integer("plants_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Préférences utilisateur (avatar Synthèse, langue enrichie, etc.). */
export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Type d'avatar : arbre, phénix, koala. */
  avatarType: text("avatar_type", { enum: ["arbre", "phenix", "koala"] })
    .notNull()
    .default("arbre"),
  /** Langue que l'utilisateur souhaite enrichir (ISO 639-3). Null = pas encore choisi (onboarding Bibliothèque). */
  preferredLanguage: text("preferred_language"),
  /** Deuxième langue à enrichir (optionnel). Conservé pour rétrocompat. */
  preferredLanguage2: text("preferred_language_2"),
  /** Liste des langues à enrichir (JSON array de codes ISO 639-3). Prioritaire si présent. */
  preferredLanguages: text("preferred_languages"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type WordFamily = typeof wordFamilies.$inferSelect;
export type List = typeof lists.$inferSelect;
export type Word = typeof words.$inferSelect;
export type Revision = typeof revisions.$inferSelect;
export type RevisionSession = typeof revisionSessions.$inferSelect;
export type GardenProgress = typeof gardenProgress.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
