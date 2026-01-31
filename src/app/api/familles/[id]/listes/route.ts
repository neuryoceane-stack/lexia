import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id: familyId } = await params;
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, familyId),
        eq(wordFamilies.userId, session.user.id)
      )
    )
    .limit(1);
  if (!family) {
    return NextResponse.json({ error: "Famille introuvable" }, { status: 404 });
  }
  const rows = await db
    .select()
    .from(lists)
    .where(eq(lists.familyId, familyId))
    .orderBy(asc(lists.createdAt));
  return NextResponse.json(rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id: familyId } = await params;
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, familyId),
        eq(wordFamilies.userId, session.user.id)
      )
    )
    .limit(1);
  if (!family) {
    return NextResponse.json({ error: "Famille introuvable" }, { status: 404 });
  }
  let body: { name?: string; source?: "manual" | "ocr" | "pdf" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Le nom de la liste est requis" },
      { status: 400 }
    );
  }
  const source = body.source === "ocr" || body.source === "pdf" ? body.source : "manual";
  const id = nanoid();
  await db.insert(lists).values({
    id,
    familyId,
    name,
    source,
  });
  const [created] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, id))
    .limit(1);
  return NextResponse.json(created);
}
