import { db } from "@/lib/db";
import { wordFamilies, lists } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";

export type ListSource = "manual" | "ocr" | "pdf" | "shop";

export type CreateUserListInput = {
  userId: string;
  name: string;
  source?: ListSource;
  language?: string | null;
};

export type CreatedUserList = {
  familyId: string;
  listId: string;
  name: string;
  source: ListSource;
  language: string | null;
};

/** Crée une paire famille + liste avec le même nom (modèle 1:1). */
export async function createUserListPair(
  input: CreateUserListInput
): Promise<CreatedUserList> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Le nom de la liste est requis");
  }
  const source = input.source ?? "manual";
  const language = input.language?.trim() || null;
  const familyId = nanoid();
  const listId = nanoid();

  await db.insert(wordFamilies).values({
    id: familyId,
    userId: input.userId,
    name,
  });
  await db.insert(lists).values({
    id: listId,
    familyId,
    name,
    source,
    language,
  });

  return { familyId, listId, name, source, language };
}

/** Synchronise word_families.name sur le nom de la liste. */
export async function syncFamilyNameToList(
  familyId: string,
  listName: string
): Promise<void> {
  const name = listName.trim();
  if (!name) return;
  await db
    .update(wordFamilies)
    .set({ name })
    .where(eq(wordFamilies.id, familyId));
}

export async function countListsInFamily(familyId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lists)
    .where(eq(lists.familyId, familyId));
  return Number(row?.count ?? 0);
}

/** Vérifie qu'une famille appartient à l'utilisateur et n'a pas déjà de liste. */
export async function assertFamilyEmptyForNewList(
  familyId: string,
  userId: string
): Promise<{ id: string; name: string }> {
  const [family] = await db
    .select({ id: wordFamilies.id, name: wordFamilies.name })
    .from(wordFamilies)
    .where(
      and(eq(wordFamilies.id, familyId), eq(wordFamilies.userId, userId))
    )
    .limit(1);
  if (!family) {
    throw new Error("LISTE_NOT_FOUND");
  }
  const count = await countListsInFamily(familyId);
  if (count > 0) {
    throw new Error("FAMILY_ALREADY_HAS_LIST");
  }
  return family;
}

/** Supprime une liste et sa famille si modèle 1:1 respecté. */
export async function deleteUserListWithFamily(
  listId: string,
  userId: string
): Promise<void> {
  const [list] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);
  if (!list) {
    throw new Error("LISTE_NOT_FOUND");
  }
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, list.familyId),
        eq(wordFamilies.userId, userId)
      )
    )
    .limit(1);
  if (!family) {
    throw new Error("LISTE_NOT_FOUND");
  }
  const count = await countListsInFamily(list.familyId);
  if (count > 1) {
    throw new Error("FAMILY_HAS_MULTIPLE_LISTS");
  }
  await db.delete(wordFamilies).where(eq(wordFamilies.id, list.familyId));
}
