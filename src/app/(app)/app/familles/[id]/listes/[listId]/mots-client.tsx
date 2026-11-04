"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  CreditCard,
  Pencil,
  Search,
  Check,
  Circle,
  Trash2,
} from "lucide-react";
import type { ListWordSm2Status } from "@/lib/list-word-sm2";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  KNOWN_LANGUAGE_CODES,
  toIso6391,
} from "@/lib/language";
import { useLeaveForAbonnement } from "@/components/paywall-gate";
import { LanguagePill } from "@/app/(app)/app/revision/revision-ui";

export type MotWithSm2 = {
  id: string;
  term: string;
  definition: string;
  rank: number;
  sm2Status: ListWordSm2Status;
};

type StatusFilter = "all" | ListWordSm2Status;

const headingStyle = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  color: "var(--ink)",
} as const;

function normalizeListLang(code: string | null): string {
  if (code && KNOWN_LANGUAGE_CODES.has(code)) return code;
  return "fra";
}

function isoCode(code: string): string {
  return toIso6391(code).toUpperCase();
}

function languageLabel(code: string): string {
  return (
    PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code.toUpperCase()
  );
}

function StatusBadge({ status }: { status: ListWordSm2Status }) {
  if (status === "mastered") {
    return (
      <span className="inline-flex min-h-[28px] items-center gap-1 rounded-full bg-just-bg px-2.5 text-xs font-medium text-just-text">
        <Check size={14} strokeWidth={2.5} className="text-just-sign" aria-hidden />
        Maîtrisé
      </span>
    );
  }
  if (status === "progress") {
    return (
      <span className="inline-flex min-h-[28px] items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-xs font-medium text-muted">
        <Circle size={8} fill="currentColor" className="text-ink" aria-hidden />
        En cours
      </span>
    );
  }
  return (
    <span className="inline-flex min-h-[28px] items-center gap-1 rounded-full border border-dashed border-line bg-page px-2.5 text-xs font-medium text-muted">
      <Circle size={8} fill="var(--line)" aria-hidden />
      Nouveau
    </span>
  );
}

const FILTER_PILLS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "mastered", label: "Maîtrisés" },
  { key: "progress", label: "En cours" },
  { key: "new", label: "Nouveaux" },
];

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
  const leaveForAbonnement = useLeaveForAbonnement();
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reviseOpen, setReviseOpen] = useState(false);

  const reviseRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
    if (!reviseOpen && !langOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (reviseRef.current && !reviseRef.current.contains(t)) setReviseOpen(false);
      if (langRef.current && !langRef.current.contains(t)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [reviseOpen, langOpen]);

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
      a.term.localeCompare(b.term, "fr", { sensitivity: "base" })
    );
    return arr;
  }, [mots, search, statusFilter]);

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
    if (leaveForAbonnement()) return;
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

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div ref={langRef} className="relative shrink-0">
            {canEdit ? (
              <>
                <button
                  type="button"
                  disabled={langSaving}
                  onClick={() => setLangOpen((o) => !o)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border-[1.5px] border-ink bg-surface px-2 py-1.5 text-sm font-medium text-ink"
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  aria-label={`Langue : ${languageLabel(listLangCode)}`}
                >
                  <LanguagePill code={isoCode(listLangCode)} />
                  <ChevronDown size={14} strokeWidth={2} className="opacity-70" aria-hidden />
                </button>
                {langOpen && (
                  <ul
                    className="absolute left-0 z-20 mt-1 max-h-64 min-w-[200px] overflow-auto rounded-xl border border-line bg-surface py-1 shadow-[var(--shadow-elevated)]"
                    role="listbox"
                  >
                    {PREFERRED_LANGUAGE_OPTIONS.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          className="flex w-full min-h-11 items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--hover-bg)]"
                          style={{
                            fontWeight: listLangCode === opt.value ? 600 : 400,
                          }}
                          onClick={() => setListLanguage(opt.value)}
                        >
                          <LanguagePill code={isoCode(opt.value)} />
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <span
                className="inline-flex min-h-11 items-center rounded-lg border-[1.5px] border-ink bg-surface px-2"
                title="Langue de la liste"
              >
                <LanguagePill code={isoCode(listLangCode)} />
              </span>
            )}
          </div>

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
              className="min-w-0 max-w-full flex-1 rounded-xl border border-line bg-surface px-3 py-2 font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
              style={{ fontSize: 22, ...headingStyle }}
              aria-label="Nom de la liste"
            />
          ) : (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => canEdit && setEditingTitle(true)}
              className="group flex min-h-11 min-w-0 max-w-full flex-1 items-center gap-2 rounded-lg border-none bg-transparent text-left"
            >
              <span
                className="truncate"
                style={{ fontSize: 22, lineHeight: 1.15, ...headingStyle }}
              >
                {displayName}
              </span>
              {canEdit && (
                <Pencil
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 text-ink opacity-40 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              )}
            </button>
          )}
        </div>

        <div ref={reviseRef} className="relative flex shrink-0 items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                if (leaveForAbonnement()) return;
                setAdding((a) => !a);
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink"
            >
              <Plus size={16} strokeWidth={2.25} aria-hidden />
              Ajouter
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (leaveForAbonnement()) return;
              setReviseOpen((o) => !o);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-surface"
          >
            Réviser
            <ChevronDown size={14} strokeWidth={2.25} aria-hidden />
          </button>

          {reviseOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-elevated)]">
              <Link
                href={flashcardsHref}
                className="flex min-h-11 items-center gap-2.5 border-b border-line px-3.5 py-2.5 no-underline transition-colors hover:bg-[var(--hover-bg)]"
                onClick={() => setReviseOpen(false)}
              >
                <CreditCard size={16} strokeWidth={2} className="text-ink" aria-hidden />
                <span className="text-sm font-medium text-ink">Flashcards</span>
              </Link>
              <Link
                href={dicteeHref}
                className="flex min-h-11 items-center gap-2.5 px-3.5 py-2.5 no-underline transition-colors hover:bg-[var(--hover-bg)]"
                onClick={() => setReviseOpen(false)}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mark">
                  <Pencil size={14} strokeWidth={2} className="text-ink" aria-hidden />
                </span>
                <span className="text-sm font-medium text-ink">Dictée</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Maîtrise */}
      <section
        className="rounded-[20px] border border-line bg-surface p-4"
        aria-label="Maîtrise de la liste"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink">Maîtrise de la liste</span>
          <span className="text-sm font-medium text-ink">{masteryPct} %</span>
        </div>
        <div
          className="mb-3 h-2 overflow-hidden rounded-full border-[1.5px] border-ink bg-page"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={masteryPct}
        >
          <div
            className="h-full rounded-full bg-mark transition-[width] duration-300"
            style={{ width: `${masteryPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span>
            <span className="font-medium text-ink">{stats.mastered}</span> maîtrisés
          </span>
          <span>
            <span className="font-medium text-ink">{stats.progress}</span> en cours
          </span>
          <span>
            <span className="font-medium text-ink">{stats.new}</span> nouveaux
          </span>
        </div>
      </section>

      {canEdit && adding && (
        <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-medium text-muted">Mot</span>
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Mot"
              className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
            />
          </label>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-medium text-muted">Traduction</span>
            <input
              type="text"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              placeholder="Traduction"
              className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addWord}
              disabled={loading || !newTerm.trim()}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-surface disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm text-muted"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Recherche et filtres */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={18}
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un mot…"
            className="min-h-11 w-full rounded-full border border-line bg-surface py-2 pl-10 pr-4 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_PILLS.map(({ key, label }) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                  active
                    ? "bg-ink text-surface"
                    : "border border-line bg-surface text-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm font-medium text-muted">
        {filteredMots.length} mot{filteredMots.length !== 1 ? "s" : ""}
      </p>

      {/* Tableau desktop / cartes mobile */}
      {filteredMots.length === 0 ? (
        <div className="rounded-[20px] border border-line bg-surface px-4 py-10 text-center text-sm text-muted">
          Aucun mot à afficher.
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[20px] border border-line bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-page text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Mot</th>
                  <th className="px-4 py-3 font-medium">Traduction</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  {canEdit && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMots.map((m) =>
                  editingId === m.id && canEdit ? (
                    <tr key={m.id} className="border-b border-line last:border-b-0">
                      <td colSpan={canEdit ? 4 : 3} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={editTerm}
                            onChange={(e) => setEditTerm(e.target.value)}
                            className="min-h-11 min-w-[120px] flex-1 rounded-lg border border-line px-3"
                          />
                          <input
                            type="text"
                            value={editDef}
                            onChange={(e) => setEditDef(e.target.value)}
                            className="min-h-11 min-w-[120px] flex-1 rounded-lg border border-line px-3"
                          />
                          <button
                            type="button"
                            onClick={() => updateWord(m.id, editTerm, editDef)}
                            disabled={loading}
                            className="min-h-11 rounded-full bg-ink px-4 text-xs font-medium text-surface disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="min-h-11 rounded-full border border-line px-4 text-xs text-muted"
                          >
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={m.id}
                      className="border-b border-line last:border-b-0 hover:bg-page/80"
                    >
                      <td className="px-4 py-3 font-medium text-ink">{m.term}</td>
                      <td className="px-4 py-3 text-muted">{m.definition || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.sm2Status} />
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className="inline-flex min-h-11 items-center rounded-lg border border-line px-3 text-xs font-medium text-muted"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteWord(m.id)}
                              disabled={loading}
                              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-false-sign px-3 text-xs font-medium text-false-text disabled:opacity-50"
                            >
                              <Trash2 size={14} aria-hidden />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {filteredMots.map((m) =>
              editingId === m.id && canEdit ? (
                <li
                  key={m.id}
                  className="rounded-[20px] border border-line bg-surface p-4"
                >
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editTerm}
                      onChange={(e) => setEditTerm(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
                    />
                    <input
                      type="text"
                      value={editDef}
                      onChange={(e) => setEditDef(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateWord(m.id, editTerm, editDef)}
                        disabled={loading}
                        className="min-h-11 flex-1 rounded-full bg-ink text-sm font-medium text-surface disabled:opacity-50"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="min-h-11 flex-1 rounded-full border border-line text-sm text-muted"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </li>
              ) : (
                <li
                  key={m.id}
                  className="rounded-[20px] border border-line bg-surface p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{m.term}</p>
                      <p className="mt-1 text-sm text-muted">{m.definition || "—"}</p>
                    </div>
                    <StatusBadge status={m.sm2Status} />
                  </div>
                  {canEdit && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line text-sm font-medium text-muted"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWord(m.id)}
                        disabled={loading}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border border-false-sign text-sm font-medium text-false-text disabled:opacity-50"
                      >
                        <Trash2 size={14} aria-hidden />
                        Supprimer
                      </button>
                    </div>
                  )}
                </li>
              )
            )}
          </ul>
        </>
      )}
    </div>
  );
}
