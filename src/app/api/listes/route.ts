import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createUserListPair } from "@/lib/user-list";

/**
 * POST /api/listes
 * Crée une paire famille + liste (1:1) avec le même nom.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: {
    name?: string;
    source?: "manual" | "ocr" | "pdf";
    language?: string;
  };
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
      id: created.listId,
      familyId: created.familyId,
      name: created.name,
      source: created.source,
      language: created.language,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la création";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
