import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, gardenProgress, userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "test1234";

const PROF_EMAIL = "prof@test.com";
const PROF_PASSWORD = "prof1234";

/**
 * Réponse 404 sans corps : la route n'existe pas pour l'appelant.
 * Utilisée dès que NODE_ENV vaut "production" (Vercel production et
 * prévisualisation). Aucune lecture du secret, aucun accès base.
 */
function productionNotFound(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  return null;
}

/**
 * POST /api/seed-test-user
 * Body: { "secret": "ton_secret" }
 *
 * En développement local uniquement : crée les comptes test (étudiant +
 * professeur) si le secret correspond à SEED_SECRET.
 * Dès que NODE_ENV vaut "production", répond 404.
 */
export async function POST(request: Request) {
  const blocked = productionNotFound();
  if (blocked) return blocked;

  const expectedSecret = process.env.SEED_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "SEED_SECRET non configuré" },
      { status: 503 }
    );
  }

  let body: { secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Envoie un body JSON avec { \"secret\": \"...\" }" },
      { status: 400 }
    );
  }

  if (body.secret !== expectedSecret) {
    return NextResponse.json({ error: "Secret invalide" }, { status: 401 });
  }

  const created: string[] = [];

  const [existingStudent] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);

  if (!existingStudent) {
    const id = nanoid();
    const passwordHash = await hash(TEST_PASSWORD, 12);
    await db.insert(users).values({
      id,
      email: TEST_EMAIL,
      passwordHash,
      name: "Test",
    });
    await db.insert(gardenProgress).values({ userId: id });
    await db.insert(userProfiles).values({ userId: id, role: "etudiant" });
    created.push("étudiant");
  } else {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, existingStudent.id))
      .limit(1);
    if (!profile) {
      await db.insert(userProfiles).values({ userId: existingStudent.id, role: "etudiant" });
    }
  }

  const [existingProf] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, PROF_EMAIL))
    .limit(1);

  if (!existingProf) {
    const id = nanoid();
    const passwordHash = await hash(PROF_PASSWORD, 12);
    await db.insert(users).values({
      id,
      email: PROF_EMAIL,
      passwordHash,
      name: "Professeur Test",
    });
    await db.insert(userProfiles).values({ userId: id, role: "professeur" });
    created.push("professeur");
  } else {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, existingProf.id))
      .limit(1);
    if (!profile) {
      await db.insert(userProfiles).values({ userId: existingProf.id, role: "professeur" });
    }
  }

  return NextResponse.json({
    ok: true,
    message: created.length > 0 ? `Comptes créés : ${created.join(", ")}` : "Comptes test déjà présents",
    accounts: [
      { email: TEST_EMAIL, password: TEST_PASSWORD, role: "etudiant" },
      { email: PROF_EMAIL, password: PROF_PASSWORD, role: "professeur" },
    ],
  });
}

/** En production : 404. En développement : 405, seul POST est servi. */
function methodNotAllowed(): NextResponse {
  const blocked = productionNotFound();
  if (blocked) return blocked;
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export function GET() {
  return methodNotAllowed();
}

export function PUT() {
  return methodNotAllowed();
}

export function PATCH() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

export function HEAD() {
  return methodNotAllowed();
}

export function OPTIONS() {
  return methodNotAllowed();
}
