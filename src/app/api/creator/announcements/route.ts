import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { AnnouncementError, parseAnnouncementDraft } from "@/lib/announcements";
import { createAnnouncement, listAnnouncementsForCreator } from "@/lib/announcements-server";

export async function GET() {
  const denied = await creatorGuard();
  if (denied) return denied;

  try {
    const announcements = await listAnnouncementsForCreator();
    return NextResponse.json({ announcements }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return announcementErrorResponse(error, "[GET /api/creator/announcements]", "Impossible de charger les annonces.");
  }
}

export async function POST(request: Request) {
  const denied = await creatorGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = parseAnnouncementDraft(body, new Date());
  if (!parsed.ok) return NextResponse.json({ error: parsed.message }, { status: 400 });

  try {
    const id = await createAnnouncement(parsed.draft);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return announcementErrorResponse(error, "[POST /api/creator/announcements]", "L'annonce n'a pas pu être enregistrée.");
  }
}

async function creatorGuard() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (user.role !== "creator") return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  return null;
}

function announcementErrorResponse(error: unknown, logLabel: string, fallback: string) {
  if (error instanceof AnnouncementError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(logLabel, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
