import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AVATAR_TYPES = ["arbre", "phenix", "koala"] as const;
export type AvatarType = (typeof AVATAR_TYPES)[number];

/**
 * GET /api/user/preferences
 * Retourne les préférences utilisateur (avatarType pour la Synthèse).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const avatarType = prefs?.avatarType ?? "arbre";
  return NextResponse.json({ avatarType });
}

/**
 * PATCH /api/user/preferences
 * Body: { avatarType?: "arbre" | "phenix" | "koala" }
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { avatarType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const raw = body.avatarType;
  const avatarType = AVATAR_TYPES.includes(raw as AvatarType)
    ? (raw as AvatarType)
    : "arbre";

  await db
    .insert(userPreferences)
    .values({
      userId,
      avatarType,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { avatarType, updatedAt: new Date() },
    });

  return NextResponse.json({ avatarType });
}
