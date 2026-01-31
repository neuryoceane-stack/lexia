import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists } from "@/lib/db/schema";
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
  return NextResponse.json(list);
}

export async function PATCH(
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
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const name = body.name?.trim();
  if (name === undefined || name === "") {
    return NextResponse.json(list);
  }
  await db.update(lists).set({ name }).where(eq(lists.id, listId));
  const [updated] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);
  return NextResponse.json(updated);
}

export async function DELETE(
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
  await db.delete(lists).where(eq(lists.id, listId));
  return NextResponse.json({ ok: true });
}
