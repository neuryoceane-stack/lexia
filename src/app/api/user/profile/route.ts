import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, runRawSql } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STATUS_VALUES = ["etudiant", "salarie", "independant", "en_formation"] as const;
export type ProfileStatus = (typeof STATUS_VALUES)[number];

export type UserProfilePayload = {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  city?: string | null;
  phone?: string | null;
  status?: ProfileStatus | null;
  institutionName?: string | null;
};

async function ensureTable() {
  await runRawSql(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      first_name TEXT,
      last_name TEXT,
      date_of_birth TEXT,
      city TEXT,
      phone TEXT,
      status TEXT,
      institution_name TEXT,
      updated_at INTEGER NOT NULL
    )
  `);
}

/**
 * GET /api/user/profile
 * Retourne le profil utilisateur (informations personnelles).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;
  await ensureTable();

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return NextResponse.json({
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    dateOfBirth: profile?.dateOfBirth ?? null,
    city: profile?.city ?? null,
    phone: profile?.phone ?? null,
    status: profile?.status ?? null,
    institutionName: profile?.institutionName ?? null,
    email: session.user.email ?? null,
  });
}

/**
 * PATCH /api/user/profile
 * Body: UserProfilePayload
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;
  await ensureTable();

  let body: UserProfilePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const firstName =
    body.firstName === null || body.firstName === ""
      ? null
      : typeof body.firstName === "string"
        ? body.firstName.trim().slice(0, 200)
        : undefined;
  const lastName =
    body.lastName === null || body.lastName === ""
      ? null
      : typeof body.lastName === "string"
        ? body.lastName.trim().slice(0, 200)
        : undefined;
  const dateOfBirth =
    body.dateOfBirth === null || body.dateOfBirth === ""
      ? null
      : typeof body.dateOfBirth === "string"
        ? body.dateOfBirth.trim().slice(0, 10)
        : undefined;
  const city =
    body.city === null || body.city === ""
      ? null
      : typeof body.city === "string"
        ? body.city.trim().slice(0, 200)
        : undefined;
  const phone =
    body.phone === null || body.phone === ""
      ? null
      : typeof body.phone === "string"
        ? body.phone.trim().slice(0, 30)
        : undefined;
  const status =
    body.status !== undefined && body.status !== null
      ? STATUS_VALUES.includes(body.status as ProfileStatus)
        ? (body.status as ProfileStatus)
        : null
      : undefined;
  const institutionName =
    body.institutionName === null || body.institutionName === ""
      ? null
      : typeof body.institutionName === "string"
        ? body.institutionName.trim().slice(0, 300)
        : undefined;

  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const next = {
    userId,
    firstName: firstName ?? existing?.firstName ?? null,
    lastName: lastName ?? existing?.lastName ?? null,
    dateOfBirth: dateOfBirth ?? existing?.dateOfBirth ?? null,
    city: city ?? existing?.city ?? null,
    phone: phone ?? existing?.phone ?? null,
    status: status !== undefined ? status : existing?.status ?? null,
    institutionName: institutionName ?? existing?.institutionName ?? null,
    updatedAt: new Date(),
  };

  try {
    await db
      .insert(userProfiles)
      .values(next)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          firstName: next.firstName,
          lastName: next.lastName,
          dateOfBirth: next.dateOfBirth,
          city: next.city,
          phone: next.phone,
          status: next.status,
          institutionName: next.institutionName,
          updatedAt: next.updatedAt,
        },
      });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/user/profile]", message);
    return NextResponse.json(
      {
        error: "Erreur lors de l’enregistrement du profil.",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    firstName: next.firstName,
    lastName: next.lastName,
    dateOfBirth: next.dateOfBirth,
    city: next.city,
    phone: next.phone,
    status: next.status,
    institutionName: next.institutionName,
  });
}
