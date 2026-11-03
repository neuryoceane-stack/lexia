import { and, desc, eq, isNull } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { announcementDismissals, announcements } from "@/lib/db/schema";
import {
  ANNOUNCEMENT_NOT_DISMISSIBLE,
  ANNOUNCEMENT_NOT_FOUND,
  ANNOUNCEMENT_NOT_VISIBLE,
  AnnouncementError,
  isAnnouncementInWindow,
  isAnnouncementUniqueConflict,
  announcementMatchesStudent,
  pickActiveAnnouncement,
  toAnnouncementListItem,
  toStudentBanner,
  type AnnouncementAudience,
  type AnnouncementDraft,
  type AnnouncementListItem,
  type AnnouncementRecord,
  type AnnouncementStatus,
  type AnnouncementType,
  type StudentAudience,
  type StudentBanner,
} from "@/lib/announcements";

export type AnnouncementDatabase = BetterSQLite3Database<typeof schema>;

const columns = {
  id: announcements.id,
  type: announcements.type,
  message: announcements.message,
  linkLabel: announcements.linkLabel,
  linkUrl: announcements.linkUrl,
  audience: announcements.audience,
  languageCode: announcements.languageCode,
  startsAt: announcements.startsAt,
  endsAt: announcements.endsAt,
  dismissible: announcements.dismissible,
  status: announcements.status,
  createdAt: announcements.createdAt,
};

type AnnouncementRow = {
  id: string;
  type: string;
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
  audience: string;
  languageCode: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  dismissible: boolean;
  status: string;
  createdAt: Date;
};

export async function listAnnouncements(
  database: AnnouncementDatabase,
  now: Date,
): Promise<AnnouncementListItem[]> {
  const rows = await database
    .select(columns)
    .from(announcements)
    .orderBy(desc(announcements.createdAt), desc(announcements.id));
  return rows.flatMap((row) => {
    const record = toRecord(row);
    return record ? [toAnnouncementListItem(record, now)] : [];
  });
}

export async function insertAnnouncement(
  database: AnnouncementDatabase,
  draft: AnnouncementDraft,
): Promise<string> {
  const id = crypto.randomUUID();
  await database.insert(announcements).values({
    id,
    ...draftValues(draft),
    createdAt: new Date(),
  });
  return id;
}

export async function updateAnnouncement(
  database: AnnouncementDatabase,
  id: string,
  draft: AnnouncementDraft,
): Promise<void> {
  const [existing] = await database
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);
  if (!existing) throw new AnnouncementError(ANNOUNCEMENT_NOT_FOUND, 404);
  await database.update(announcements).set(draftValues(draft)).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(database: AnnouncementDatabase, id: string): Promise<void> {
  const [existing] = await database
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);
  if (!existing) throw new AnnouncementError(ANNOUNCEMENT_NOT_FOUND, 404);
  await database.delete(announcementDismissals).where(eq(announcementDismissals.announcementId, id));
  await database.delete(announcements).where(eq(announcements.id, id));
}

export async function loadStudentBanner(
  database: AnnouncementDatabase,
  userId: string,
  student: StudentAudience,
  now: Date,
): Promise<StudentBanner | null> {
  const rows = await database
    .select(columns)
    .from(announcements)
    .leftJoin(
      announcementDismissals,
      and(
        eq(announcementDismissals.announcementId, announcements.id),
        eq(announcementDismissals.userId, userId),
      ),
    )
    .where(and(eq(announcements.status, "published"), isNull(announcementDismissals.id)));

  const records = rows.flatMap((row) => {
    const record = toRecord(row);
    return record ? [record] : [];
  });
  const picked = pickActiveAnnouncement(records, student, now);
  return picked ? toStudentBanner(picked) : null;
}

export async function dismissAnnouncement(
  database: AnnouncementDatabase,
  userId: string,
  announcementId: string,
  student: StudentAudience,
  now: Date,
): Promise<void> {
  const [existing] = await database
    .select({ id: announcementDismissals.id })
    .from(announcementDismissals)
    .where(
      and(
        eq(announcementDismissals.announcementId, announcementId),
        eq(announcementDismissals.userId, userId),
      ),
    )
    .limit(1);
  if (existing) return;

  const [row] = await database
    .select(columns)
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1);
  const record = row ? toRecord(row) : null;
  if (!record || record.status !== "published" || !isAnnouncementInWindow(record, now)) {
    throw new AnnouncementError(ANNOUNCEMENT_NOT_VISIBLE, 404);
  }
  if (!announcementMatchesStudent(record, student)) {
    throw new AnnouncementError(ANNOUNCEMENT_NOT_VISIBLE, 404);
  }
  if (!record.dismissible) {
    throw new AnnouncementError(ANNOUNCEMENT_NOT_DISMISSIBLE, 400);
  }

  try {
    await database.insert(announcementDismissals).values({
      id: crypto.randomUUID(),
      announcementId,
      userId,
      dismissedAt: now,
    });
  } catch (error) {
    if (isAnnouncementUniqueConflict(error)) return;
    throw error;
  }
}

function draftValues(draft: AnnouncementDraft) {
  return {
    type: draft.type,
    message: draft.message,
    linkLabel: draft.linkLabel,
    linkUrl: draft.linkUrl,
    audience: draft.audience,
    languageCode: draft.languageCode,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    dismissible: draft.dismissible,
    status: draft.status,
  };
}

function toRecord(row: AnnouncementRow): AnnouncementRecord | null {
  if (!isType(row.type) || !isAudience(row.audience) || !isStatus(row.status)) return null;
  if (!row.createdAt || Number.isNaN(row.createdAt.getTime())) return null;
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    linkLabel: row.linkLabel,
    linkUrl: row.linkUrl,
    audience: row.audience,
    languageCode: row.languageCode,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    dismissible: row.dismissible,
    status: row.status,
    createdAt: row.createdAt,
  };
}

function isType(value: string): value is AnnouncementType {
  return value === "news" || value === "info" || value === "important";
}

function isAudience(value: string): value is AnnouncementAudience {
  return value === "all" || value === "trial" || value === "subscribers" || value === "language";
}

function isStatus(value: string): value is AnnouncementStatus {
  return value === "draft" || value === "published";
}
