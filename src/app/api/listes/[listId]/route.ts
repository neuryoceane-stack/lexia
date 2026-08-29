import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { wordFamilies, lists } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { syncFamilyNameToList, deleteUserListWithFamily } from "@/lib/user-list";

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
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { listId } = await params;
  const list = await ensureListAccess(listId, user.id);
  if (!list) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }
  return NextResponse.json(list);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { listId } = await params;
  const list = await ensureListAccess(listId, user.id);
  if (!list) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }
  let body: { name?: string; language?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const name = body.name?.trim();
  const language = body.language !== undefined
    ? (body.language === null || body.language === "" ? null : String(body.language).trim())
    : undefined;
  const updates: { name?: string; language?: string | null } = {};
  if (name !== undefined && name !== "") updates.name = name;
  if (language !== undefined) updates.language = language;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(list);
  }
  await db.update(lists).set(updates).where(eq(lists.id, listId));
  if (updates.name) {
    await syncFamilyNameToList(list.familyId, updates.name);
  }
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
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { listId } = await params;
  const list = await ensureListAccess(listId, user.id);
  if (!list) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }
  try {
    await deleteUserListWithFamily(listId, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "FAMILY_HAS_MULTIPLE_LISTS") {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer cette liste seule : plusieurs listes partagent le même conteneur. Contacte le support.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }
}
