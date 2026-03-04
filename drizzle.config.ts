import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const useTurso =
  process.env.TURSO_DATABASE_URL?.trim() && process.env.TURSO_AUTH_TOKEN?.trim();

export default defineConfig(
  useTurso
    ? {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url: process.env.DATABASE_URL?.replace(/^file:/, "") ?? "vocab.db",
        },
      }
);
