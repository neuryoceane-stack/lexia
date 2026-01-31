import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  wordFamilies,
  lists,
  words,
  revisions,
} from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET /api/revision
 * Retourne les mots à réviser pour l'utilisateur connecté.
 * Query: listId (une liste) ou familyId (toute la famille). Sans param = tous les mots de l'utilisateur.
 * Filtre: jamais révisés ou nextReviewAt <= now.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("listId")?.trim() || undefined;
  const familyId = searchParams.get("familyId")?.trim() || undefined;

  const now = new Date();

  let baseCondition = eq(wordFamilies.userId, userId);
  if (listId) {
    baseCondition = and(baseCondition, eq(lists.id, listId)) as typeof baseCondition;
  }
  if (familyId) {
    baseCondition = and(baseCondition, eq(wordFamilies.id, familyId)) as typeof baseCondition;
  }

  const userWords = await db
    .select({
      id: words.id,
      listId: words.listId,
      term: words.term,
      definition: words.definition,
    })
    .from(words)
    .innerJoin(lists, eq(words.listId, lists.id))
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(baseCondition)
    .orderBy(asc(words.rank), asc(words.createdAt));

  if (userWords.length === 0) {
    return NextResponse.json({ words: [] });
  }

  const allRevisions = await db
    .select({
      wordId: revisions.wordId,
      nextReviewAt: revisions.nextReviewAt,
      createdAt: revisions.createdAt,
    })
    .from(revisions)
    .where(eq(revisions.userId, userId))
    .orderBy(desc(revisions.createdAt));

  const latestByWord = new Map<string, { nextReviewAt: Date }>();
  for (const r of allRevisions) {
    if (!latestByWord.has(r.wordId)) {
      latestByWord.set(r.wordId, { nextReviewAt: r.nextReviewAt });
    }
  }

  const dueWords = userWords.filter((w) => {
    const latest = latestByWord.get(w.id);
    if (!latest) return true;
    return latest.nextReviewAt <= now;
  });

  return NextResponse.json({ words: dueWords });
}

/**
 * POST /api/revision
 * Enregistre une révision pour un mot (succès ou échec) et calcule la prochaine date.
 * Body: { wordId: string, success: boolean }
 * Règles simples : succès → revoir dans 1 jour, échec → revoir dans 10 min (même jour).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { wordId?: string; success?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const wordId = body.wordId?.trim();
  const success = body.success === true;

  if (!wordId) {
    return NextResponse.json(
      { error: "wordId requis" },
      { status: 400 }
    );
  }

  const [row] = await db
    .select({ wordId: words.id })
    .from(words)
    .innerJoin(lists, eq(words.listId, lists.id))
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(
      and(
        eq(words.id, wordId),
        eq(wordFamilies.userId, userId)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json(
      { error: "Mot introuvable ou accès refusé" },
      { status: 404 }
    );
  }

  const now = new Date();
  let nextReviewAt: Date;
  if (success) {
    nextReviewAt = new Date(now);
    nextReviewAt.setDate(nextReviewAt.getDate() + 1);
  } else {
    nextReviewAt = new Date(now);
    nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
  }

  const id = nanoid();
  await db.insert(revisions).values({
    id,
    wordId,
    userId,
    success,
    nextReviewAt,
  });

  const [created] = await db
    .select()
    .from(revisions)
    .where(eq(revisions.id, id))
    .limit(1);

  return NextResponse.json(created);
}
