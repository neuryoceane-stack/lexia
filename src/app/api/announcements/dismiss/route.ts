import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { AnnouncementError } from "@/lib/announcements";
import { dismissStudentAnnouncement } from "@/lib/announcements-server";

/** Enregistre la fermeture pour cet élève, sur tous ses appareils. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (user.role !== "etudiant") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const id = body && typeof body === "object" ? (body as { id?: unknown }).id : null;
  if (typeof id !== "string" || id.trim() === "" || id.length > 80) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    await dismissStudentAnnouncement(user.id, id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AnnouncementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/announcements/dismiss]", error);
    return NextResponse.json({ error: "L'annonce n'a pas pu être fermée." }, { status: 500 });
  }
}
