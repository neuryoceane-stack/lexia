"use client";

import { Calendar, List, MessageSquare, Users } from "lucide-react";
import { KpiCard, ErrorNote, LoadingNote, isRecord, num } from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";

type AnalyticsData = {
  totalUsers: number;
  newUsersThisWeek: number;
  usersByRole: Record<string, number>;
  totalWords: number;
  wordsThisWeek: number;
  totalSessions: number;
  sessionsThisWeek: number;
  pendingFeedbacks: number;
};

const ROLE_ORDER = ["student", "teacher", "creator"] as const;

const ROLE_LABELS: Record<string, string> = {
  student: "Étudiant",
  teacher: "Professeur",
  creator: "Créateur",
};

function parseAnalytics(data: unknown): AnalyticsData | null {
  if (!isRecord(data) || !isRecord(data.usersByRole)) return null;
  const totalUsers = num(data.totalUsers);
  const newUsersThisWeek = num(data.newUsersThisWeek);
  const totalWords = num(data.totalWords);
  const wordsThisWeek = num(data.wordsThisWeek);
  const totalSessions = num(data.totalSessions);
  const sessionsThisWeek = num(data.sessionsThisWeek);
  const pendingFeedbacks = num(data.pendingFeedbacks);
  if (
    totalUsers === null ||
    newUsersThisWeek === null ||
    totalWords === null ||
    wordsThisWeek === null ||
    totalSessions === null ||
    sessionsThisWeek === null ||
    pendingFeedbacks === null
  ) {
    return null;
  }
  const usersByRole: Record<string, number> = {};
  for (const [role, value] of Object.entries(data.usersByRole)) {
    const count = num(value);
    if (count === null) return null;
    usersByRole[role] = count;
  }
  return {
    totalUsers,
    newUsersThisWeek,
    usersByRole,
    totalWords,
    wordsThisWeek,
    totalSessions,
    sessionsThisWeek,
    pendingFeedbacks,
  };
}

function weekHint(count: number): string | undefined {
  if (count <= 0) return undefined;
  return `+${count} cette semaine`;
}

export function OverviewSection() {
  const { data, loading, error } = useCreatorResource(
    "/api/creator/analytics",
    parseAnalytics,
    "Impossible de charger les indicateurs.",
  );

  if (loading && !data) return <LoadingNote>Chargement…</LoadingNote>;
  if (!data) return <ErrorNote>{error ?? "Impossible de charger les indicateurs."}</ErrorNote>;

  const known = ROLE_ORDER.map((role) => role);
  const extras = Object.keys(data.usersByRole).filter(
    (role) => !known.includes(role as (typeof ROLE_ORDER)[number]),
  );
  const roles = [...known, ...extras];

  return (
    <div className="space-y-7">
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard
          icon={Users}
          label="Utilisateurs"
          value={String(data.totalUsers)}
          hint={weekHint(data.newUsersThisWeek)}
        />
        <KpiCard
          icon={List}
          label="Mots ajoutés"
          value={String(data.totalWords)}
          hint={weekHint(data.wordsThisWeek)}
        />
        <KpiCard
          icon={Calendar}
          label="Sessions"
          value={String(data.totalSessions)}
          hint={weekHint(data.sessionsThisWeek)}
        />
        <KpiCard
          icon={MessageSquare}
          label="Feedbacks en attente"
          value={String(data.pendingFeedbacks)}
        />
      </div>

      <section>
        <h2 className="mb-4 text-[22px] text-ink">Répartition par rôle</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {roles.map((role) => {
            const count = data.usersByRole[role] ?? 0;
            const pct = data.totalUsers > 0 ? Math.round((count / data.totalUsers) * 100) : 0;
            const label = ROLE_LABELS[role] ?? role;
            return (
              <article key={role} className="rounded-[14px] border border-line bg-surface px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="m-0 text-[15px] text-ink">{label}</p>
                  <p className="m-0 font-heading text-2xl leading-none text-ink tabular-nums">{count}</p>
                </div>
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--background-subtle)]"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={data.totalUsers}
                  aria-valuenow={count}
                  aria-label={label}
                >
                  <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
