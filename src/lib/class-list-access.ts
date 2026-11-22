import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classLists, classMembers, lists, wordFamilies, words } from "@/lib/db/schema";

/**
 * Listes visibles d'une classe dont l'élève est membre accepté.
 * Ne sélectionne pas visible_from ni due_date : ces colonnes ne sont pas sur Turso.
 */
export async function visibleClassListIdsForStudent(userId: string): Promise<string[]> {
  const rows = await db
    .select({ listId: classLists.listId })
    .from(classLists)
    .innerJoin(
      classMembers,
      and(
        eq(classMembers.classId, classLists.classId),
        eq(classMembers.userId, userId),
        eq(classMembers.status, "accepted")
      )
    )
    .where(eq(classLists.isVisible, true));

  return [...new Set(rows.map((row) => row.listId))];
}

/** Mot de sa bibliothèque, ou mot d'une liste de classe visible. */
export async function userCanReviseWord(userId: string, wordId: string): Promise<boolean> {
  const [owned] = await db
    .select({ id: words.id })
    .from(words)
    .innerJoin(lists, eq(words.listId, lists.id))
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(and(eq(words.id, wordId), eq(wordFamilies.userId, userId)))
    .limit(1);
  if (owned) return true;

  const [shared] = await db
    .select({ id: words.id })
    .from(words)
    .innerJoin(
      classLists,
      and(eq(classLists.listId, words.listId), eq(classLists.isVisible, true))
    )
    .innerJoin(
      classMembers,
      and(
        eq(classMembers.classId, classLists.classId),
        eq(classMembers.userId, userId),
        eq(classMembers.status, "accepted")
      )
    )
    .where(eq(words.id, wordId))
    .limit(1);

  return Boolean(shared);
}
