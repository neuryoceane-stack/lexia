import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  notifications,
  feedbacks,
  passwordResetTokens,
  revisions,
  revisionSessions,
  gardenProgress,
  userProfiles,
  userPreferences,
  classMembers,
  classLists,
  classes,
  words,
  lists,
  wordFamilies,
  users,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = user.id;

  try {
    // a. notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // b. feedbacks
    await db.delete(feedbacks).where(eq(feedbacks.userId, userId));

    // c. passwordResetTokens
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));

    // d. revisions
    await db.delete(revisions).where(eq(revisions.userId, userId));

    // e. revisionSessions
    await db
      .delete(revisionSessions)
      .where(eq(revisionSessions.userId, userId));

    // f. gardenProgress
    await db.delete(gardenProgress).where(eq(gardenProgress.userId, userId));

    // g. userProfiles
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

    // h. userPreferences
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId));

    // i. classMembers
    await db.delete(classMembers).where(eq(classMembers.userId, userId));

    // Récupère les familyIds et listIds de l'utilisateur pour les suppressions en cascade
    const userFamilies = await db
      .select({ id: wordFamilies.id })
      .from(wordFamilies)
      .where(eq(wordFamilies.userId, userId));
    const familyIds = userFamilies.map((f) => f.id);

    let listIds: string[] = [];
    if (familyIds.length > 0) {
      const userLists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(inArray(lists.familyId, familyIds));
      listIds = userLists.map((l) => l.id);
    }

    // j. classLists dont listId appartient aux listes de l'utilisateur
    if (listIds.length > 0) {
      await db
        .delete(classLists)
        .where(inArray(classLists.listId, listIds));
    }

    // k. classes (où l'utilisateur est professeur)
    await db.delete(classes).where(eq(classes.teacherId, userId));

    // l. words dont listId appartient aux listes de l'utilisateur
    if (listIds.length > 0) {
      await db.delete(words).where(inArray(words.listId, listIds));
    }

    // m. lists dont familyId appartient aux familles de l'utilisateur
    if (familyIds.length > 0) {
      await db.delete(lists).where(inArray(lists.familyId, familyIds));
    }

    // n. wordFamilies
    await db.delete(wordFamilies).where(eq(wordFamilies.userId, userId));

    // o. users
    await db.delete(users).where(eq(users.id, userId));

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.delete("auth-token");
    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte" },
      { status: 500 },
    );
  }
}
