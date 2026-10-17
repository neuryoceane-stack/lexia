import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { paywallDenial } from "@/lib/paywall";
import { db } from "@/lib/db";
import { wordFamilies } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { createUserListPair } from "@/lib/user-list";

export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(wordFamilies)
    .where(eq(wordFamilies.userId, user.id))
    .orderBy(asc(wordFamilies.orderIndex), asc(wordFamilies.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const denied = await paywallDenial(user);
  if (denied) return denied;
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
  const source =
    body.source === "ocr" || body.source === "pdf" ? body.source : "manual";
  const language = body.language?.trim() || null;

  try {
    const created = await createUserListPair({
      userId: user.id,
      name,
      source,
      language,
    });
    return NextResponse.json({
      id: created.familyId,
      listId: created.listId,
      name: created.name,
      userId: user.id,
      orderIndex: 0,
      createdAt: new Date(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la création";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
