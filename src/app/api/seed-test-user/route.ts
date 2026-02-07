import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, gardenProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "test1234";

/**
 * POST /api/seed-test-user
 * Body: { "secret": "ton_secret" }
 * Crée le compte test (test@test.com / test1234) si le secret correspond à
 * SEED_SECRET et que le compte n'existe pas. À appeler une fois après déploiement.
 */
export async function POST(request: Request) {
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

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);

  if (existing) {
    return NextResponse.json({
      ok: true,
      message: "Compte test déjà présent",
      email: TEST_EMAIL,
    });
  }

  const id = nanoid();
  const passwordHash = await hash(TEST_PASSWORD, 12);
  await db.insert(users).values({
    id,
    email: TEST_EMAIL,
    passwordHash,
    name: "Test",
  });
  await db.insert(gardenProgress).values({ userId: id });

  return NextResponse.json({
    ok: true,
    message: "Compte test créé",
    email: TEST_EMAIL,
  });
}
