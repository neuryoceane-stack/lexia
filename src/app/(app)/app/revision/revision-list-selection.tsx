"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, CreditCard, Lock, Pencil, Zap, Rocket, ArrowRight } from "lucide-react";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  toIso6391,
} from "@/lib/language";
import { LanguagePill } from "./revision-ui";

/** Coche de sélection demandée pour cette page (hors charte encre). */
const SELECT_PURPLE = "#6C3FC8";
const SELECT_BG = "color-mix(in srgb, #6C3FC8 12%, white)";

const VIOLET = "var(--ink)";
const GOLD = "var(--ink)";
const BORDER_TERTIARY = "var(--line)";
const BORDER_SECONDARY = "var(--line)";

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

function isoCode(code: string): string {
  return toIso6391(code).toUpperCase();
}

function PillGroup({ codes }: { codes: string[] }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {codes.map((code, index) => (
        <span key={code} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <span className="text-xs text-muted" aria-hidden>
              ·
            </span>
          ) : null}
          <LanguagePill code={isoCode(code)} />
        </span>
      ))}
    </span>
  );
}

/** Le français est toujours d’un côté. `frenchFirst` = carte 2 (ancien « Traduction → Mot »). */
function SenseDirectionMarks({
  studied,
  frenchFirst,
}: {
  studied: string[];
  frenchFirst: boolean;
}) {
  const french = <LanguagePill code={isoCode("fra")} />;
  const studiedMarks = <PillGroup codes={studied} />;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {frenchFirst ? french : studiedMarks}
      <ArrowRight size={14} strokeWidth={2} color={BORDER_TERTIARY} aria-hidden />
      {frenchFirst ? studiedMarks : french}
    </span>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]"
      style={{
        borderColor: selected ? SELECT_PURPLE : "var(--line)",
        background: "transparent",
      }}
      aria-hidden
    >
      {selected ? <Check size={12} stroke={SELECT_PURPLE} strokeWidth={3} /> : null}
    </span>
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
          {selectedLang ? (
            <>
              {" · "}
              <span className="inline-flex items-center gap-1.5">
                <LanguagePill code={isoCode(selectedLang)} />
                {labelSource}
              </span>
            </>
          ) : null}
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
      className={`inline-flex items-center justify-center gap-2 border-none font-medium text-surface ${className}`}
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
        if (!cancelled) setError("Impossible de charger vos listes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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

  const studiedLanguages = useMemo(() => {
    const selectedLists = lists.filter((list) => selected.has(list.id));
    const source =
      selectedLists.length > 0
        ? selectedLists.map((list) => normLang(list.language))
        : langFilter !== "all"
          ? [normLang(langFilter)]
          : lists.map((list) => normLang(list.language));
    const unique = [...new Set(source)];
    const studied = unique.filter((code) => code !== "fra").sort();
    return (studied.length > 0 ? studied : unique.sort());
  }, [lists, selected, langFilter]);

  const labelSource = languageLabel(previewListLang);

  const selectedLanguageCount = useMemo(() => {
    const codes = new Set<string>();
    for (const list of lists) {
      if (selected.has(list.id)) codes.add(normLang(list.language));
    }
    return codes.size;
  }, [lists, selected]);
  const severalLanguages = selectedLanguageCount > 1;
  const severalStudied = studiedLanguages.length !== 1;
  const studiedLabel = severalStudied
    ? "Langue étudiée"
    : languageLabel(studiedLanguages[0] ?? "");

  const lockBannerLang = selectedLang ? labelSource : "";
  const isFlashcardMode = mode === "flashcard";
  const senseAccent = isFlashcardMode ? VIOLET : GOLD;
  const senseSectionLabel = isFlashcardMode
    ? "Sens des flashcards"
    : "Sens de la dictée";
  const senseSub1 = isFlashcardMode
    ? "Le mot s'affiche, vous retrouvez la traduction"
    : "Vous voyez le mot, vous écrivez la traduction";
  const senseSub2 = isFlashcardMode
    ? "La traduction s'affiche, vous retrouvez le mot"
    : "Vous voyez la traduction, vous écrivez le mot";
  const senseTitle1 = `${studiedLabel} → Français`;
  const senseTitle2 = `Français → ${studiedLabel}`;

  const showMobileLaunchBar = selected.size > 0;

  return (
    <div
      className={`min-h-full w-full -my-8 py-8 sm:-my-10 sm:py-10 md:pb-10 ${
        showMobileLaunchBar
          ? "max-md:pb-[calc(76px+9.5rem+env(safe-area-inset-bottom,0px))]"
          : "max-md:pb-[calc(76px+2rem+env(safe-area-inset-bottom,0px))]"
      }`}
      style={{ maxWidth: "100%" }}
    >
      <div className="mx-auto w-full max-w-2xl">
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
                selectedLang={severalLanguages ? null : selectedLang}
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
          Sélectionnez une ou plusieurs listes pour lancer votre session.
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
              background: langFilter === "all" ? "var(--background-subtle)" : "white",
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
                  background: active ? "var(--background-subtle)" : "white",
                  color: active ? VIOLET : "var(--foreground-muted)",
                  borderColor: active ? BORDER_TERTIARY : BORDER_SECONDARY,
                }}
              >
                {languageLabel(code)}
              </button>
            );
          })}
        </div>

        {/* Sens : carte 1 = term_to_def, carte 2 = def_to_term. Seul l’affichage change. */}
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
              aria-pressed={revisionDirection === "term_to_def"}
              className="flex flex-1 cursor-pointer items-center gap-2.5 border-[1.5px] py-2.5 pr-3 pl-3.5 text-left transition-colors"
              style={{
                borderRadius: 10,
                padding: "10px 14px",
                gap: 10,
                borderColor:
                  revisionDirection === "term_to_def"
                    ? SELECT_PURPLE
                    : BORDER_TERTIARY,
                background:
                  revisionDirection === "term_to_def" ? SELECT_BG : "white",
              }}
            >
              <SelectionMark selected={revisionDirection === "term_to_def"} />
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <SenseDirectionMarks studied={studiedLanguages} frenchFirst={false} />
                <div className="min-w-0">
                  <div
                    style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}
                  >
                    {senseTitle1}
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
              aria-pressed={revisionDirection === "def_to_term"}
              className="flex flex-1 cursor-pointer items-center gap-2.5 border-[1.5px] py-2.5 pr-3 pl-3.5 text-left transition-colors"
              style={{
                borderRadius: 10,
                padding: "10px 14px",
                gap: 10,
                borderColor:
                  revisionDirection === "def_to_term"
                    ? SELECT_PURPLE
                    : BORDER_TERTIARY,
                background:
                  revisionDirection === "def_to_term" ? SELECT_BG : "white",
              }}
            >
              <SelectionMark selected={revisionDirection === "def_to_term"} />
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <SenseDirectionMarks studied={studiedLanguages} frenchFirst />
                <div className="min-w-0">
                  <div
                    style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground)" }}
                  >
                    {senseTitle2}
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
              background: "var(--surface)",
              border: "0.5px solid var(--line)",
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
                color: "var(--ink)",
                lineHeight: 1.5,
              }}
            >
              Vous avez sélectionné une liste en {lockBannerLang} — seules les
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
          Vos listes
        </p>

        {error && (
          <p className="mb-3 text-sm text-false-text" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p style={{ color: "var(--foreground-muted)" }}>Chargement…</p>
        ) : filteredLists.length === 0 ? (
          <p style={{ color: "var(--foreground-muted)" }}>
            Aucune liste à afficher. Créez des listes dans la bibliothèque.
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
                    aria-pressed={isSelected}
                    className="flex w-full items-center gap-3 border-[1.5px] text-left transition-all duration-[120ms]"
                    style={{
                      alignItems: "center",
                      gap: 12,
                      padding: "13px 14px",
                      background: locked
                        ? "var(--background-subtle)"
                        : isSelected
                          ? SELECT_BG
                          : "white",
                      borderRadius: 12,
                      borderColor:
                        isSelected && !locked ? SELECT_PURPLE : BORDER_TERTIARY,
                      cursor: locked ? "not-allowed" : "pointer",
                      opacity: locked ? 0.4 : 1,
                      pointerEvents: locked ? "none" : "auto",
                    }}
                  >
                    <SelectionMark selected={isSelected && !locked} />
                    <LanguagePill code={isoCode(normLang(list.language))} />
                    <div className="min-w-0 flex-1">
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: isSelected ? "var(--ink)" : "var(--foreground)",
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

      {/* Barre mobile — juste au-dessus de la navigation basse, marges 16px */}
      {showMobileLaunchBar ? (
        <div
          className="fixed left-4 right-4 z-40 pointer-events-none md:hidden"
          style={{
            bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div
            className="pointer-events-auto rounded-[16px] border-[1.5px] border-line bg-surface shadow-sm"
            style={{ padding: "12px 16px" }}
          >
            <div className="mb-2.5">
              <SelectionRecap
                selectedCount={selected.size}
                selectedLang={severalLanguages ? null : selectedLang}
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
      ) : null}
    </div>
  );
}
