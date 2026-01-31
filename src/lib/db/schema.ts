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

export type User = typeof users.$inferSelect;
export type WordFamily = typeof wordFamilies.$inferSelect;
export type List = typeof lists.$inferSelect;
export type Word = typeof words.$inferSelect;
export type Revision = typeof revisions.$inferSelect;
export type GardenProgress = typeof gardenProgress.$inferSelect;
