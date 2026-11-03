import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorEvents } from "@/lib/db/schema";
import { loadTechHealth } from "@/lib/tech-health-server";
import { isMissingTechHealthTable } from "@/lib/server-error-log";
import { eq } from "drizzle-orm";

async function checkCreator() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

function parseLimit(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, 100);
}

function parseOffset(value: string | null): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export async function GET(req: Request) {
  const { error } = await checkCreator();
  if (error) return error;

  const url = new URL(req.url);
  const errorsLimit = parseLimit(url.searchParams.get("errorsLimit"), 20);
  const errorsOffset = parseOffset(url.searchParams.get("errorsOffset"));
  const emailLimit = parseLimit(url.searchParams.get("emailLimit"), 20);
  const emailOffset = parseOffset(url.searchParams.get("emailOffset"));

  try {
    const payload = await loadTechHealth({
      errorsLimit,
      errorsOffset,
      emailLimit,
      emailOffset,
    });
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[creator tech-health GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { error } = await checkCreator();
  if (error) return error;

  let body: { id?: string; reviewStatus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const reviewStatus = body.reviewStatus;
  if (
    !id ||
    (reviewStatus !== "new" && reviewStatus !== "to_check" && reviewStatus !== "fixed")
  ) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const updated = await db
      .update(errorEvents)
      .set({ reviewStatus })
      .where(eq(errorEvents.id, id))
      .returning({ id: errorEvents.id });

    if (!updated[0]) {
      return NextResponse.json({ error: "Erreur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isMissingTechHealthTable(err)) {
      return NextResponse.json({ error: "Table non disponible" }, { status: 503 });
    }
    console.error("[creator tech-health PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
