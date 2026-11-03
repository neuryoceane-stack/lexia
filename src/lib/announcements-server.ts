import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lists, users, wordFamilies } from "@/lib/db/schema";
import {
  ANNOUNCEMENTS_TABLES_MISSING,
  ANNOUNCEMENT_NOT_VISIBLE,
  AnnouncementError,
  isMissingAnnouncementTable,
  type AnnouncementDraft,
  type AnnouncementListItem,
  type StudentBanner,
} from "@/lib/announcements";
import {
  deleteAnnouncement,
  dismissAnnouncement,
  insertAnnouncement,
  listAnnouncements,
  loadStudentBanner,
  updateAnnouncement,
} from "@/lib/announcements-store";

let missingTablesLogged = false;

export async function listAnnouncementsForCreator(now = new Date()): Promise<AnnouncementListItem[]> {
  return run(() => listAnnouncements(db, now));
}

export async function createAnnouncement(draft: AnnouncementDraft): Promise<string> {
  return run(() => insertAnnouncement(db, draft));
}

export async function saveAnnouncement(id: string, draft: AnnouncementDraft): Promise<void> {
  return run(() => updateAnnouncement(db, id, draft));
}

export async function removeAnnouncement(id: string): Promise<void> {
  return run(() => deleteAnnouncement(db, id));
}

/**
 * Bannière de l'élève, ou null si aucune annonce ne le concerne
 * ou si les tables ne sont pas encore créées. Les autres erreurs remontent.
 */
export async function readStudentBanner(userId: string, now = new Date()): Promise<StudentBanner | null> {
  try {
    const student = await loadStudentAudience(userId);
    if (!student) return null;
    return await loadStudentBanner(db, userId, student, now);
  } catch (error) {
    if (isMissingAnnouncementTable(error)) {
      logMissingTables(error);
      return null;
    }
    throw error;
  }
}

export async function dismissStudentAnnouncement(
  userId: string,
  announcementId: string,
  now = new Date(),
): Promise<void> {
  const student = await loadStudentAudience(userId);
  if (!student) throw new AnnouncementError(ANNOUNCEMENT_NOT_VISIBLE, 404);
  try {
    await dismissAnnouncement(db, userId, announcementId, student, now);
  } catch (error) {
    if (isMissingAnnouncementTable(error)) {
      logMissingTables(error);
      throw new AnnouncementError(ANNOUNCEMENTS_TABLES_MISSING, 503);
    }
    throw error;
  }
}

async function loadStudentAudience(userId: string) {
  const [user] = await db
    .select({ subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;

  const languageRows = await db
    .select({ language: lists.language })
    .from(lists)
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(eq(wordFamilies.userId, userId));

  const languageCodes = [
    ...new Set(
      languageRows.flatMap((row) => (row.language && row.language.trim() ? [row.language.trim()] : [])),
    ),
  ];

  return { subscriptionStatus: user.subscriptionStatus, languageCodes };
}

async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AnnouncementError) throw error;
    if (isMissingAnnouncementTable(error)) {
      logMissingTables(error);
      throw new AnnouncementError(ANNOUNCEMENTS_TABLES_MISSING, 503);
    }
    throw error;
  }
}

function logMissingTables(error: unknown) {
  if (missingTablesLogged) return;
  missingTablesLogged = true;
  console.error("[announcements] tables absentes", error);
}
