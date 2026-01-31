import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists, words } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, and, asc } from "drizzle-orm";

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

export async function GET(
  _request: Request,
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
  const rows = await db
    .select()
    .from(words)
    .where(eq(words.listId, listId))
    .orderBy(asc(words.rank), asc(words.createdAt));
  return NextResponse.json(rows);
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
  let body: { term?: string; definition?: string; rank?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const term = body.term?.trim();
  const definition = body.definition?.trim() ?? "";
  if (!term) {
    return NextResponse.json(
      { error: "Le mot est requis" },
      { status: 400 }
    );
  }
  const id = nanoid();
  const rank = typeof body.rank === "number" ? body.rank : 0;
  await db.insert(words).values({
    id,
    listId,
    term,
    definition,
    rank,
  });
  const [created] = await db
    .select()
    .from(words)
    .where(eq(words.id, id))
    .limit(1);
  return NextResponse.json(created);
}
