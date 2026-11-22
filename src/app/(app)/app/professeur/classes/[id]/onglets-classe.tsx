"use client";

import Link from "next/link";
import { SalleAttente } from "./salle-attente";
import { ListesClasse } from "./listes-classe";
import { formatActifIlYA, formatDerniereActivite } from "@/lib/format-relative-fr";

export type TabId = "tableau-de-bord" | "eleves" | "listes";

const PRIMARY = "var(--ink)";
const GREEN = "var(--ink)";
const GOLD = "var(--ink)";
const BORDER_TERTIARY = "var(--line)";

function masteryTone(pct: number): { color: string; fill: string } {
  if (pct >= 70) return { color: GREEN, fill: GREEN };
  if (pct >= 40) return { color: PRIMARY, fill: PRIMARY };
  return { color: GOLD, fill: GOLD };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const s = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return s || "?";
}

type Member = {
  id: string;
  userId: string | null;
  status: string;
  joinedAt: Date | null;
  name: string;
  email: string | null;
  stats: { sessions: number; wordsRetained: number; wordsWritten: number } | null;
  progress: {
    masteryPct: number;
    wordsMastered: number;
    lastActivityAt: string | null;
  };
  activity: {
    wordCount: number;
    revisionsThisWeek: number;
    lastActivityAt: string | null;
    inactiveFor7Days: boolean;
  };
};

type ClassList = {
  id: string;
  listId: string | null;
  isVisible: boolean;
  name: string;
  familyName: string;
  wordCount: number;
  masteryPct: number;
};

export type ListProgressDTO = {
  classListId: string;
  listId: string;
  name: string;
  familyName: string;
  masteryPct: number;
  studentsRevisedCount: number;
  wordCount: number;
  lastActivityAt: string | null;
};

type Props = {
  classId: string;
  activeTab: TabId;
  nbEleves: number;
  nbListes: number;
  members: Member[];
  lists: ClassList[];
  classLanguage: string | null;
  listProgress: ListProgressDTO[];
};

const TAB_DEF: { id: TabId; label: (n: number) => string }[] = [
  { id: "tableau-de-bord", label: () => "Tableau de bord" },
  { id: "eleves", label: (n) => `Élèves (${n})` },
  { id: "listes", label: () => "Listes de vocabulaire" },
];

export function OngletsClasse({
  classId,
  activeTab,
  nbEleves,
  nbListes,
  members,
  lists,
  classLanguage,
  listProgress,
}: Props) {
  const baseHref = `/app/professeur/classes/${classId}`;
  const accepted = members.filter((m) => m.status === "accepted");
  const acceptedSorted = [...accepted].sort((a, b) => {
    if (a.activity.inactiveFor7Days !== b.activity.inactiveFor7Days) {
      return a.activity.inactiveFor7Days ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "fr");
  });

  return (
    <div className="mb-10">
      <nav
        className="flex gap-1"
        style={{
          borderBottom: `0.5px solid ${BORDER_TERTIARY}`,
          marginBottom: 16,
        }}
        aria-label="Onglets de la classe"
      >
        {TAB_DEF.map((tab) => {
          const label =
            tab.id === "eleves" ? tab.label(nbEleves) : tab.label(0);
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`${baseHref}?tab=${tab.id}`}
              className="no-underline"
              style={{
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 500,
                color: active ? PRIMARY : "var(--foreground-muted)",
                borderBottom: active
                  ? `2px solid ${PRIMARY}`
                  : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {activeTab === "tableau-de-bord" && (
        <section>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--foreground-muted)",
              margin: "0 0 10px",
            }}
          >
            Progression par liste
          </p>
          {listProgress.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
              Aucune liste assignée. Ajoutez des listes depuis l&apos;onglet
              « Listes de vocabulaire ».
            </p>
          ) : (
            listProgress.map((lp) => {
              const t = masteryTone(lp.masteryPct);
              return (
                <div
                  key={lp.classListId}
                  style={{
                    background: "var(--surface)",
                    borderRadius: 12,
                    padding: 14,
                    border: `0.5px solid ${BORDER_TERTIARY}`,
                    marginBottom: 10,
                  }}
                >
                  <div
                    className="flex justify-between gap-2"
                    style={{ marginBottom: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--foreground)",
                      }}
                    >
                      {lp.name}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: t.color,
                      }}
                    >
                      {lp.masteryPct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "var(--background-subtle)",
                      borderRadius: 3,
                      overflow: "hidden",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(0, lp.masteryPct))}%`,
                        background: t.fill,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--foreground-muted)",
                      margin: 0,
                    }}
                  >
                    {lp.studentsRevisedCount} élève
                    {lp.studentsRevisedCount !== 1 ? "s" : ""} ont révisé ·{" "}
                    {lp.wordCount} mot{lp.wordCount !== 1 ? "s" : ""} · dernière
                    activité {formatDerniereActivite(lp.lastActivityAt)}
                  </p>
                </div>
              );
            })
          )}
        </section>
      )}

      {activeTab === "eleves" && (
        <div>
          <SalleAttente classId={classId} members={members} className="mb-8" />
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--foreground-muted)",
              margin: "0 0 10px",
            }}
          >
            {accepted.length} élève{accepted.length !== 1 ? "s" : ""} inscrit
            {accepted.length !== 1 ? "s" : ""}
          </p>
          {accepted.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
              Aucun élève accepté pour le moment.
            </p>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 12,
                padding: 14,
                border: `0.5px solid ${BORDER_TERTIARY}`,
              }}
            >
              <ul className="m-0 list-none p-0">
                {acceptedSorted.map((m, idx) => {
                  const last = idx === acceptedSorted.length - 1;
                  const quiet = m.activity.inactiveFor7Days;
                  const noActivity = m.activity.lastActivityAt == null;
                  return (
                    <li
                      key={m.id}
                      className="flex items-start gap-2.5"
                      style={{
                        padding: "10px 0",
                        borderBottom: last
                          ? "none"
                          : `0.5px solid ${BORDER_TERTIARY}`,
                      }}
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "var(--background-subtle)",
                          fontSize: 11,
                          fontWeight: 500,
                          color: PRIMARY,
                        }}
                      >
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              margin: 0,
                              color: "var(--foreground)",
                            }}
                          >
                            {m.name}
                          </p>
                          {quiet ? (
                            <span className="inline-flex min-h-6 items-center rounded-full border border-ink bg-mark px-2 text-[11px] font-medium text-ink">
                              Inactif depuis 7 jours
                            </span>
                          ) : null}
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--foreground-muted)",
                            margin: "4px 0 0",
                          }}
                        >
                          {m.activity.wordCount} mot
                          {m.activity.wordCount !== 1 ? "s" : ""} ·{" "}
                          {m.activity.revisionsThisWeek} révision
                          {m.activity.revisionsThisWeek !== 1 ? "s" : ""} cette semaine
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--foreground-muted)",
                            margin: "2px 0 0",
                          }}
                        >
                          {noActivity
                            ? "Pas encore d'activité"
                            : formatActifIlYA(m.activity.lastActivityAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === "listes" && (
        <ListesClasse
          classId={classId}
          classLanguage={classLanguage}
          lists={lists}
        />
      )}
    </div>
  );
}
