import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revisionSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/revision/session
 * Enregistre les statistiques d'une session d'apprentissage (alimente la Synthèse).
 * Body: { mode, direction, language?, startedAt, endedAt, durationSeconds, wordsSeen, wordsRetained, wordsWritten }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: {
    mode?: string;
    direction?: string;
    language?: string | null;
    startedAt?: string | number;
    endedAt?: string | number;
    durationSeconds?: number;
    wordsSeen?: number;
    wordsRetained?: number;
    wordsWritten?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const mode = body.mode === "dictee" ? "dictee" : "flashcard";
  const direction =
    body.direction === "def_to_term" ? "def_to_term" : "term_to_def";
  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
  const endedAt = body.endedAt ? new Date(body.endedAt) : new Date();
  const durationSeconds =
    typeof body.durationSeconds === "number"
      ? body.durationSeconds
      : Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
  const wordsSeen = Math.max(0, typeof body.wordsSeen === "number" ? body.wordsSeen : 0);
  const wordsRetained = Math.max(
    0,
    typeof body.wordsRetained === "number" ? body.wordsRetained : 0
  );
  const wordsWritten = Math.max(
    0,
    typeof body.wordsWritten === "number" ? body.wordsWritten : 0
  );
  const language =
    typeof body.language === "string" && body.language.trim()
      ? body.language.trim()
      : null;

  const id = nanoid();
  await db.insert(revisionSessions).values({
    id,
    userId,
    mode,
    direction,
    language,
    startedAt,
    endedAt,
    durationSeconds,
    wordsSeen,
    wordsRetained,
    wordsWritten,
  });

  const [created] = await db
    .select()
    .from(revisionSessions)
    .where(eq(revisionSessions.id, id))
    .limit(1);

  return NextResponse.json(created);
}
