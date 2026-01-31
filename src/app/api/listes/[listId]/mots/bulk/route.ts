import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists, words } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { listId } = await params;
  const list = await ensureListAccess(listId, session.user.id);
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
  const toInsert = items
    .map((w) => ({
      term: String(w.term ?? "").trim(),
      definition: String(w.definition ?? "").trim(),
    }))
    .filter((w) => w.term.length > 0);

  const inserted = [];
  for (let i = 0; i < toInsert.length; i++) {
    const id = nanoid();
    await db.insert(words).values({
      id,
      listId,
      term: toInsert[i].term,
      definition: toInsert[i].definition,
      rank: i,
    });
    inserted.push({ id, ...toInsert[i], rank: i });
  }
  return NextResponse.json({ count: inserted.length, words: inserted });
}
