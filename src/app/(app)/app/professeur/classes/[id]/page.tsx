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
import { SalleAttente } from "./salle-attente";
import { ListesClasse } from "./listes-classe";
import { StatsEleves } from "./stats-eleves";

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

export default async function ClasseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;

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
        href="/app/professeur"
        className="btn-relief mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <BackIcon className="h-4 w-4" />
        Retour
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-vocab-gray dark:text-slate-100">
          {cls.title}
        </h1>
        {cls.language && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Langue : {cls.language}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-base font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            {cls.identifier}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Identifiant à partager avec vos élèves
          </span>
        </div>
      </div>

      <SalleAttente
        classId={id}
        members={membersWithStats}
        className="mb-10"
      />

      <ListesClasse
        classId={id}
        classLanguage={cls.language}
        lists={classListsData.map((l) => ({
          id: l.id,
          listId: l.listId,
          isVisible: l.isVisible ?? false,
          name: l.listName ?? "Liste",
          familyName: l.familyName ?? "",
        }))}
        className="mb-10"
      />

      <StatsEleves members={membersWithStats} />
    </div>
  );
}
