/**
 * Réaligne word_families.name sur lists.name (modèle 1:1).
 *
 * Usage (depuis projet-vocab) :
 *   npm run db:sync-family-list-names
 *
 * Les familles avec plusieurs listes sont signalées et ignorées.
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { db } = await import("../src/lib/db");
  const { wordFamilies, lists } = await import("../src/lib/db/schema");
  const { eq, asc, sql } = await import("drizzle-orm");

  const families = await db
    .select({
      id: wordFamilies.id,
      name: wordFamilies.name,
      userId: wordFamilies.userId,
    })
    .from(wordFamilies)
    .orderBy(asc(wordFamilies.createdAt));

  let updated = 0;
  let skippedEmpty = 0;
  let skippedMulti: Array<{
    familyId: string;
    familyName: string;
    listNames: string[];
  }> = [];

  for (const family of families) {
    const familyLists = await db
      .select({ id: lists.id, name: lists.name })
      .from(lists)
      .where(eq(lists.familyId, family.id))
      .orderBy(asc(lists.createdAt));

    if (familyLists.length === 0) {
      skippedEmpty += 1;
      continue;
    }

    if (familyLists.length > 1) {
      skippedMulti.push({
        familyId: family.id,
        familyName: family.name,
        listNames: familyLists.map((l) => l.name),
      });
      continue;
    }

    const listName = familyLists[0].name.trim();
    if (!listName || family.name === listName) {
      continue;
    }

    await db
      .update(wordFamilies)
      .set({ name: listName })
      .where(eq(wordFamilies.id, family.id));
    updated += 1;
    console.log(`✓ ${family.name} → ${listName}`);
  }

  console.log("\n--- Résumé ---");
  console.log(`Familles alignées : ${updated}`);
  console.log(`Familles sans liste : ${skippedEmpty}`);
  console.log(`Familles multi-listes (ignorées) : ${skippedMulti.length}`);

  if (skippedMulti.length > 0) {
    console.log("\n⚠ Familles avec plusieurs listes (non modifiées) :");
    for (const row of skippedMulti) {
      console.log(
        `  - ${row.familyId} « ${row.familyName} » → listes : ${row.listNames.map((n) => `« ${n} »`).join(", ")}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
