import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists, words, revisions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = user.id;
  const now = new Date();

  const userLists = await db
    .select({ id: lists.id })
    .from(lists)
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(eq(wordFamilies.userId, userId));

  const listsCount = userLists.length;

  const userWords = await db
    .select({ id: words.id })
    .from(words)
    .innerJoin(lists, eq(words.listId, lists.id))
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(eq(wordFamilies.userId, userId));

  const wordsCount = userWords.length;

  if (wordsCount === 0) {
    return NextResponse.json({
      listsCount,
      wordsCount: 0,
      dueWordsCount: 0,
      masteredWordsCount: 0,
    });
  }

  const allRevisions = await db
    .select({
      wordId: revisions.wordId,
      nextReviewAt: revisions.nextReviewAt,
      repetitions: revisions.repetitions,
      createdAt: revisions.createdAt,
    })
    .from(revisions)
    .where(eq(revisions.userId, userId))
    .orderBy(desc(revisions.createdAt));

  const latestByWord = new Map<
    string,
    { nextReviewAt: Date; repetitions: number | null }
  >();
  for (const r of allRevisions) {
    if (!latestByWord.has(r.wordId)) {
      latestByWord.set(r.wordId, {
        nextReviewAt: r.nextReviewAt,
        repetitions: r.repetitions,
      });
    }
  }

  let dueWordsCount = 0;
  let masteredWordsCount = 0;

  for (const w of userWords) {
    const latest = latestByWord.get(w.id);
    if (!latest) {
      dueWordsCount++;
      continue;
    }
    if (latest.nextReviewAt <= now) {
      dueWordsCount++;
    }
    if ((latest.repetitions ?? 0) >= 3) {
      masteredWordsCount++;
    }
  }

  return NextResponse.json({
    listsCount,
    wordsCount,
    dueWordsCount,
    masteredWordsCount,
  });
}
