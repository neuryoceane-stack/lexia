import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const [row] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, id),
        eq(wordFamilies.userId, session.user.id)
      )
    )
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Famille introuvable" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  let body: { name?: string; orderIndex?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const [existing] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, id),
        eq(wordFamilies.userId, session.user.id)
      )
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Famille introuvable" }, { status: 404 });
  }
  const updates: { name?: string; orderIndex?: number } = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.orderIndex !== undefined) updates.orderIndex = body.orderIndex;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existing);
  }
  await db
    .update(wordFamilies)
    .set(updates)
    .where(eq(wordFamilies.id, id));
  const [updated] = await db
    .select()
    .from(wordFamilies)
    .where(eq(wordFamilies.id, id))
    .limit(1);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const [existing] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, id),
        eq(wordFamilies.userId, session.user.id)
      )
    )
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Famille introuvable" }, { status: 404 });
  }
  await db.delete(wordFamilies).where(eq(wordFamilies.id, id));
  return NextResponse.json({ ok: true });
}
