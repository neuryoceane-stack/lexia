import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "../src/lib/db";
import { ensureClassTables } from "../src/lib/db/migrations";
import { users, gardenProgress, userProfiles } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "test1234";

const PROF_EMAIL = "prof@test.com";
const PROF_PASSWORD = "prof1234";

async function seedStudent() {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);

  if (existing) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, existing.id))
      .limit(1);
    if (!profile) {
      await db.insert(userProfiles).values({ userId: existing.id, role: "etudiant" });
      console.log("Profil étudiant ajouté pour :", TEST_EMAIL);
    }
    return;
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
  await db.insert(userProfiles).values({ userId: id, role: "etudiant" });
  console.log("Compte étudiant créé :", TEST_EMAIL, "/", TEST_PASSWORD);
}

async function seedProfessor() {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, PROF_EMAIL))
    .limit(1);

  if (existing) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, existing.id))
      .limit(1);
    if (!profile) {
      await db.insert(userProfiles).values({ userId: existing.id, role: "professeur" });
      console.log("Profil professeur ajouté pour :", PROF_EMAIL);
    } else {
      console.log("Compte professeur déjà présent :", PROF_EMAIL);
    }
    return;
  }

  const id = nanoid();
  const passwordHash = await hash(PROF_PASSWORD, 12);
  await db.insert(users).values({
    id,
    email: PROF_EMAIL,
    passwordHash,
    name: "Professeur Test",
  });
  await db.insert(userProfiles).values({ userId: id, role: "professeur" });
  console.log("Compte professeur créé :", PROF_EMAIL, "/", PROF_PASSWORD);
}

async function seed() {
  await ensureClassTables();
  await seedStudent();
  await seedProfessor();
  console.log("\nComptes test disponibles :");
  console.log("  Étudiant  :", TEST_EMAIL, "/", TEST_PASSWORD);
  console.log("  Professeur:", PROF_EMAIL, "/", PROF_PASSWORD);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
