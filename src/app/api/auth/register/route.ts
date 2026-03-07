import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { ensureClassTables } from "@/lib/db/migrations";
import { users, gardenProgress, userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateEmail, validatePassword } from "@/lib/validation";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role?: "etudiant" | "professeur";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const email = body.email?.trim()?.toLowerCase();
  const password = body.password;
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const name =
    [firstName, lastName].filter(Boolean).join(" ") ||
    body.name?.trim() ||
    null;
  const role = body.role === "professeur" ? "professeur" : "etudiant";
  const appRole = email === "oci@lexiva.app" ? "creator" : "student";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis" },
      { status: 400 }
    );
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.error }, { status: 400 });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  await ensureClassTables();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email" },
      { status: 409 }
    );
  }

  const id = nanoid();
  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name: name ?? null,
    role: appRole,
  });
  await db.insert(gardenProgress).values({ userId: id });
  await db
    .insert(userProfiles)
    .values({
      userId: id,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      role,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: { role, updatedAt: new Date() },
    });

  return NextResponse.json({
    ok: true,
    userId: id,
    firstName,
    lastName,
    role,
  });
}
