import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
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
import { OngletsClasse, type TabId } from "./onglets-classe";
import { ClasseHeader } from "./classe-header";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

const TAB_IDS: TabId[] = ["tableau-de-bord", "eleves", "listes"];
function parseTab(tab: string | null): TabId {
  if (tab && TAB_IDS.includes(tab as TabId)) return tab as TabId;
  return "tableau-de-bord";
}

export default async function ClasseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab = parseTab(tabParam ?? null);

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.teacherId, session.user.id)))
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

  const membersWithStats = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    status: m.status,
    joinedAt: m.joinedAt,
    name: m.userName || m.userEmail?.split("@")[0] || "Élève",
    email: m.userEmail,
    stats: m.userId
      ? statsByUser[m.userId] ?? { sessions: 0, wordsRetained: 0, wordsWritten: 0 }
      : null,
  }));

  return (
    <div className="mx-auto max-w-[900px]">
      <Link
        href="/app/professeur/classes"
        className="btn-relief mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <BackIcon className="h-4 w-4" />
        Retour
      </Link>

      <ClasseHeader
        classId={id}
        initialTitle={cls.title}
        language={cls.language}
      />

      <OngletsClasse
        classId={id}
        activeTab={activeTab}
        identifier={cls.identifier}
        nbEleves={membersWithStats.filter((m) => m.status === "accepted").length}
        nbListes={classListsData.length}
        members={membersWithStats}
        lists={classListsData.map((l) => ({
          id: l.id,
          listId: l.listId,
          isVisible: l.isVisible ?? false,
          name: l.listName ?? "Liste",
          familyName: l.familyName ?? "",
        }))}
        classLanguage={cls.language}
      />
    </div>
  );
}
