import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lists, userPreferences, wordFamilies } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const PREFERRED_LANGUAGE_CODES = [
  "fra", "eng", "spa", "deu", "ita", "por", "nld", "pol", "rus", "jpn", "zho", "ell",
] as const;

/**
 * DELETE /api/user/preferences/language/[code]
 * Supprime une langue des préférences et supprime définitivement toutes les listes
 * (et leurs mots) de l'utilisateur pour cette langue.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;
  const { code } = await params;

  if (!code || !PREFERRED_LANGUAGE_CODES.includes(code as (typeof PREFERRED_LANGUAGE_CODES)[number])) {
    return NextResponse.json({ error: "Code langue invalide" }, { status: 400 });
  }

  const userFamilies = await db
    .select({ id: wordFamilies.id })
    .from(wordFamilies)
    .where(eq(wordFamilies.userId, userId));
  const familyIds = userFamilies.map((f) => f.id);
  if (familyIds.length > 0) {
    await db
      .delete(lists)
      .where(and(inArray(lists.familyId, familyIds), eq(lists.language, code)));
  }

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  let preferredLanguages: string[] = [];
  if (prefs?.preferredLanguages) {
    try {
      const parsed = JSON.parse(prefs.preferredLanguages) as unknown;
      preferredLanguages = Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      /* ignore */
    }
  }
  if (preferredLanguages.length === 0) {
    return NextResponse.json({ error: "Aucune préférence de langue" }, { status: 400 });
  }
  const next = preferredLanguages.filter((c) => c !== code);
  const preferredLanguagesJson = JSON.stringify(next);

  await db
    .update(userPreferences)
    .set({
      preferredLanguage: next[0] ?? null,
      preferredLanguage2: next[1] ?? null,
      preferredLanguages: preferredLanguagesJson,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userId, userId));

  return NextResponse.json({ preferredLanguages: next });
}
