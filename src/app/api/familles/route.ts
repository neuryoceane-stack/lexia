import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(wordFamilies)
    .where(eq(wordFamilies.userId, session.user.id))
    .orderBy(asc(wordFamilies.orderIndex), asc(wordFamilies.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
  if (!name) {
    return NextResponse.json(
      { error: "Le nom de la famille est requis" },
      { status: 400 }
    );
  }
  const id = nanoid();
  await db.insert(wordFamilies).values({
    id,
    userId: session.user.id,
    name,
  });
  const [created] = await db
    .select()
    .from(wordFamilies)
    .where(eq(wordFamilies.id, id))
    .limit(1);
  return NextResponse.json(created);
}
