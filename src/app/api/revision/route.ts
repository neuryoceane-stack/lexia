import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { paywallDenial } from "@/lib/paywall";
import { db } from "@/lib/db";
import {
  wordFamilies,
  lists,
  words,
  revisions,
} from "@/lib/db/schema";
import { eq, and, asc, desc, inArray, or } from "drizzle-orm";
import {
  userCanReviseWord,
  visibleClassListIdsForStudent,
} from "@/lib/class-list-access";
import {
  canSubmitRevisionForWord,
  filterReadableWordsForFreemiumRevision,
} from "@/lib/student-entitlement";
import { nanoid } from "nanoid";
import { computeSM2, ensureFiniteSm2ForInsert } from "@/lib/sm2";
import { logServerError } from "@/lib/server-error-log";

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
  const denied = await paywallDenial(user);
  if (denied) return denied;
  const userId = user.id;
  const classListIds = await visibleClassListIdsForStudent(userId);
  const readableLists =
    classListIds.length > 0
      ? or(eq(wordFamilies.userId, userId), inArray(lists.id, classListIds))
      : eq(wordFamilies.userId, userId);

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
    const allUserWordsRaw = await db
      .select({
        id: words.id,
        listId: words.listId,
        term: words.term,
        definition: words.definition,
        ownerUserId: wordFamilies.userId,
        source: lists.source,
      })
      .from(words)
      .innerJoin(lists, eq(words.listId, lists.id))
      .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
      .where(readableLists);
    const allUserWords = await filterReadableWordsForFreemiumRevision(
      user,
      allUserWordsRaw
    );

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

    return NextResponse.json({
      words: dueExpress.map(({ id, listId, term, definition }) => ({
        id,
        listId,
        term,
        definition,
      })),
    });
  }

  let baseCondition = readableLists;
  if (listIds && listIds.length > 0) {
    baseCondition = and(baseCondition, inArray(lists.id, listIds)) as typeof baseCondition;
  } else if (listId) {
    baseCondition = and(baseCondition, eq(lists.id, listId)) as typeof baseCondition;
  }
  if (familyId) {
    baseCondition = and(baseCondition, eq(wordFamilies.id, familyId)) as typeof baseCondition;
  }

  const userWordsRaw = await db
    .select({
      id: words.id,
      listId: words.listId,
      term: words.term,
      definition: words.definition,
      ownerUserId: wordFamilies.userId,
      source: lists.source,
    })
    .from(words)
    .innerJoin(lists, eq(words.listId, lists.id))
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(baseCondition)
    .orderBy(asc(words.rank), asc(words.createdAt));

  const userWords = await filterReadableWordsForFreemiumRevision(
    user,
    userWordsRaw
  );

  if (userWords.length === 0) {
    return NextResponse.json({ words: [] });
  }

  if (includeAll) {
    return NextResponse.json({
      words: userWords.map(({ id, listId, term, definition }) => ({
        id,
        listId,
        term,
        definition,
      })),
    });
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

  return NextResponse.json({
    words: dueWords.map(({ id, listId, term, definition }) => ({
      id,
      listId,
      term,
      definition,
    })),
  });
}

/**
 * POST /api/revision
 * Enregistre une révision pour un mot (SM-2) et calcule la prochaine date.
 * Flashcards (`lexivaFlash`), dictée (`rating`) et révision express (`rating`)
 * passent toutes par `computeSM2`.
 * Body: { wordId: string, rating?: 0|1|2|3, success?: boolean, lexivaFlash?: 1|3|5 }
 * rating: 0=oublié, 1=difficile, 2=bien, 3=parfait
 * lexivaFlash (flashcards Lexiva) : 1→SM-2 rating 1, 3→2 (Presque), 5→3 (Oui !)
 * Compatibilité : success=true → rating=2, success=false → rating=0
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const denied = await paywallDenial(user);
  if (denied) return denied;
  const userId = user.id;

  try {
  let body: {
    wordId?: string;
    rating?: number;
    success?: boolean;
    lexivaFlash?: number;
    hintPenalty?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const hintPenalty =
    typeof body.hintPenalty === "number"
      ? Math.max(0, Math.min(0.3, body.hintPenalty))
      : 0;

  const wordId = body.wordId?.trim();
  let rating: number;
  if (typeof body.lexivaFlash === "number") {
    const f = Math.round(body.lexivaFlash);
    if (f === 1) {
      rating = 1;
    } else if (f === 3) {
      rating = 2;
    } else if (f === 5) {
      rating = 3;
    } else {
      return NextResponse.json(
        { error: "lexivaFlash doit être 1, 3 ou 5" },
        { status: 400 }
      );
    }
  } else if (typeof body.rating === "number" && body.rating >= 0 && body.rating <= 3) {
    rating = Math.round(body.rating);
  } else if (body.success === true) {
    rating = 2;
  } else if (body.success === false) {
    rating = 0;
  } else {
    return NextResponse.json(
      { error: "rating (0-3), lexivaFlash (1|3|5) ou success requis" },
      { status: 400 }
    );
  }

  if (!wordId) {
    return NextResponse.json(
      { error: "wordId requis" },
      { status: 400 }
    );
  }

  const allowed = await userCanReviseWord(userId, wordId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Mot introuvable ou accès refusé" },
      { status: 404 }
    );
  }
  const canRevise = await canSubmitRevisionForWord(user, wordId);
  if (!canRevise) {
    return NextResponse.json(
      {
        error:
          "Ce mot est verrouillé sur l'offre gratuite. Abonne-toi pour le réviser.",
        code: "freemium_locked",
      },
      { status: 403 }
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

  const penalizedEaseFactor = Math.max(
    1.3,
    (typeof easeFactor === "number" ? easeFactor : 2.5) - hintPenalty
  );

  const computed = computeSM2({
    easeFactor: penalizedEaseFactor,
    interval: typeof interval === "number" ? interval : 1,
    repetitions: typeof repetitions === "number" ? repetitions : 0,
    rating,
  });
  const result = ensureFiniteSm2ForInsert(computed, wordId);

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
  } catch (error) {
    console.error("POST /api/revision", error);
    logServerError({
      source: "api",
      route: "/api/revision",
      method: "POST",
      error,
      userId,
      statusCode: 500,
    });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
