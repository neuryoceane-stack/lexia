import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * GET /api/health
 * Vérifie que l'app et la base de données répondent.
 */
export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const dbMode = tursoUrl ? "Turso (distant)" : "SQLite local (vocab.db)";

  try {
    await db.select().from(users).limit(1);
    return NextResponse.json({
      ok: true,
      db: dbMode,
      message: "Connexion OK",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json(
      {
        ok: false,
        db: dbMode,
        error: message,
        hint:
          dbMode === "Turso (distant)"
            ? "Vérifiez TURSO_DATABASE_URL et TURSO_AUTH_TOKEN. Pour le dev local, supprimez-les pour utiliser vocab.db"
            : "Vérifiez que vocab.db existe ou que DATABASE_URL pointe vers un fichier valide.",
      },
      { status: 503 }
    );
  }
}
