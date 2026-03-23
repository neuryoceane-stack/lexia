"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Zap,
  ChevronDown,
  CreditCard,
  Pencil,
  Search,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import type { ListWordSm2Status } from "@/lib/list-word-sm2";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  KNOWN_LANGUAGE_CODES,
  getFlagEmoji,
} from "@/lib/language";

const VIOLET = "#6C3FC8";
const GOLD = "#F5A623";
const GREEN = "#1D9E75";
const BORDER_SECONDARY = "#E2DCF5";
const BORDER_TERTIARY = "#DDD6F5";
const BANNER_BG = "#F0EDF8";
const RED_BORDER = "#F09595";
const RED_TEXT = "#E24B4A";
const DOT_NEW = "#DDD6F5";

export type MotWithSm2 = {
  id: string;
  term: string;
  definition: string;
  rank: number;
  sm2Status: ListWordSm2Status;
};

type StatusFilter = "all" | ListWordSm2Status;

function normalizeListLang(code: string | null): string {
  if (code && KNOWN_LANGUAGE_CODES.has(code)) return code;
  return "fra";
}

function statusDotColor(s: ListWordSm2Status): string {
  if (s === "mastered") return GREEN;
  if (s === "progress") return GOLD;
  return DOT_NEW;
}

export function MotsClient({
  listId,
  listName,
  initialListLanguage,
  initialMots,
  masteryPct,
  stats,
  canEdit,
}: {
  listId: string;
  listName: string;
  initialListLanguage: string | null;
  initialMots: MotWithSm2[];
  masteryPct: number;
  stats: { mastered: number; progress: number; new: number };
  canEdit: boolean;
}) {
  const router = useRouter();
  const [mots, setMots] = useState<MotWithSm2[]>(initialMots);
  const [displayName, setDisplayName] = useState(listName);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(listName);
  const [listLangCode, setListLangCode] = useState(() =>
    normalizeListLang(initialListLanguage)
  );
  const [langOpen, setLangOpen] = useState(false);
  const [langSaving, setLangSaving] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDef, setEditDef] = useState("");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reviseOpen, setReviseOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const reviseRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const flagEmoji = getFlagEmoji(listLangCode) || "🌐";

  useEffect(() => {
    setMots(initialMots);
  }, [initialMots]);

  useEffect(() => {
    setDisplayName(listName);
    setTitleInput(listName);
  }, [listName]);

  useEffect(() => {
    setListLangCode(normalizeListLang(initialListLanguage));
  }, [initialListLanguage]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (!reviseOpen && !filterOpen && !langOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (reviseRef.current && !reviseRef.current.contains(t)) setReviseOpen(false);
      if (filterRef.current && !filterRef.current.contains(t)) setFilterOpen(false);
      if (langRef.current && !langRef.current.contains(t)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [reviseOpen, filterOpen, langOpen]);

  const filteredMots = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = mots.filter((m) => {
      if (!q) return true;
      return (
        m.term.toLowerCase().includes(q) ||
        m.definition.toLowerCase().includes(q)
      );
    });
    if (statusFilter !== "all") {
      arr = arr.filter((m) => m.sm2Status === statusFilter);
    }
    arr = [...arr].sort((a, b) =>
      sortAsc
        ? a.term.localeCompare(b.term, "fr", { sensitivity: "base" })
        : b.term.localeCompare(a.term, "fr", { sensitivity: "base" })
    );
    return arr;
  }, [mots, search, statusFilter, sortAsc]);

  const revisionBase = `/app/revision`;
  const flashcardsHref = `${revisionBase}/flashcards?listIds=${encodeURIComponent(listId)}`;
  const dicteeHref = `${revisionBase}/dictee?listIds=${encodeURIComponent(listId)}`;

  async function commitTitle() {
    const t = titleInput.trim();
    setEditingTitle(false);
    if (!t || t === displayName) {
      setTitleInput(displayName);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/listes/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: t }),
      });
      if (res.ok) {
        setDisplayName(t);
        router.refresh();
      } else {
        setTitleInput(displayName);
      }
    } finally {
      setLoading(false);
    }
  }

  async function setListLanguage(code: string) {
    setLangSaving(true);
    setLangOpen(false);
    try {
      const res = await fetch(`/api/listes/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: code || null }),
      });
      if (res.ok) {
        setListLangCode(normalizeListLang(code));
        router.refresh();
      }
    } finally {
      setLangSaving(false);
    }
  }

  async function addWord() {
    const term = newTerm.trim();
    if (!term) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listes/${listId}/mots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, definition: newDef.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoading(false);
        return;
      }
      setMots((prev) => [
        ...prev,
        {
          id: data.id,
          term: data.term,
          definition: data.definition,
          rank: data.rank ?? 0,
          sm2Status: "new" as const,
        },
      ]);
      setNewTerm("");
      setNewDef("");
      setAdding(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function updateWord(wordId: string, term: string, definition: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/mots/${wordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: term.trim(), definition: definition.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setMots((prev) =>
        prev.map((m) =>
          m.id === wordId
            ? { ...m, term: data.term, definition: data.definition }
            : m
        )
      );
      setEditingId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteWord(wordId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/mots/${wordId}`, { method: "DELETE" });
      if (!res.ok) return;
      setMots((prev) => prev.filter((m) => m.id !== wordId));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(m: MotWithSm2) {
    setEditingId(m.id);
    setEditTerm(m.term);
    setEditDef(m.definition);
  }

  function filterLabel() {
    switch (statusFilter) {
      case "mastered":
        return "Maîtrisés";
      case "progress":
        return "En cours";
      case "new":
        return "Nouveaux";
      default:
        return "Tous";
    }
  }

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-[14px] flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2" style={{ gap: 8 }}>
          {editingTitle && canEdit ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setTitleInput(displayName);
                  setEditingTitle(false);
                }
              }}
              className="min-w-0 max-w-full rounded-lg border border-[#DDD6F5] bg-white px-2 py-1 outline-none focus:ring-2 focus:ring-[#6C3FC8]/20"
              style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}
              aria-label="Nom de la liste"
            />
          ) : (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => canEdit && setEditingTitle(true)}
              className="group flex min-w-0 max-w-[min(100%,280px)] cursor-text items-center gap-1.5 rounded-lg border-none bg-transparent text-left transition-colors duration-150 sm:max-w-[min(100%,360px)]"
              style={{ borderRadius: 8, padding: "3px 6px", gap: 6 }}
              onMouseEnter={(e) => {
                if (canEdit) e.currentTarget.style.background = "#F0EDF8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="truncate"
                style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}
              >
                {displayName}
              </span>
              {canEdit && (
                <Pencil
                  size={13}
                  stroke={VIOLET}
                  strokeWidth={2}
                  className="shrink-0 opacity-[0.35] transition-opacity duration-150 group-hover:opacity-100"
                  aria-hidden
                />
              )}
            </button>
          )}

          <div ref={langRef} className="relative shrink-0">
            {canEdit ? (
              <>
                <button
                  type="button"
                  disabled={langSaving}
                  onClick={() => setLangOpen((o) => !o)}
                  className="inline-flex items-center gap-1 border transition-colors"
                  style={{
                    background: "#F0EDF8",
                    border: `0.5px solid ${BORDER_TERTIARY}`,
                    borderRadius: 20,
                    padding: "3px 8px 3px 5px",
                    gap: 4,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#DDD6F5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F0EDF8";
                  }}
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                >
                  <span className="leading-none" style={{ fontSize: 16 }}>
                    {flagEmoji}
                  </span>
                  <ChevronDown
                    size={10}
                    stroke={VIOLET}
                    strokeWidth={2}
                    className="opacity-60"
                    aria-hidden
                  />
                </button>
                {langOpen && (
                  <ul
                    className="absolute left-0 z-20 mt-1 max-h-64 overflow-auto rounded-xl border bg-white py-1 shadow-md"
                    style={{
                      borderColor: BORDER_SECONDARY,
                      minWidth: 180,
                    }}
                    role="listbox"
                  >
                    {PREFERRED_LANGUAGE_OPTIONS.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#F0EDF8]"
                          style={{
                            fontWeight: listLangCode === opt.value ? 600 : 400,
                          }}
                          onClick={() => setListLanguage(opt.value)}
                        >
                          <span className="text-base leading-none">
                            {getFlagEmoji(opt.value)}
                          </span>
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <span
                className="inline-flex items-center gap-1 border"
                style={{
                  background: "#F0EDF8",
                  border: `0.5px solid ${BORDER_TERTIARY}`,
                  borderRadius: 20,
                  padding: "3px 8px 3px 5px",
                  gap: 4,
                }}
                title="Langue de la liste"
              >
                <span className="leading-none" style={{ fontSize: 16 }}>
                  {flagEmoji}
                </span>
              </span>
            )}
          </div>
        </div>

        <div ref={reviseRef} className="relative flex shrink-0 items-center gap-2" style={{ gap: 8 }}>
          {canEdit && (
            <button
              type="button"
              onClick={() => setAdding((a) => !a)}
              className="inline-flex items-center gap-1.5 border-[1.5px] bg-transparent font-medium"
              style={{
                borderColor: VIOLET,
                color: VIOLET,
                borderRadius: 20,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Plus size={11} stroke={VIOLET} strokeWidth={2.5} aria-hidden />
              Ajouter
            </button>
          )}

          <button
            type="button"
            onClick={() => setReviseOpen((o) => !o)}
            className="inline-flex items-center gap-1 border-none font-medium text-white"
            style={{
              background: VIOLET,
              borderRadius: 20,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Zap size={11} stroke="white" strokeWidth={2.5} fill="none" aria-hidden />
            Réviser
            <ChevronDown size={10} stroke="white" strokeWidth={2.5} aria-hidden />
          </button>

          {reviseOpen && (
            <div
              className="absolute z-10 overflow-hidden bg-white"
              style={{
                top: "calc(100% + 6px)",
                right: 0,
                width: 160,
                borderRadius: 12,
                border: `0.5px solid ${BORDER_SECONDARY}`,
                boxShadow: "0 8px 24px rgba(108, 63, 200, 0.12)",
              }}
            >
              <Link
                href={flashcardsHref}
                className="flex cursor-pointer items-center gap-2.5 border-b py-[11px] pr-3 pl-3.5 no-underline transition-colors hover:bg-[#F0EDF8]"
                style={{ borderBottom: `0.5px solid ${BORDER_TERTIARY}` }}
                onClick={() => setReviseOpen(false)}
              >
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    background: "#F0EDF8",
                    borderRadius: 7,
                  }}
                >
                  <CreditCard size={14} stroke={VIOLET} strokeWidth={2} />
                </div>
                <span
                  className="font-medium"
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}
                >
                  Flashcards
                </span>
              </Link>
              <Link
                href={dicteeHref}
                className="flex cursor-pointer items-center gap-2.5 py-[11px] pr-3 pl-3.5 no-underline transition-colors hover:bg-[#F0EDF8]"
                onClick={() => setReviseOpen(false)}
              >
                <div
                  className="flex shrink-0 items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    background: "#FEF3DC",
                    borderRadius: 7,
                  }}
                >
                  <Pencil size={14} stroke="#C47D0A" strokeWidth={2} />
                </div>
                <span
                  className="font-medium"
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}
                >
                  Dictée
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bannière progression */}
      <div
        className="mb-[14px]"
        style={{
          background: BANNER_BG,
          border: `0.5px solid ${BORDER_TERTIARY}`,
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 14,
        }}
      >
        <div className="mb-1 flex justify-between gap-2">
          <span style={{ fontSize: 11, fontWeight: 500, color: VIOLET }}>
            Maîtrise de la liste
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: VIOLET }}>
            {masteryPct}%
          </span>
        </div>
        <div
          className="overflow-hidden"
          style={{
            height: 5,
            background: BORDER_TERTIARY,
            borderRadius: 3,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${masteryPct}%`,
              background: VIOLET,
              borderRadius: 3,
              transition: "width 0.35s ease",
            }}
          />
        </div>
        <div className="flex flex-wrap" style={{ gap: 12 }}>
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
            <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: GREEN }} />
            {stats.mastered} maîtrisés
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
            <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: GOLD }} />
            {stats.progress} en cours
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
            <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: DOT_NEW }} />
            {stats.new} nouveaux
          </span>
        </div>
      </div>

      {canEdit && adding && (
        <div
          className="mb-[14px] flex flex-wrap items-end gap-2 rounded-[12px] border bg-white p-3"
          style={{ borderColor: BORDER_TERTIARY, marginBottom: 14 }}
        >
          <input
            type="text"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="Mot"
            className="min-w-[120px] flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: BORDER_SECONDARY }}
          />
          <input
            type="text"
            value={newDef}
            onChange={(e) => setNewDef(e.target.value)}
            placeholder="Traduction"
            className="min-w-[120px] flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: BORDER_SECONDARY }}
          />
          <button
            type="button"
            onClick={addWord}
            disabled={loading || !newTerm.trim()}
            className="rounded-full px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
            style={{ background: VIOLET }}
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-full border px-4 py-2 text-xs"
            style={{ borderColor: BORDER_SECONDARY, color: "var(--foreground-muted)" }}
          >
            Annuler
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-[14px] flex flex-wrap gap-2" style={{ marginBottom: 14, gap: 8 }}>
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
            size={14}
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-[20px] border bg-white py-2 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#6C3FC8]/25"
            style={{
              borderColor: BORDER_SECONDARY,
              paddingLeft: 28,
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setSortAsc((v) => !v)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl border bg-white px-3 py-1.5"
          style={{ borderColor: BORDER_SECONDARY, fontSize: 11 }}
        >
          <ArrowUpDown size={11} strokeWidth={2} className="text-[var(--foreground-muted)]" />
          Trier {sortAsc ? "A→Z" : "Z→A"}
        </button>
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl border bg-white px-3 py-1.5"
            style={{ borderColor: BORDER_SECONDARY, fontSize: 11 }}
          >
            <Filter size={11} strokeWidth={2} className="text-[var(--foreground-muted)]" />
            Filtrer · {filterLabel()}
          </button>
          {filterOpen && (
            <div
              className="absolute right-0 z-10 mt-1 overflow-hidden rounded-xl border bg-white py-1 shadow-md"
              style={{ borderColor: BORDER_SECONDARY, minWidth: 140 }}
            >
              {(
                [
                  ["all", "Tous"],
                  ["mastered", "Maîtrisés"],
                  ["progress", "En cours"],
                  ["new", "Nouveaux"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs hover:bg-[#F0EDF8]"
                  style={{
                    fontWeight: statusFilter === key ? 600 : 400,
                    color: "var(--foreground)",
                  }}
                  onClick={() => {
                    setStatusFilter(key);
                    setFilterOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
        {filteredMots.length} mot{filteredMots.length !== 1 ? "s" : ""}
      </p>

      {/* Liste */}
      <div
        className="overflow-hidden bg-white"
        style={{
          borderRadius: 12,
          border: `0.5px solid ${BORDER_TERTIARY}`,
        }}
      >
        {filteredMots.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
            Aucun mot à afficher.
          </p>
        ) : (
          filteredMots.map((m, i) => (
            <div
              key={m.id}
              className="group flex items-center gap-2.5 px-3.5 py-[11px] transition-colors hover:bg-[#F8F7FF] max-sm:flex-wrap"
              style={{
                gap: 10,
                padding: "11px 14px",
                borderBottom:
                  i < filteredMots.length - 1 ? `0.5px solid ${BORDER_TERTIARY}` : undefined,
              }}
            >
              {editingId === m.id && canEdit ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={editTerm}
                    onChange={(e) => setEditTerm(e.target.value)}
                    className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
                    style={{ borderColor: BORDER_SECONDARY }}
                  />
                  <input
                    type="text"
                    value={editDef}
                    onChange={(e) => setEditDef(e.target.value)}
                    className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
                    style={{ borderColor: BORDER_SECONDARY }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateWord(m.id, editTerm, editDef)}
                      disabled={loading}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: VIOLET }}
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border px-3 py-1 text-xs"
                      style={{ borderColor: BORDER_SECONDARY }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span
                    className="min-w-[18px] shrink-0 text-center tabular-nums"
                    style={{ fontSize: 11, color: "var(--foreground-muted)" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="inline-block shrink-0 rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: statusDotColor(m.sm2Status),
                    }}
                    title={m.sm2Status}
                  />
                  <span
                    className="min-w-0 flex-1 font-medium"
                    style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}
                  >
                    {m.term}
                  </span>
                  <span
                    className="hidden h-4 w-px shrink-0 sm:block"
                    style={{ background: BORDER_TERTIARY }}
                    aria-hidden
                  />
                  <span
                    className="min-w-0 flex-1"
                    style={{ fontSize: 13, color: "var(--foreground-muted)" }}
                  >
                    {m.definition || "\u00A0"}
                  </span>
                  {canEdit && (
                    <div
                      className="flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 max-sm:w-full max-sm:justify-end max-sm:opacity-100"
                      style={{ transitionDuration: "120ms" }}
                    >
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="rounded-lg border bg-transparent text-[11px]"
                        style={{
                          borderColor: BORDER_SECONDARY,
                          color: "var(--foreground-muted)",
                          padding: "4px 9px",
                          borderRadius: 8,
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWord(m.id)}
                        disabled={loading}
                        className="rounded-lg border bg-transparent text-[11px] disabled:opacity-50"
                        style={{
                          borderColor: RED_BORDER,
                          color: RED_TEXT,
                          padding: "4px 9px",
                          borderRadius: 8,
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Légende */}
      <div className="mt-2.5 flex flex-wrap" style={{ marginTop: 10, gap: 12 }}>
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
          <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: GREEN }} />
          Maîtrisé
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
          <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: GOLD }} />
          En cours
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
          <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: DOT_NEW }} />
          Nouveau
        </span>
      </div>
    </div>
  );
}
