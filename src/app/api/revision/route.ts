import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  wordFamilies,
  lists,
  words,
  revisions,
} from "@/lib/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { computeSM2 } from "@/lib/sm2";

/**
 * GET /api/revision
 * Retourne les mots à réviser pour l'utilisateur connecté.
 * Query: listId (une liste) ou listIds (plusieurs) ou familyId (toute la famille). Sans param = tous les mots.
 * Filtre par défaut: jamais révisés ou nextReviewAt <= now.
 * Query all=1: retourne tous les mots des listes (pas de filtre par date), pour une session de révision complète.
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = user.id;

  const { searchParams } = new URL(request.url);
  const isExpress = searchParams.get("express") === "1";
  const listId = searchParams.get("listId")?.trim() || undefined;
  const listIdsParam = searchParams.get("listIds")?.trim();
  const listIds = listIdsParam
    ? listIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const familyId = searchParams.get("familyId")?.trim() || undefined;
  const includeAll = searchParams.get("all") === "1";

  const now = new Date();

  if (isExpress) {
    const allUserWords = await db
      .select({
        id: words.id,
        listId: words.listId,
        term: words.term,
        definition: words.definition,
      })
      .from(words)
      .innerJoin(lists, eq(words.listId, lists.id))
      .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
      .where(eq(wordFamilies.userId, userId));

    if (allUserWords.length === 0) {
      return NextResponse.json({ words: [], upToDate: true });
    }

    const allRevs = await db
      .select({
        wordId: revisions.wordId,
        nextReviewAt: revisions.nextReviewAt,
        createdAt: revisions.createdAt,
      })
      .from(revisions)
      .where(eq(revisions.userId, userId))
      .orderBy(desc(revisions.createdAt));

    const latestByWordExpress = new Map<string, Date>();
    for (const r of allRevs) {
      if (!latestByWordExpress.has(r.wordId)) {
        latestByWordExpress.set(r.wordId, r.nextReviewAt);
      }
    }

    const dueExpress = allUserWords
      .filter((w) => {
        const nra = latestByWordExpress.get(w.id);
        if (!nra) return true;
        return nra <= now;
      })
      .sort((a, b) => {
        const aDate = latestByWordExpress.get(a.id)?.getTime() ?? 0;
        const bDate = latestByWordExpress.get(b.id)?.getTime() ?? 0;
        return aDate - bDate;
      })
      .slice(0, 10);

    if (dueExpress.length === 0) {
      return NextResponse.json({ words: [], upToDate: true });
    }

    return NextResponse.json({ words: dueExpress });
  }

  let baseCondition = eq(wordFamilies.userId, userId);
  if (listIds && listIds.length > 0) {
    baseCondition = and(baseCondition, inArray(lists.id, listIds)) as typeof baseCondition;
  } else if (listId) {
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

  if (includeAll) {
    return NextResponse.json({ words: userWords });
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
 * Enregistre une révision pour un mot (SM-2) et calcule la prochaine date.
 * Body: { wordId: string, rating?: 0|1|2|3, success?: boolean }
 * rating: 0=oublié, 1=difficile, 2=bien, 3=parfait
 * Compatibilité : success=true → rating=2, success=false → rating=0
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = user.id;

  let body: { wordId?: string; rating?: number; success?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const wordId = body.wordId?.trim();
  let rating: number;
  if (typeof body.rating === "number" && body.rating >= 0 && body.rating <= 3) {
    rating = Math.round(body.rating);
  } else if (body.success === true) {
    rating = 2;
  } else if (body.success === false) {
    rating = 0;
  } else {
    return NextResponse.json(
      { error: "rating (0-3) ou success requis" },
      { status: 400 }
    );
  }

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

  const [lastRevision] = await db
    .select({
      easeFactor: revisions.easeFactor,
      interval: revisions.interval,
      repetitions: revisions.repetitions,
    })
    .from(revisions)
    .where(
      and(eq(revisions.wordId, wordId), eq(revisions.userId, userId))
    )
    .orderBy(desc(revisions.createdAt))
    .limit(1);

  const easeFactor = lastRevision?.easeFactor ?? 2.5;
  const interval = lastRevision?.interval ?? 1;
  const repetitions = lastRevision?.repetitions ?? 0;

  const result = computeSM2({
    easeFactor: typeof easeFactor === "number" ? easeFactor : 2.5,
    interval: typeof interval === "number" ? interval : 1,
    repetitions: typeof repetitions === "number" ? repetitions : 0,
    rating,
  });

  const success = rating >= 2;
  const id = nanoid();
  await db.insert(revisions).values({
    id,
    wordId,
    userId,
    success,
    nextReviewAt: result.nextReviewAt,
    easeFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    rating,
  });

  return NextResponse.json({
    nextReviewAt: result.nextReviewAt,
    interval: result.interval,
    easeFactor: result.easeFactor,
    repetitions: result.repetitions,
  });
}
