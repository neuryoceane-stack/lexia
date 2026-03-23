import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, ChevronLeft, FileText, Users } from "lucide-react";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  classes,
  classMembers,
  classLists,
  users,
  lists,
  wordFamilies,
  revisionSessions,
} from "@/lib/db/schema";
import { eq, and, inArray, sql, asc } from "drizzle-orm";
import { getClassDetailAnalytics } from "@/lib/class-detail-analytics";
import { getFlagEmoji, PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { OngletsClasse, type TabId } from "./onglets-classe";
import { ClasseHeader } from "./classe-header";
import { ClassAccessCodeBanner } from "./class-access-code-banner";

const PAGE_BG = "#F8F7FF";
const PRIMARY = "#6C3FC8";
const GOLD = "#F5A623";
const GREEN = "#1D9E75";
const BORDER_TERTIARY = "#E2DCF5";

const TAB_IDS: TabId[] = ["tableau-de-bord", "eleves", "listes"];
function parseTab(tab: string | null): TabId {
  if (tab && TAB_IDS.includes(tab as TabId)) return tab as TabId;
  return "tableau-de-bord";
}

function statMasteryColor(pct: number): string {
  if (pct >= 70) return GREEN;
  if (pct >= 40) return PRIMARY;
  return GOLD;
}

export default async function ClasseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getUser();
  if (!user?.id) return null;

  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab = parseTab(tabParam ?? null);

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.teacherId, user.id)))
    .limit(1);

  if (!cls) notFound();

  const members = await db
    .select({
      id: classMembers.id,
      userId: classMembers.userId,
      status: classMembers.status,
      joinedAt: classMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(classMembers)
    .leftJoin(users, eq(users.id, classMembers.userId))
    .where(eq(classMembers.classId, id));

  const acceptedUserIds = members
    .filter((m) => m.status === "accepted")
    .map((m) => m.userId!);

  const statsByUser: Record<
    string,
    { sessions: number; wordsRetained: number; wordsWritten: number }
  > = {};
  if (acceptedUserIds.length > 0) {
    const statsRows = await db
      .select({
        userId: revisionSessions.userId,
        sessions: sql<number>`count(*)`.as("sessions"),
        wordsRetained: sql<number>`coalesce(sum(${revisionSessions.wordsRetained}), 0)`.as("words_retained"),
        wordsWritten: sql<number>`coalesce(sum(${revisionSessions.wordsWritten}), 0)`.as("words_written"),
      })
      .from(revisionSessions)
      .where(inArray(revisionSessions.userId, acceptedUserIds))
      .groupBy(revisionSessions.userId);
    for (const row of statsRows) {
      statsByUser[row.userId] = {
        sessions: Number(row.sessions),
        wordsRetained: Number(row.wordsRetained),
        wordsWritten: Number(row.wordsWritten),
      };
    }
  }

  const classListsData = await db
    .select({
      id: classLists.id,
      listId: classLists.listId,
      isVisible: classLists.isVisible,
      orderIndex: classLists.orderIndex,
      listName: lists.name,
      familyName: wordFamilies.name,
    })
    .from(classLists)
    .leftJoin(lists, eq(lists.id, classLists.listId))
    .leftJoin(wordFamilies, eq(wordFamilies.id, lists.familyId))
    .where(eq(classLists.classId, id))
    .orderBy(asc(classLists.orderIndex));

  const assignmentInputs = classListsData
    .filter((row): row is (typeof row & { listId: string }) => Boolean(row.listId))
    .map((row) => ({
      classListId: row.id,
      listId: row.listId,
      name: row.listName ?? "Liste",
      familyName: row.familyName ?? "",
    }));

  const analytics = await getClassDetailAnalytics(
    acceptedUserIds,
    assignmentInputs
  );

  const listProgressDTO = analytics.listProgress.map((lp) => ({
    ...lp,
    lastActivityAt: lp.lastActivityAt?.toISOString() ?? null,
  }));

  const zeroProgress = {
    masteryPct: 0,
    wordsMastered: 0,
    lastActivityAt: null as string | null,
  };

  const membersWithStats = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    status: m.status,
    joinedAt: m.joinedAt,
    name: m.userName || m.userEmail?.split("@")[0] || "Élève",
    email: m.userEmail,
    stats: m.userId
      ? statsByUser[m.userId] ?? {
          sessions: 0,
          wordsRetained: 0,
          wordsWritten: 0,
        }
      : null,
    progress:
      m.userId && m.status === "accepted"
        ? (() => {
            const p = analytics.byUserId[m.userId];
            return p
              ? {
                  masteryPct: p.masteryPct,
                  wordsMastered: p.wordsMastered,
                  lastActivityAt: p.lastActivityAt?.toISOString() ?? null,
                }
              : zeroProgress;
          })()
        : zeroProgress,
  }));

  const listsForTab = classListsData
    .filter((l): l is (typeof l & { listId: string }) => Boolean(l.listId))
    .map((l) => {
      const prog = analytics.listProgress.find((p) => p.listId === l.listId);
      return {
        id: l.id,
        listId: l.listId,
        isVisible: l.isVisible ?? false,
        name: l.listName ?? "Liste",
        familyName: l.familyName ?? "",
        wordCount: prog?.wordCount ?? 0,
        masteryPct: prog?.masteryPct ?? 0,
      };
    });

  const nbEleves = membersWithStats.filter((m) => m.status === "accepted").length;
  const nbListes = classListsData.length;
  const mc = statMasteryColor(analytics.globalMasteryPct);

  const langNorm = cls.language?.trim().toLowerCase() ?? "";
  const languageDisplay =
    langNorm.length > 0
      ? {
          flag: getFlagEmoji(langNorm) || "🌐",
          label:
            PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === langNorm)?.label ??
            langNorm.toUpperCase(),
        }
      : null;

  return (
    <div
      className="min-h-full w-full -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:-my-10 sm:px-6 sm:py-10"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="mx-auto max-w-[900px]">
        <Link
          href="/app/professeur/classes"
          className="inline-flex items-center gap-1 no-underline"
          style={{
            width: "fit-content",
            marginBottom: 14,
            fontSize: 12,
            color: "var(--foreground-muted)",
          }}
        >
          <ChevronLeft size={14} strokeWidth={2} aria-hidden />
          Mes classes
        </Link>

        <ClasseHeader
          classId={id}
          initialTitle={cls.title}
          languageDisplay={languageDisplay}
          schoolLevel={cls.schoolLevel ?? null}
        />

        <ClassAccessCodeBanner identifier={cls.identifier} />

        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: 10, marginBottom: 16 }}
        >
          <div
            style={{
              background: "white",
              border: `0.5px solid ${BORDER_TERTIARY}`,
              borderRadius: 12,
              padding: "14px 12px",
            }}
          >
            <div
              className="mb-2 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#F0EDF8",
              }}
            >
              <Users size={14} stroke={PRIMARY} strokeWidth={2} aria-hidden />
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: PRIMARY,
                margin: "0 0 3px",
                lineHeight: 1.1,
              }}
            >
              {nbEleves}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-muted)",
                margin: 0,
              }}
            >
              élèves inscrits
            </p>
          </div>
          <div
            style={{
              background: "white",
              border: `0.5px solid ${BORDER_TERTIARY}`,
              borderRadius: 12,
              padding: "14px 12px",
            }}
          >
            <div
              className="mb-2 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#FEF3DC",
              }}
            >
              <FileText size={14} stroke={GOLD} strokeWidth={2} aria-hidden />
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: GOLD,
                margin: "0 0 3px",
                lineHeight: 1.1,
              }}
            >
              {nbListes}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-muted)",
                margin: 0,
              }}
            >
              listes assignées
            </p>
          </div>
          <div
            style={{
              background: "white",
              border: `0.5px solid ${BORDER_TERTIARY}`,
              borderRadius: 12,
              padding: "14px 12px",
            }}
          >
            <div
              className="mb-2 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#EAF4EF",
              }}
            >
              <Activity size={14} stroke={GREEN} strokeWidth={2} aria-hidden />
            </div>
            <p
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: mc,
                margin: "0 0 3px",
                lineHeight: 1.1,
              }}
            >
              {analytics.globalMasteryPct}%
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--foreground-muted)",
                margin: 0,
              }}
            >
              maîtrise moyenne
            </p>
          </div>
        </div>

        <OngletsClasse
          classId={id}
          activeTab={activeTab}
          nbEleves={nbEleves}
          nbListes={nbListes}
          members={membersWithStats}
          lists={listsForTab}
          classLanguage={cls.language}
          listProgress={listProgressDTO}
        />
      </div>
    </div>
  );
}
