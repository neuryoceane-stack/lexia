"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, CreditCard, Lock, Pencil, Zap, Rocket, ArrowRight } from "lucide-react";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  getFlagEmoji,
} from "@/lib/language";

const VIOLET = "#6C3FC8";
const GOLD = "#F5A623";
const BORDER_TERTIARY = "#DDD6F5";
const BORDER_SECONDARY = "#E2DCF5";

type RevisionListRow = {
  id: string;
  name: string;
  language: string | null;
  wordCount: number;
  sm2MasteryPct: number;
  sm2MasteredCount: number;
  dueTodayCount: number;
};

function normLang(code: string | null | undefined): string {
  const s = code?.trim().toLowerCase() || "";
  return s || "fra";
}

function languageLabel(code: string | null): string {
  const n = normLang(code);
  return PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === n)?.label ?? n.toUpperCase();
}

function SenseDirectionFlags({
  fromLang,
  toLang,
}: {
  fromLang: string;
  toLang: string;
}) {
  return (
    <>
      <span className="text-base leading-none" aria-hidden>
        {getFlagEmoji(fromLang)}
      </span>
      <ArrowRight
        size={14}
        strokeWidth={2}
        color={BORDER_TERTIARY}
        aria-hidden
      />
      <span className="text-base leading-none" aria-hidden>
        {getFlagEmoji(toLang)}
      </span>
    </>
  );
}

type Props = {
  mode: "flashcard" | "dictee";
  /** Pré-sélection depuis l’URL (`?listIds=`) */
  initialListIds: string[];
};

function SelectionRecap({
  selectedCount,
  selectedLang,
  labelSource,
}: {
  selectedCount: number;
  selectedLang: string | null;
  labelSource: string;
}) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "var(--foreground-muted)",
        lineHeight: 1.45,
        margin: 0,
      }}
    >
      {selectedCount === 0 ? (
        "Aucune liste sélectionnée"
      ) : (
        <>
          <span style={{ fontWeight: 500, color: VIOLET }}>
            {selectedCount} liste{selectedCount !== 1 ? "s" : ""}{" "}
            sélectionnée{selectedCount !== 1 ? "s" : ""}
          </span>
          {" · "}
          <span className="inline-flex items-center gap-1">
            <span className="text-base leading-none">
              {getFlagEmoji(selectedLang ?? "fra")}
            </span>
            {labelSource}
          </span>
        </>
      )}
    </p>
  );
}

function LaunchSessionButton({
  disabled,
  onClick,
  className = "",
}: {
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 border-none font-medium text-white ${className}`}
      style={{
        background: VIOLET,
        borderRadius: 20,
        padding: "10px 24px",
        fontSize: 13,
        fontWeight: 500,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      <Zap size={13} stroke="white" strokeWidth={2.5} aria-hidden />
      Lancer la session
    </button>
  );
}

export function RevisionListSelection({ mode, initialListIds }: Props) {
  const router = useRouter();
  const basePath =
    mode === "flashcard" ? "/app/revision/flashcards" : "/app/revision/dictee";

  const [lists, setLists] = useState<RevisionListRow[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [langFilter, setLangFilter] = useState<string | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialListIds)
  );
  const [revisionDirection, setRevisionDirection] = useState<
    "term_to_def" | "def_to_term"
  >("term_to_def");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(["fra"]);

  useEffect(() => {
    setSelected(new Set(initialListIds));
  }, [initialListIds.join(",")]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch("/api/bibliotheque")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.lists) {
          setLists([]);
          setLanguages([]);
          return;
        }
        const raw = data.lists as Record<string, unknown>[];
        setLists(
          raw.map((l) => ({
            id: String(l.id),
            name: String(l.name),
            language: (l.language as string | null) ?? null,
            wordCount: Number(l.wordCount) || 0,
            sm2MasteryPct: Number(l.sm2MasteryPct) || 0,
            sm2MasteredCount: Number(l.sm2MasteredCount) || 0,
            dueTodayCount: Number(l.dueTodayCount) || 0,
          }))
        );
        setLanguages(
          Array.isArray(data.languages)
            ? (data.languages as string[])
            : []
        );
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger tes listes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.preferredLanguages) && data.preferredLanguages.length) {
          setPreferredLanguages(
            data.preferredLanguages.map((code: string) => normLang(code))
          );
        } else if (data.preferredLanguage) {
          setPreferredLanguages(
            [data.preferredLanguage, data.preferredLanguage2]
              .filter(Boolean)
              .map((code: string) => normLang(code))
          );
        }
      })
      .catch(() => {});
  }, []);

  const selectedLang =
    selected.size > 0
      ? normLang(lists.find((l) => selected.has(l.id))?.language)
      : null;

  const filteredLists = useMemo(() => {
    if (langFilter === "all") return lists;
    return lists.filter((l) => normLang(l.language) === langFilter);
  }, [lists, langFilter]);

  function isLocked(list: RevisionListRow): boolean {
    if (!selectedLang) return false;
    return normLang(list.language) !== selectedLang;
  }

  function toggleList(id: string) {
    const list = lists.find((l) => l.id === id);
    if (!list || isLocked(list)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function launchSession() {
    if (selected.size === 0) return;
    const q = new URLSearchParams();
    q.set("listIds", [...selected].join(","));
    q.set("session", "1");
    q.set("direction", revisionDirection);
    router.push(`${basePath}?${q.toString()}`);
  }

  const previewListLang = useMemo(() => {
    if (selectedLang) return selectedLang;
    if (langFilter !== "all") return normLang(langFilter);
    if (languages.length > 0) return normLang(languages[0]);
    return "eng";
  }, [selectedLang, langFilter, languages]);

  const previewTranslationLang = useMemo(() => {
    const fra = preferredLanguages.find((l) => normLang(l) === "fra");
    if (fra && normLang(previewListLang) !== "fra") return "fra";
    const other = preferredLanguages.find(
      (l) => normLang(l) !== normLang(previewListLang)
    );
    return other ?? "fra";
  }, [preferredLanguages, previewListLang]);

  const labelSource = languageLabel(previewListLang);

  const lockBannerLang = selectedLang ? labelSource : "";
  const isFlashcardMode = mode === "flashcard";
  const senseAccent = isFlashcardMode ? VIOLET : GOLD;
  const senseSelectedBg = isFlashcardMode ? "#F0EDF8" : "#FEF8EC";
  const senseSectionLabel = isFlashcardMode
    ? "Sens des flashcards"
    : "Sens de la dictée";
  const senseSub1 = isFlashcardMode
    ? "On affiche le mot, tu retrouves la traduction"
    : "Tu écris la traduction";
  const senseSub2 = isFlashcardMode
    ? "On affiche la traduction, tu retrouves le mot"
    : "Tu écris le mot";

  return (
    <div
      className="min-h-full w-full -mx-4 -my-8 py-8 pb-32 sm:-mx-6 sm:-my-10 sm:py-10 md:pb-10"
      style={{ maxWidth: "100%" }}
    >
      <div
        className="mx-auto w-full max-w-2xl"
        style={{ maxWidth: "100%", padding: "0 16px" }}
      >
        <Link
          href="/app/evaluation"
          className="mb-4 inline-flex w-fit items-center gap-1 no-underline"
          style={{ fontSize: 12, color: "var(--foreground-muted)", marginBottom: 16 }}
        >
          <ChevronLeft size={14} strokeWidth={2} className="shrink-0" aria-hidden />
          Retour
        </Link>

        <div
          className="flex items-center"
          style={{ gap: 8, marginBottom: 12 }}
          aria-label={isFlashcardMode ? "Mode Flashcards" : "Mode Dictée"}
        >
          {mode === "flashcard" ? (
            <>
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: VIOLET,
                  borderRadius: "50%",
                }}
              >
                <CreditCard size={15} stroke="white" strokeWidth={2} aria-hidden />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: VIOLET }}>
                Flashcards
              </span>
            </>
          ) : (
            <>
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  background: GOLD,
                  borderRadius: "50%",
                }}
              >
                <Pencil size={15} stroke="white" strokeWidth={2} aria-hidden />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: GOLD }}>
                Dictée
              </span>
            </>
          )}
        </div>

        <div className="mb-1 flex flex-col gap-3 md:mb-2 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="min-w-0 flex-1">
            <h1
              className="inline-flex items-center gap-2"
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              <span>On révise quoi aujourd&apos;hui ?</span>
              <Rocket size={20} strokeWidth={2} color={senseAccent} aria-hidden />
            </h1>
            <div className="mt-1.5 hidden md:block">
              <SelectionRecap
                selectedCount={selected.size}
                selectedLang={selectedLang}
                labelSource={labelSource}
              />
            </div>
          </div>
          <LaunchSessionButton
            disabled={selected.size === 0}
            onClick={launchSession}
            className="hidden shrink-0 md:inline-flex"
          />
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--foreground-muted)",
            marginBottom: 18,
            marginTop: 4,
          }}
        >
          Sélectionne une ou plusieurs listes pour lancer ta session.
        </p>

        {/* Filtres langue */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ marginBottom: 14 }}
        >
          <button
            type="button"
            onClick={() => setLangFilter("all")}
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors"
            style={{
              fontWeight: langFilter === "all" ? 500 : 400,
              background: langFilter === "all" ? "#F0EDF8" : "white",
              color: langFilter === "all" ? VIOLET : "var(--foreground-muted)",
              borderColor: langFilter === "all" ? BORDER_TERTIARY : BORDER_SECONDARY,
            }}
          >
            Toutes
          </button>
          {languages.map((code) => {
            const active = langFilter === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLangFilter(code)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors"
                style={{
                  fontWeight: active ? 500 : 400,
                  background: active ? "#F0EDF8" : "white",
                  color: active ? VIOLET : "var(--foreground-muted)",
                  borderColor: active ? BORDER_TERTIARY : BORDER_SECONDARY,
                }}
              >
                {languageLabel(code)}
              </button>
            );
          })}
        </div>

        {/* Sens : flashcards (violet) ou dictée (or) */}
        <div style={{ marginBottom: 14 }}>
          <p
            className="mb-2 font-medium tracking-wide uppercase"
            style={{
              fontSize: 11,
              color: "var(--foreground-muted)",
              letterSpacing: "0.05em",
            }}
          >
            {senseSectionLabel}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={() => setRevisionDirection("term_to_def")}
              className="flex flex-1 cursor-pointer items-center gap-2.5 border-[1.5px] bg-white py-2.5 pr-3 pl-3.5 text-left transition-colors"
              style={{
                borderRadius: 10,
                padding: "10px 14px",
                gap: 10,
                borderColor:
                  revisionDirection === "term_to_def"
                    ? senseAccent
                    : BORDER_TERTIARY,
                background:
                  revisionDirection === "term_to_def"
                    ? senseSelectedBg
                    : "white",
              }}
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-full border-[1.5px]"
                style={{
                  width: 18,
                  height: 18,
                  borderColor:
                    revisionDirection === "term_to_def"
                      ? senseAccent
                      : BORDER_SECONDARY,
                  background:
                    revisionDirection === "term_to_def"
                      ? senseAccent
                      : "transparent",
                }}
              >
                {revisionDirection === "term_to_def" && (
                  <Check size={9} stroke="white" strokeWidth={3} aria-hidden />
                )}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <SenseDirectionFlags
                  fromLang={previewListLang}
                  toLang={previewTranslationLang}
                />
                <div className="min-w-0">
                  <div
                    style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}
                  >
                    Mot → Traduction
                  </div>
                  <div
                    style={{ fontSize: 10, color: "var(--foreground-muted)" }}
                  >
                    {senseSub1}
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRevisionDirection("def_to_term")}
              className="flex flex-1 cursor-pointer items-center gap-2.5 border-[1.5px] bg-white py-2.5 pr-3 pl-3.5 text-left transition-colors"
              style={{
                borderRadius: 10,
                padding: "10px 14px",
                gap: 10,
                borderColor:
                  revisionDirection === "def_to_term"
                    ? senseAccent
                    : BORDER_TERTIARY,
                background:
                  revisionDirection === "def_to_term"
                    ? senseSelectedBg
                    : "white",
              }}
            >
              <span
                className="flex shrink-0 items-center justify-center rounded-full border-[1.5px]"
                style={{
                  width: 18,
                  height: 18,
                  borderColor:
                    revisionDirection === "def_to_term"
                      ? senseAccent
                      : BORDER_SECONDARY,
                  background:
                    revisionDirection === "def_to_term"
                      ? senseAccent
                      : "transparent",
                }}
              >
                {revisionDirection === "def_to_term" && (
                  <Check size={9} stroke="white" strokeWidth={3} aria-hidden />
                )}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <SenseDirectionFlags
                  fromLang={previewTranslationLang}
                  toLang={previewListLang}
                />
                <div className="min-w-0">
                  <div
                    style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}
                  >
                    Traduction → Mot
                  </div>
                  <div
                    style={{ fontSize: 10, color: "var(--foreground-muted)" }}
                  >
                    {senseSub2}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Bannière langue verrouillée */}
        {selected.size > 0 && selectedLang && (
          <div
            className="mb-3 flex items-center gap-2.5"
            style={{
              background: "#FEF8EC",
              border: "0.5px solid #F5D08A",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 12,
            }}
          >
            <Lock size={14} stroke={GOLD} strokeWidth={2} className="shrink-0" aria-hidden />
            <p
              className="min-w-0 flex-1"
              style={{
                fontSize: 12,
                color: "#92640A",
                lineHeight: 1.5,
              }}
            >
              Tu as sélectionné une liste en {lockBannerLang} — seules les
              autres listes en {lockBannerLang} sont disponibles.
            </p>
            <button
              type="button"
              onClick={clearSelection}
              className="shrink-0 cursor-pointer border-none bg-transparent underline"
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: GOLD,
              }}
            >
              Tout effacer
            </button>
          </div>
        )}

        <p
          className="mb-2.5 font-medium uppercase tracking-wide"
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.05em",
            color: "var(--foreground-muted)",
            marginBottom: 10,
          }}
        >
          Tes listes
        </p>

        {error && (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p style={{ color: "var(--foreground-muted)" }}>Chargement…</p>
        ) : filteredLists.length === 0 ? (
          <p style={{ color: "var(--foreground-muted)" }}>
            Aucune liste à afficher. Crée des listes dans la bibliothèque.
          </p>
        ) : (
          <ul className="space-y-0">
            {filteredLists.map((list) => {
              const locked = isLocked(list);
              const isSelected = selected.has(list.id);
              const hasDue = list.dueTodayCount > 0;
              const pctColor = hasDue ? GOLD : VIOLET;
              return (
                <li key={list.id} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => toggleList(list.id)}
                    className="flex w-full items-center gap-3 border-[1.5px] text-left transition-all duration-[120ms]"
                    style={{
                      alignItems: "center",
                      gap: 12,
                      padding: "13px 14px",
                      background: locked
                        ? "var(--background-subtle)"
                        : "white",
                      borderRadius: 12,
                      borderColor: isSelected ? VIOLET : BORDER_TERTIARY,
                      cursor: locked ? "not-allowed" : "pointer",
                      opacity: locked ? 0.4 : 1,
                      pointerEvents: locked ? "none" : "auto",
                      ...(isSelected && !locked
                        ? { background: "#F0EDF8" }
                        : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (locked || isSelected) return;
                      e.currentTarget.style.borderColor = BORDER_TERTIARY;
                    }}
                    onMouseLeave={(e) => {
                      if (isSelected) {
                        e.currentTarget.style.borderColor = VIOLET;
                      } else {
                        e.currentTarget.style.borderColor = BORDER_TERTIARY;
                      }
                    }}
                  >
                    <span
                      className="flex shrink-0 items-center justify-center rounded-full border-[1.5px]"
                      style={{
                        width: 20,
                        height: 20,
                        borderColor: isSelected ? VIOLET : BORDER_SECONDARY,
                        background: isSelected ? VIOLET : "transparent",
                      }}
                    >
                      {isSelected && (
                        <Check size={10} stroke="white" strokeWidth={3} aria-hidden />
                      )}
                    </span>
                    <span className="text-base leading-none" style={{ fontSize: 16 }}>
                      {getFlagEmoji(normLang(list.language))}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: isSelected ? "#4B3A9E" : "var(--foreground)",
                        }}
                      >
                        {list.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--foreground-muted)" }}
                      >
                        {list.wordCount} mot{list.wordCount !== 1 ? "s" : ""} ·{" "}
                        {languageLabel(list.language)}
                      </div>
                    </div>
                    {locked ? (
                      <Lock
                        size={13}
                        className="shrink-0 text-[var(--foreground-muted)]"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ) : (
                      <div className="shrink-0 text-right">
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: pctColor,
                          }}
                        >
                          {list.sm2MasteryPct}%
                        </div>
                        <div
                          style={{ fontSize: 10, color: "var(--foreground-muted)" }}
                        >
                          {hasDue
                            ? `${list.dueTodayCount} dus aujourd’hui`
                            : `${list.sm2MasteredCount} maîtrisés`}
                        </div>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Barre mobile — fixe en bas, dégagement bulle de support à droite */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none md:hidden"
        style={{
          paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
          paddingRight: "max(80px, env(safe-area-inset-right, 0px))",
        }}
      >
        <div
          className="pointer-events-auto border-t bg-white"
          style={{
            borderTop: `0.5px solid ${BORDER_TERTIARY}`,
            padding: "12px 16px",
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="mb-2.5">
            <SelectionRecap
              selectedCount={selected.size}
              selectedLang={selectedLang}
              labelSource={labelSource}
            />
          </div>
          <LaunchSessionButton
            disabled={selected.size === 0}
            onClick={launchSession}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
