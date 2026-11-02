import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { AnnouncementError, parseAnnouncementDraft } from "@/lib/announcements";
import { removeAnnouncement, saveAnnouncement } from "@/lib/announcements-server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (user.role !== "creator") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = parseAnnouncementDraft(body, new Date());
  if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 });

  try {
    await saveAnnouncement(id, parsed.draft);
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof AnnouncementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PATCH /api/creator/announcements]", error);
    return NextResponse.json({ error: "L'annonce n'a pas pu être mise à jour." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (user.role !== "creator") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await context.params;
  try {
    await removeAnnouncement(id);
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof AnnouncementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/creator/announcements]", error);
    return NextResponse.json({ error: "L'annonce n'a pas pu être supprimée." }, { status: 500 });
  }
}
