import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists, words } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function ensureWordAccess(wordId: string, userId: string) {
  const [word] = await db
    .select()
    .from(words)
    .where(eq(words.id, wordId))
    .limit(1);
  if (!word) return null;
  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, word.listId))
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
  return word;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ wordId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { wordId } = await params;
  const word = await ensureWordAccess(wordId, session.user.id);
  if (!word) {
    return NextResponse.json({ error: "Mot introuvable" }, { status: 404 });
  }
  let body: { term?: string; definition?: string; rank?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const updates: { term?: string; definition?: string; rank?: number } = {};
  if (body.term !== undefined) updates.term = body.term.trim();
  if (body.definition !== undefined) updates.definition = body.definition.trim();
  if (body.rank !== undefined) updates.rank = body.rank;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(word);
  }
  await db.update(words).set(updates).where(eq(words.id, wordId));
  const [updated] = await db
    .select()
    .from(words)
    .where(eq(words.id, wordId))
    .limit(1);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ wordId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { wordId } = await params;
  const word = await ensureWordAccess(wordId, session.user.id);
  if (!word) {
    return NextResponse.json({ error: "Mot introuvable" }, { status: 404 });
  }
  await db.delete(words).where(eq(words.id, wordId));
  return NextResponse.json({ ok: true });
}
