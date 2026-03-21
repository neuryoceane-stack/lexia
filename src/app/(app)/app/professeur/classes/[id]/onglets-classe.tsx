"use client";

import Link from "next/link";
import { SalleAttente } from "./salle-attente";
import { ListesClasse } from "./listes-classe";
import { formatActifIlYA, formatDerniereActivite } from "@/lib/format-relative-fr";

export type TabId = "tableau-de-bord" | "eleves" | "listes";

const PRIMARY = "#6C3FC8";
const GREEN = "#1D9E75";
const GOLD = "#F5A623";
const BORDER_TERTIARY = "#E2DCF5";
/** Badge « en difficulté » (maîtrise &lt; 30 % avec activité de révision). */
const DIFFICULTE_RED = "#E53E3E";

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
};

function eleveEnDifficulte(m: Member): boolean {
  return (
    m.progress.masteryPct < 30 &&
    m.progress.lastActivityAt != null &&
    m.progress.lastActivityAt !== ""
  );
}

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
    const da = eleveEnDifficulte(a);
    const db = eleveEnDifficulte(b);
    if (da === db) return 0;
    return da ? -1 : 1;
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
              Aucune liste assignée. Ajoute des listes depuis l&apos;onglet
              « Listes de vocabulaire ».
            </p>
          ) : (
            listProgress.map((lp) => {
              const t = masteryTone(lp.masteryPct);
              return (
                <div
                  key={lp.classListId}
                  style={{
                    background: "white",
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
                      {lp.familyName ? (
                        <span
                          style={{
                            color: "var(--foreground-muted)",
                            fontWeight: 400,
                          }}
                        >
                          {" "}
                          · {lp.familyName}
                        </span>
                      ) : null}
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
                      background: "#F0EDF8",
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
                background: "white",
                borderRadius: 12,
                padding: 14,
                border: `0.5px solid ${BORDER_TERTIARY}`,
              }}
            >
              <ul className="m-0 list-none p-0">
                {acceptedSorted.map((m, idx) => {
                  const last = idx === acceptedSorted.length - 1;
                  const tone = masteryTone(m.progress.masteryPct);
                  const enDifficulte = eleveEnDifficulte(m);
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-2.5"
                      style={{
                        padding: "10px 0",
                        borderBottom: last
                          ? "none"
                          : `0.5px solid ${BORDER_TERTIARY}`,
                      }}
                    >
                      <div
                        className="relative shrink-0"
                        style={{ width: 32, height: 32 }}
                      >
                        <div
                          className="flex size-8 items-center justify-center rounded-full"
                          style={{
                            background: "#F0EDF8",
                            fontSize: 11,
                            fontWeight: 500,
                            color: PRIMARY,
                          }}
                        >
                          {initials(m.name)}
                        </div>
                        {enDifficulte ? (
                          <span
                            title="En difficulté"
                            aria-label="En difficulté"
                            className="absolute"
                            style={{
                              bottom: 0,
                              right: 0,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: DIFFICULTE_RED,
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
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
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--foreground-muted)",
                            margin: "2px 0 0",
                          }}
                        >
                          {formatActifIlYA(m.progress.lastActivityAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: tone.color,
                            margin: 0,
                          }}
                        >
                          {m.progress.masteryPct}%
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: "var(--foreground-muted)",
                            margin: "2px 0 0",
                          }}
                        >
                          {m.progress.wordsMastered} mot
                          {m.progress.wordsMastered !== 1 ? "s" : ""} maîtrisé
                          {m.progress.wordsMastered !== 1 ? "s" : ""}
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
