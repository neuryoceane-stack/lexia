import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db, runRawSql } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AVATAR_TYPES = ["arbre", "phenix", "koala"] as const;
export type AvatarType = (typeof AVATAR_TYPES)[number];

const PREFERRED_LANGUAGE_CODES = [
  "fra", "eng", "spa", "deu", "ita", "por", "nld", "pol", "rus", "jpn", "zho", "ell",
] as const;

/**
 * GET /api/user/preferences
 * Retourne les préférences utilisateur (avatarType pour la Synthèse).
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = user.id;

  // Migrations automatiques (colonnes langues, thème)
  for (const col of [
    "ALTER TABLE user_preferences ADD COLUMN preferred_language text;",
    "ALTER TABLE user_preferences ADD COLUMN preferred_language_2 text;",
    "ALTER TABLE user_preferences ADD COLUMN preferred_languages text;",
    "ALTER TABLE user_preferences ADD COLUMN theme_preference text;",
  ]) {
    try {
      await runRawSql(col);
    } catch {
      /* colonne déjà présente */
    }
  }

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const avatarType = prefs?.avatarType ?? "arbre";
  let preferredLanguages: string[] = [];
  if (prefs?.preferredLanguages) {
    try {
      const parsed = JSON.parse(prefs.preferredLanguages) as unknown;
      if (Array.isArray(parsed)) {
        preferredLanguages = parsed.filter(
          (c): c is string => typeof c === "string" && PREFERRED_LANGUAGE_CODES.includes(c as (typeof PREFERRED_LANGUAGE_CODES)[number])
        );
      }
    } catch {
      /* ignore */
    }
  }
  if (preferredLanguages.length === 0 && (prefs?.preferredLanguage ?? prefs?.preferredLanguage2)) {
    preferredLanguages = [prefs.preferredLanguage, prefs.preferredLanguage2].filter(Boolean) as string[];
  }
  const preferredLanguage = preferredLanguages[0] ?? null;
  const preferredLanguage2 = preferredLanguages[1] ?? null;
  const themePreference =
    prefs?.themePreference === "light" || prefs?.themePreference === "dark"
      ? prefs.themePreference
      : "light";
  return NextResponse.json({
    avatarType,
    preferredLanguage,
    preferredLanguage2,
    preferredLanguages,
    themePreference,
  });
}

/**
 * PATCH /api/user/preferences
 * Body: { avatarType?: "arbre" | "phenix" | "koala", preferredLanguage?: string }
 */
export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = user.id;

  let body: {
    avatarType?: string;
    preferredLanguage?: string | null;
    preferredLanguage2?: string | null;
    preferredLanguages?: string[] | null;
    themePreference?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const rawAvatar = body.avatarType;
  const avatarType = AVATAR_TYPES.includes(rawAvatar as AvatarType)
    ? (rawAvatar as AvatarType)
    : (existing?.avatarType ?? "arbre");

  let preferredLanguages: string[] = [];
  if (Array.isArray(body.preferredLanguages)) {
    preferredLanguages = body.preferredLanguages.filter((c) =>
      PREFERRED_LANGUAGE_CODES.includes(c as (typeof PREFERRED_LANGUAGE_CODES)[number])
    );
  } else {
    let fromExisting: string[] = [];
    if (existing?.preferredLanguages) {
      try {
        const p = JSON.parse(existing.preferredLanguages) as unknown;
        fromExisting = Array.isArray(p) ? (p as string[]) : [];
      } catch {
        /* ignore */
      }
    }
    if (fromExisting.length > 0) {
      preferredLanguages = fromExisting;
    } else {
      const L1 =
        body.preferredLanguage === null || body.preferredLanguage === ""
          ? null
          : PREFERRED_LANGUAGE_CODES.includes(body.preferredLanguage as (typeof PREFERRED_LANGUAGE_CODES)[number])
            ? body.preferredLanguage
            : existing?.preferredLanguage ?? null;
      const L2 =
        body.preferredLanguage2 === null || body.preferredLanguage2 === ""
          ? null
          : PREFERRED_LANGUAGE_CODES.includes(body.preferredLanguage2 as (typeof PREFERRED_LANGUAGE_CODES)[number])
            ? body.preferredLanguage2
            : existing?.preferredLanguage2 ?? null;
      preferredLanguages = [L1, L2].filter(Boolean) as string[];
    }
  }
  const preferredLanguage = preferredLanguages[0] ?? null;
  const preferredLanguage2 = preferredLanguages[1] ?? null;
  const preferredLanguagesJson = JSON.stringify(preferredLanguages);
  const THEME_VALUES = ["light", "dark"] as const;
  const rawTheme = body.themePreference;
  const themePreference = THEME_VALUES.includes(rawTheme as (typeof THEME_VALUES)[number])
    ? (rawTheme as (typeof THEME_VALUES)[number])
    : (existing?.themePreference === "dark" ? "dark" : "light");

  for (const col of [
    "ALTER TABLE user_preferences ADD COLUMN preferred_language text;",
    "ALTER TABLE user_preferences ADD COLUMN preferred_language_2 text;",
    "ALTER TABLE user_preferences ADD COLUMN preferred_languages text;",
    "ALTER TABLE user_preferences ADD COLUMN theme_preference text;",
  ]) {
    try {
      await runRawSql(col);
    } catch {
      /* déjà présent */
    }
  }

  try {
    await db
      .insert(userPreferences)
      .values({
        userId,
        avatarType,
        preferredLanguage,
        preferredLanguage2,
        preferredLanguages: preferredLanguagesJson,
        themePreference,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          avatarType,
          preferredLanguage,
          preferredLanguage2,
          preferredLanguages: preferredLanguagesJson,
          themePreference,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/user/preferences]", message);
    return NextResponse.json(
      {
        error: "Erreur base de données lors de l’enregistrement.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    avatarType,
    preferredLanguage,
    preferredLanguage2,
    preferredLanguages,
    themePreference,
  });
}
