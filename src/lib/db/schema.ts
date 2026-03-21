import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  /** Rôle app : student | teacher | creator (accès dashboard creator) */
  role: text("role", { enum: ["student", "teacher", "creator"] })
    .notNull()
    .default("student"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  /** Matière enseignée (profil enseignant, optionnel). */
  subject: text("subject"),
  /** Nom de l'établissement (profil enseignant, optionnel). */
  schoolName: text("school_name"),
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
  /** SM-2 : facteur de facilité (défaut 2.5) */
  easeFactor: real("ease_factor").default(2.5),
  /** SM-2 : intervalle en jours (défaut 1) */
  interval: integer("interval").default(1),
  /** SM-2 : nombre de répétitions réussies consécutives (défaut 0) */
  repetitions: integer("repetitions").default(0),
  /** SM-2 : qualité 0=oublié, 1=difficile, 2=bien, 3=parfait (nullable) */
  rating: integer("rating"),
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

/** Profil utilisateur (informations personnelles). */
export const userProfiles = sqliteTable("user_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth"),
  city: text("city"),
  phone: text("phone"),
  status: text("status", {
    enum: ["etudiant", "salarie", "independant", "en_formation"],
  }),
  institutionName: text("institution_name"),
  /** Rôle : étudiant (par défaut) ou professeur. */
  role: text("role", { enum: ["etudiant", "professeur"] }),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Classes créées par les professeurs. */
export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Identifiant court unique pour rejoindre la classe (ex. ABC123). */
  identifier: text("identifier").notNull().unique(),
  title: text("title").notNull(),
  /** Code langue ISO 639-3 (ex. fra, eng). */
  language: text("language"),
  /** Niveau scolaire affiché à la création (ex. 6ème, Terminale). */
  schoolLevel: text("school_level"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Élèves dans une classe (salle d'attente : pending, acceptés : accepted). */
export const classMembers = sqliteTable("class_members", {
  id: text("id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["pending", "accepted", "rejected"],
  })
    .notNull()
    .default("pending"),
  joinedAt: integer("joined_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Listes de mots assignées à une classe (mode fantôme = non visibles pour les élèves). */
export const classLists = sqliteTable("class_lists", {
  id: text("id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  listId: text("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  /** false = fantôme (invisible pour élèves), true = visible. */
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  addedAt: integer("added_at", { mode: "timestamp" })
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
  /** Thème d'affichage : light (défaut) ou dark. */
  themePreference: text("theme_preference", { enum: ["light", "dark"] }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Notifications utilisateur. */
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  link: text("link"),
  /** ID du feedback lié (ex. pour feedback_resolved) */
  feedbackId: text("feedback_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Retours utilisateur (bugs, idées, questions). */
export const feedbacks = sqliteTable("feedbacks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["bug", "idee", "question"] }).notNull().default("question"),
  description: text("description").notNull(),
  page: text("page"),
  status: text("status", { enum: ["pending", "in_progress", "done"] })
    .notNull()
    .default("pending"),
  /** Satisfaction utilisateur après traitement (feedback_resolved). */
  satisfaction: text("satisfaction", { enum: ["up", "down"] }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Tokens de réinitialisation de mot de passe. */
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Astuces mnémotechniques personnelles associées à un mot. */
export const memoTips = sqliteTable("memo_tips", {
  id: text("id").primaryKey(),
  wordId: text("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tip: text("tip").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type MemoTip = typeof memoTips.$inferSelect;

export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ClassMember = typeof classMembers.$inferSelect;
export type ClassList = typeof classLists.$inferSelect;
export type WordFamily = typeof wordFamilies.$inferSelect;
export type List = typeof lists.$inferSelect;
export type Word = typeof words.$inferSelect;
export type Revision = typeof revisions.$inferSelect;
export type RevisionSession = typeof revisionSessions.$inferSelect;
export type GardenProgress = typeof gardenProgress.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Feedback = typeof feedbacks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
