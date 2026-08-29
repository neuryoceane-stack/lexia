import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, and, asc } from "drizzle-orm";
import {
  countListsInFamily,
  syncFamilyNameToList,
} from "@/lib/user-list";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id: familyId } = await params;
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, familyId),
        eq(wordFamilies.userId, user.id)
      )
    )
    .limit(1);
  if (!family) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
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
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id: familyId } = await params;
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, familyId),
        eq(wordFamilies.userId, user.id)
      )
    )
    .limit(1);
  if (!family) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }
  const existingCount = await countListsInFamily(familyId);
  if (existingCount > 0) {
    return NextResponse.json(
      {
        error:
          "Cette liste existe déjà. Utilise « Enregistrer dans une liste » pour y ajouter des mots, ou crée une nouvelle liste.",
      },
      { status: 409 }
    );
  }
  let body: { name?: string; source?: "manual" | "ocr" | "pdf"; language?: string };
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
  const language = body.language?.trim() || null;
  const id = nanoid();
  await db.insert(lists).values({
    id,
    familyId,
    name,
    source,
    language,
  });
  await syncFamilyNameToList(familyId, name);
  const [created] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, id))
    .limit(1);
  return NextResponse.json(created);
}
