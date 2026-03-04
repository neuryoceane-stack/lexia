import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/** Génère un identifiant court unique (6 caractères alphanumériques majuscules). */
function generateIdentifier(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * GET /api/classes
 * Liste les classes du professeur connecté.
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = user.role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  const list = await db
    .select()
    .from(classes)
    .where(eq(classes.teacherId, user.id))
    .orderBy(classes.createdAt);

  return NextResponse.json({ classes: list });
}

/**
 * POST /api/classes
 * Crée une classe. Body: { title: string, language?: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = user.role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  let body: { title?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title || title.length < 2) {
    return NextResponse.json(
      { error: "Le titre doit faire au moins 2 caractères" },
      { status: 400 }
    );
  }

  let identifier = generateIdentifier();
  for (let attempt = 0; attempt < 10; attempt++) {
    const [existing] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.identifier, identifier))
      .limit(1);
    if (!existing) break;
    identifier = generateIdentifier();
  }

  const id = nanoid();
  await db.insert(classes).values({
    id,
    teacherId: user.id,
    identifier,
    title,
    language: body.language?.trim() || null,
    createdAt: new Date(),
  });

  const [created] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, id))
    .limit(1);

  return NextResponse.json(created);
}
