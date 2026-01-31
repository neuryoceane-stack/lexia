import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "../src/lib/db";
import { users, gardenProgress } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "test1234";

async function seed() {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);

  if (existing) {
    console.log("Compte test déjà présent :", TEST_EMAIL);
    console.log("Mot de passe :", TEST_PASSWORD);
    process.exit(0);
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

  console.log("Compte test créé.");
  console.log("Email :", TEST_EMAIL);
  console.log("Mot de passe :", TEST_PASSWORD);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
