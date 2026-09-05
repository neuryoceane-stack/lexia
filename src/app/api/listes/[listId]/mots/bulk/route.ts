import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists, words } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";

function normalizeTermKey(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function ensureListAccess(listId: string, userId: string) {
  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);
  if (!list) return null;
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, list.familyId),
        eq(wordFamilies.userId, userId)
      )
    )
    .limit(1);
  if (!family) return null;
  return list;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { listId } = await params;
  const list = await ensureListAccess(listId, user.id);
  if (!list) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }
  let body: { words?: Array<{ term?: string; definition?: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const items = Array.isArray(body.words) ? body.words : [];
  const parsed = items
    .map((w) => ({
      term: String(w.term ?? "").trim(),
      definition: String(w.definition ?? "").trim(),
    }))
    .filter((w) => w.term.length > 0);

  const existingRows = await db
    .select({ term: words.term })
    .from(words)
    .where(eq(words.listId, listId));
  const existingTerms = new Set(
    existingRows.map((r) => normalizeTermKey(r.term)).filter(Boolean)
  );

  const seenInBatch = new Set<string>();
  const toInsert = parsed.filter((w) => {
    const key = normalizeTermKey(w.term);
    if (!key || existingTerms.has(key) || seenInBatch.has(key)) return false;
    seenInBatch.add(key);
    return true;
  });

  const [maxRow] = await db
    .select({
      maxRank: sql<number>`coalesce(max(${words.rank}), -1)`.mapWith(Number),
    })
    .from(words)
    .where(eq(words.listId, listId));
  let nextRank = (maxRow?.maxRank ?? -1) + 1;

  const inserted = [];
  for (const word of toInsert) {
    const id = nanoid();
    await db.insert(words).values({
      id,
      listId,
      term: word.term,
      definition: word.definition,
      rank: nextRank,
      isExpression: false,
    });
    inserted.push({ id, ...word, rank: nextRank });
    nextRank += 1;
  }
  return NextResponse.json({ count: inserted.length, words: inserted });
}
