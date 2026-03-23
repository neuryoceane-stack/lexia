"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronLeft, FileText, Plus, Users } from "lucide-react";
import { ClasseCardMenu } from "./classe-card-menu";
import { CreerClasseModal } from "./creer-classe-modal";
import type { MesClassesViewProps } from "./mes-classes-utils";
import {
  PAGE_BG,
  PRIMARY,
  BORDER_TERTIARY,
  GOLD,
  formatClassCode,
  shortBadgeLabel,
  masteryColors,
  badgePalette,
} from "./mes-classes-utils";

export function MesClassesView({
  rows,
  totalDistinctStudents,
  initialOpenCreerModal,
  allLanguages,
}: MesClassesViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<"tous" | string>("tous");

  const levelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const s = r.schoolLevel?.trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [rows]);

  const filteredRows =
    levelFilter === "tous"
      ? rows
      : rows.filter((r) => (r.schoolLevel?.trim() ?? "") === levelFilter);

  useEffect(() => {
    if (levelFilter !== "tous" && !levelOptions.includes(levelFilter)) {
      setLevelFilter("tous");
    }
  }, [levelFilter, levelOptions]);

  useEffect(() => {
    if (initialOpenCreerModal) {
      setModalOpen(true);
      router.replace("/app/professeur/classes", { scroll: false });
    }
  }, [initialOpenCreerModal, router]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  function openModal() {
    setModalOpen(true);
  }

  function handleCreated() {
    router.refresh();
    setToast("Classe créée ✓");
  }

  const hasClasses = rows.length > 0;

  return (
    <>
      <div
        className="min-h-full w-full -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:-my-10 sm:px-6 sm:py-10"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="mx-auto max-w-[1100px]">
          <Link
            href="/app/professeur"
            className="inline-flex items-center gap-1 no-underline"
            style={{
              width: "fit-content",
              marginBottom: 14,
              fontSize: 12,
              color: "var(--foreground-muted)",
            }}
          >
            <ChevronLeft size={14} strokeWidth={2} aria-hidden />
            Retour à l&apos;accueil
          </Link>

          <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                Mes classes
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "var(--foreground-muted)",
                }}
              >
                {hasClasses
                  ? `${rows.length} classe${rows.length > 1 ? "s" : ""} · ${totalDistinctStudents} élève${totalDistinctStudents > 1 ? "s" : ""} au total`
                  : "Créez et gérez vos classes de vocabulaire."}
              </p>
            </div>
            <button
              type="button"
              data-tour="creer-classe"
              onClick={openModal}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border-0"
              style={{
                background: PRIMARY,
                color: "white",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Plus size={12} stroke="white" strokeWidth={2} aria-hidden />
              Créer une classe
            </button>
          </header>

          {hasClasses ? (
            <div
              className="mb-5 sm:mb-6"
              style={{
                maxWidth: "100%",
              }}
            >
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{
                  WebkitOverflowScrolling: "touch",
                  flexWrap: "nowrap",
                }}
                role="tablist"
                aria-label="Filtrer par niveau scolaire"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={levelFilter === "tous"}
                  onClick={() => setLevelFilter("tous")}
                  className="shrink-0 border-solid transition-colors"
                  style={{
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border:
                      levelFilter === "tous" ? "1px solid #6C3FC8" : "1px solid var(--border)",
                    background: levelFilter === "tous" ? "#6C3FC8" : "white",
                    color: levelFilter === "tous" ? "white" : "var(--foreground)",
                  }}
                >
                  Tous
                </button>
                {levelOptions.map((level) => {
                  const selected = levelFilter === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setLevelFilter(level)}
                      className="shrink-0 border-solid transition-colors"
                      style={{
                        borderRadius: 20,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        border: selected ? "1px solid #6C3FC8" : "1px solid var(--border)",
                        background: selected ? "#6C3FC8" : "white",
                        color: selected ? "white" : "var(--foreground)",
                        maxWidth: "min(100%, 220px)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={level}
                    >
                      {shortBadgeLabel(level, 24)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!hasClasses ? (
            <div
              style={{
                background: "white",
                border: "1.5px dashed var(--border)",
                borderRadius: 14,
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <div
                className="mx-auto flex items-center justify-center"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#F0EDF8",
                  marginBottom: 14,
                }}
              >
                <Users size={24} stroke={PRIMARY} strokeWidth={2} aria-hidden />
              </div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  margin: "0 0 6px",
                  color: "var(--foreground)",
                }}
              >
                Aucune classe pour l&apos;instant
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--foreground-muted)",
                  lineHeight: 1.6,
                  maxWidth: 320,
                  margin: "0 auto 20px",
                }}
              >
                Créez votre première classe pour commencer. Vous obtiendrez un
                identifiant unique à partager avec vos élèves.
              </p>
              <button
                type="button"
                onClick={openModal}
                className="inline-flex cursor-pointer items-center gap-1.5 border-0"
                style={{
                  background: PRIMARY,
                  color: "white",
                  borderRadius: 20,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <Plus size={13} stroke="white" strokeWidth={2} aria-hidden />
                Créer ma première classe
              </button>
            </div>
          ) : (
            <>
              {filteredRows.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--foreground-muted)",
                    margin: "0 0 16px",
                  }}
                >
                  Aucune classe pour ce niveau.
                </p>
              ) : null}
              <ul
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{ gap: 12, listStyle: "none", padding: 0, margin: 0 }}
              >
                {filteredRows.map((cls, index) => {
                const badge = badgePalette(index);
                const mc = masteryColors(cls.masteryPct);
                const levelLabel = cls.schoolLevel?.trim() ?? "";
                return (
                  <li key={cls.id}>
                    <article
                      className="border-[0.5px] border-solid transition-all duration-150 hover:-translate-y-0.5 hover:border-[#DDD6F5]"
                      style={{
                        background: "white",
                        borderColor: BORDER_TERTIARY,
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      <div
                        className="flex w-full items-start gap-2"
                        style={{ marginBottom: 4 }}
                      >
                        {levelLabel ? (
                          <span
                            className="min-w-0"
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              padding: "3px 10px",
                              borderRadius: 10,
                              background: badge.bg,
                              color: badge.color,
                              maxWidth: "70%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={levelLabel}
                          >
                            {shortBadgeLabel(levelLabel)}
                          </span>
                        ) : null}
                        <div className="ml-auto shrink-0">
                          <ClasseCardMenu classId={cls.id} />
                        </div>
                      </div>
                      <h2
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          margin: "0 0 4px",
                          color: "var(--foreground)",
                        }}
                      >
                        {cls.title}
                      </h2>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--foreground-muted)",
                          margin: "0 0 12px",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {formatClassCode(cls.identifier)}
                      </p>
                      <div className="flex" style={{ gap: 12, marginBottom: 12 }}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center justify-center"
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 5,
                              background: "#F0EDF8",
                            }}
                          >
                            <Users
                              size={10}
                              stroke={PRIMARY}
                              strokeWidth={2}
                              aria-hidden
                            />
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--foreground-muted)",
                            }}
                          >
                            {cls.studentCount} élève
                            {cls.studentCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center justify-center"
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 5,
                              background: "#FEF3DC",
                            }}
                          >
                            <FileText
                              size={10}
                              stroke={GOLD}
                              strokeWidth={2}
                              aria-hidden
                            />
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--foreground-muted)",
                            }}
                          >
                            {cls.listCount} liste{cls.listCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div
                          className="flex justify-between"
                          style={{ marginBottom: 4 }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--foreground-muted)",
                            }}
                          >
                            Maîtrise moyenne
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: mc.text,
                            }}
                          >
                            {cls.masteryPct}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: "#F0EDF8",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, Math.max(0, cls.masteryPct))}%`,
                              background: mc.fill,
                              borderRadius: 3,
                              transition: "width 0.2s ease",
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex" style={{ gap: 6 }}>
                        <Link
                          href={`/app/professeur/classes/${cls.id}/progression`}
                          className="inline-flex flex-1 items-center justify-center gap-1 no-underline"
                          style={{
                            background: PRIMARY,
                            color: "white",
                            borderRadius: 16,
                            border: "none",
                            padding: 7,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          <Activity
                            size={10}
                            stroke="white"
                            strokeWidth={2}
                            aria-hidden
                          />
                          Voir la progression
                        </Link>
                        <Link
                          href={`/app/professeur/classes/${cls.id}`}
                          className="inline-flex items-center justify-center no-underline"
                          style={{
                            padding: "7px 12px",
                            borderRadius: 16,
                            border: "0.5px solid var(--border)",
                            background: "transparent",
                            color: "var(--foreground-muted)",
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          Gérer
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  onClick={openModal}
                  className="flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center border-solid transition-colors duration-150 hover:bg-[var(--background-subtle)]"
                  style={{
                    gap: 8,
                    background: "transparent",
                    border: "1.5px dashed var(--border)",
                    borderRadius: 14,
                  }}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#F0EDF8",
                      fontSize: 20,
                      color: PRIMARY,
                      fontWeight: 500,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--foreground-muted)",
                    }}
                  >
                    Nouvelle classe
                  </span>
                </button>
              </li>
            </ul>
            </>
          )}
        </div>
      </div>

      <CreerClasseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreated}
        allLanguages={allLanguages}
      />

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2.5 text-[13px] font-medium shadow-lg"
          style={{
            background: PRIMARY,
            color: "white",
          }}
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  );
}
