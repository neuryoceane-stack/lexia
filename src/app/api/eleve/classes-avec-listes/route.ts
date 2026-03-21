import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  classes,
  classMembers,
  classLists,
  lists,
  wordFamilies,
  words,
  revisions,
} from "@/lib/db/schema";
import { eq, and, asc, inArray, sql } from "drizzle-orm";

export type BibliothequeList = {
  id: string;
  familyId: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
  progressPercent: number;
  createdAt: Date;
};

export type ClassWithLists = {
  id: string;
  title: string;
  language: string | null;
  /** Niveau scolaire (ex. 6ème) — affichage Paramètres / fiches classe. */
  schoolLevel: string | null;
  /** pending = salle d'attente ; accepted = accès listes visibles. */
  status: "pending" | "accepted";
  lists: BibliothequeList[];
};

/**
 * GET /api/eleve/classes-avec-listes
 * Classes où l'utilisateur est membre (pending ou accepted), avec listes visibles
 * pour les acceptés uniquement. Utilisé par la Bibliothèque (filtrer status accepted)
 * et Paramètres « Ma classe ».
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = user.id;

  const membershipRows = await db
    .select({
      memberStatus: classMembers.status,
      id: classes.id,
      title: classes.title,
      language: classes.language,
      schoolLevel: classes.schoolLevel,
    })
    .from(classMembers)
    .innerJoin(classes, eq(classes.id, classMembers.classId))
    .where(
      and(
        eq(classMembers.userId, userId),
        inArray(classMembers.status, ["pending", "accepted"])
      )
    )
    .orderBy(asc(classes.createdAt));

  if (membershipRows.length === 0) {
    return NextResponse.json({ classes: [] });
  }

  const result: ClassWithLists[] = [];

  for (const row of membershipRows) {
    if (row.memberStatus === "pending") {
      result.push({
        id: row.id,
        title: row.title,
        language: row.language,
        schoolLevel: row.schoolLevel,
        status: "pending",
        lists: [],
      });
      continue;
    }

    const cls = row;
    const listRows = await db
      .select({
        id: lists.id,
        familyId: lists.familyId,
        name: lists.name,
        language: lists.language,
        createdAt: lists.createdAt,
        familyName: wordFamilies.name,
      })
      .from(classLists)
      .innerJoin(lists, eq(lists.id, classLists.listId))
      .innerJoin(wordFamilies, eq(wordFamilies.id, lists.familyId))
      .where(
        and(eq(classLists.classId, cls.id), eq(classLists.isVisible, true))
      )
      .orderBy(asc(classLists.orderIndex));

    if (listRows.length === 0) {
      result.push({
        id: cls.id,
        title: cls.title,
        language: cls.language,
        schoolLevel: cls.schoolLevel,
        status: "accepted",
        lists: [],
      });
      continue;
    }

    const listIds = listRows.map((l) => l.id);

    const wordCounts = await db
      .select({
        listId: words.listId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(words)
      .where(inArray(words.listId, listIds))
      .groupBy(words.listId);
    const countByList = new Map(wordCounts.map((r) => [r.listId, r.count]));

    const successCounts = await db
      .select({ wordId: revisions.wordId })
      .from(revisions)
      .where(
        and(eq(revisions.userId, userId), eq(revisions.success, true))
      );
    const successWordIds = new Set(successCounts.map((r) => r.wordId));

    const wordToList = await db
      .select({ id: words.id, listId: words.listId })
      .from(words)
      .where(inArray(words.listId, listIds));
    const successByList = new Map<string, number>();
    for (const w of wordToList) {
      if (successWordIds.has(w.id)) {
        successByList.set(w.listId, (successByList.get(w.listId) ?? 0) + 1);
      }
    }

    const listsWithStats: BibliothequeList[] = listRows.map((l) => {
      const total = countByList.get(l.id) ?? 0;
      const success = successByList.get(l.id) ?? 0;
      const progressPercent = total > 0 ? Math.round((success / total) * 100) : 0;
      return {
        id: l.id,
        familyId: l.familyId,
        familyName: l.familyName,
        name: l.name,
        language: l.language,
        wordCount: total,
        progressPercent,
        createdAt: l.createdAt,
      };
    });

    listsWithStats.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    result.push({
      id: cls.id,
      title: cls.title,
      language: cls.language,
      schoolLevel: cls.schoolLevel,
      status: "accepted",
      lists: listsWithStats,
    });
  }

  return NextResponse.json({ classes: result });
}
