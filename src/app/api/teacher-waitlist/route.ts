import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teacherWaitlist } from "@/lib/db/schema";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Aplatit toute la chaîne des `cause` d'une erreur en une seule string,
 * en agrégeant message et code à chaque niveau. Le client libsql/Turso
 * imbrique le vrai "UNIQUE constraint failed" plusieurs niveaux sous [cause].
 */
function isUniqueConstraintError(err: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = err;
  const seen = new Set<unknown>();

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const obj = current as { message?: unknown; code?: unknown; cause?: unknown };
    if (typeof obj.message === "string") parts.push(obj.message);
    if (typeof obj.code === "string") parts.push(obj.code);
    current = obj.cause;
  }
  if (typeof current === "string") parts.push(current);

  const haystack = parts.join(" ").toLowerCase();
  return (
    haystack.includes("sqlite_constraint") ||
    haystack.includes("unique constraint failed")
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const rawInstitution = typeof body.institution === "string" ? body.institution.trim() : "";
    const institution = rawInstitution === "" ? null : rawInstitution;

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Veuillez saisir une adresse email valide." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Veuillez indiquer votre nom." },
        { status: 400 }
      );
    }

    try {
      await db.insert(teacherWaitlist).values({ email, name, institution });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return NextResponse.json({
          message: "Vous êtes déjà inscrit(e) à la liste d'attente.",
        });
      }
      throw err;
    }

    return NextResponse.json({
      message:
        "Merci ! Votre inscription à la liste d'attente professeur est enregistrée.",
    });
  } catch (err) {
    console.error("[teacher-waitlist] POST error:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
