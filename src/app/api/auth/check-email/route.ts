import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ensureClassTables } from "@/lib/db/migrations";
import { users } from "@/lib/db/schema";
import { validateEmail } from "@/lib/validation";

/**
 * POST /api/auth/check-email
 * Vérifie si une adresse email est déjà utilisée (normalisation lowercase comme register).
 * Réponse minimale : { available: boolean } — sans autre information utilisateur.
 */
export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const email = body.email?.trim()?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.error }, { status: 400 });
  }

  await ensureClassTables();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return NextResponse.json({ available: !existing });
}
