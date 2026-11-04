"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PREFERRED_LANGUAGE_OPTIONS, toIso6391 } from "@/lib/language";
import {
  PawPrint,
  X,
  Plus,
  ListPlus,
  Library,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Zap,
  ArrowRight,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { LanguagePill } from "@/app/(app)/app/revision/revision-ui";
import { EmptyMark } from "@/components/empty-mark";
import { AppModal } from "@/components/app-modal";
import { ListNameInput } from "@/components/list-name-input";
import { LanguageOnboardingCard } from "@/components/language-onboarding-card";
import { nouvelleListePath } from "@/lib/nouvelle-liste-path";
import { useLeaveForAbonnement } from "@/components/paywall-gate";

type BibliothequeList = {
  id: string;
  familyId: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
  progressPercent: number;
  sm2MasteryPct?: number;
  sm2MasteredCount?: number;
  dueTodayCount?: number;
  createdAt: string;
};

/** Classe avec ses listes visibles (professeur), pour « Mes classes ». */
type ClassWithLists = {
  id: string;
  title: string;
  language: string | null;
  schoolLevel?: string | null;
  status?: "pending" | "accepted";
  lists: BibliothequeList[];
};

const SORT_OPTIONS = [
  { value: "alpha", label: "Alphabétique" },
  { value: "created", label: "Date de création" },
  { value: "updated", label: "Date d'ajout" },
] as const;

const KNOWN_LANGS = new Set(PREFERRED_LANGUAGE_OPTIONS.map((o) => o.value));

const BIBLIOTHEQUE_LANG_STORAGE_KEY = "lexiva.bibliotheque.activeLanguage";

const headingStyle = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  color: "var(--ink)",
} as const;

function isoCode(code: string): string {
  return toIso6391(code).toUpperCase();
}

function languageLabel(code: string): string {
  return (
    PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code.toUpperCase()
  );
}

function listDueCount(list: BibliothequeList): number {
  if (typeof list.dueTodayCount === "number") return list.dueTodayCount;
  return Math.round(list.wordCount * (1 - list.progressPercent / 100));
}

export function BibliothequeClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const leaveForAbonnement = useLeaveForAbonnement();
  const [lists, setLists] = useState<BibliothequeList[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sort, setSort] = useState<"alpha" | "created" | "updated">("alpha");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingFamilyId, setDeletingFamilyId] = useState<string | null>(null);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [savingPreferredLang, setSavingPreferredLang] = useState(false);
  const [preferredLangError, setPreferredLangError] = useState<string | null>(null);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [savingSecondLang, setSavingSecondLang] = useState(false);
  /** Code langue à supprimer : affiche la modale de confirmation. */
  const [langToRemove, setLangToRemove] = useState<string | null>(null);
  const [removingLang, setRemovingLang] = useState(false);
  /** Langue dont on affiche les listes ; le drapeau du bouton et le filtre bibliothèque. */
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  /** Liste sélectionnée pour « Dupliquer dans une autre langue » : ouvre la modale de choix de langue. */
  const [duplicateModalList, setDuplicateModalList] = useState<BibliothequeList | null>(null);
  const [duplicateToLang, setDuplicateToLang] = useState<string>("");
  /** Masquer le bandeau « Liste sauvegardée » après redirection depuis la page Dupliquer. */
  const [savedBannerDismissed, setSavedBannerDismissed] = useState(false);
  /** Liste à renommer : ouvre la modale de renommage. */
  const [renameModalList, setRenameModalList] = useState<BibliothequeList | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  /** Classes avec listes visibles (élève), pour la section « Mes classes ». */
  const [classesWithLists, setClassesWithLists] = useState<ClassWithLists[]>([]);
  /** Classe dépliée pour afficher ses listes (id ou null). */
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeLanguage) params.set("lang", activeLanguage);
    if (searchDebounced) params.set("search", searchDebounced);
    params.set("sort", sort);
    const res = await fetch(`/api/bibliotheque?${params}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setLists(data.lists ?? []);
      setLanguages(data.languages ?? []);
    }
    setLoading(false);
  }, [activeLanguage, searchDebounced, sort]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  /** Recharger les listes à chaque affichage de la Bibliothèque (données à jour après modification d'une liste). */
  useEffect(() => {
    if (pathname === "/app/familles") fetchLists();
  }, [pathname, fetchLists]);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.preferredLanguages)) {
          setPreferredLanguages(data.preferredLanguages);
        } else if (data.preferredLanguage !== undefined || data.preferredLanguage2 !== undefined) {
          setPreferredLanguages(
            [data.preferredLanguage, data.preferredLanguage2].filter(Boolean) as string[]
          );
        }
        setPrefsLoaded(true);
      })
      .catch(() => setPrefsLoaded(true));
  }, []);

  /** Charger les classes avec leurs listes visibles (élève) pour la section « Mes classes ». */
  useEffect(() => {
    fetch("/api/eleve/classes-avec-listes", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.classes)) {
          setClassesWithLists(data.classes);
          const classLangs = (data.classes as ClassWithLists[])
            .filter((c) => c.status !== "pending")
            .map((c) => c.language)
            .filter((x: string | null): x is string => !!x);
          if (classLangs.length > 0) {
            setLanguages((prev) =>
              Array.from(new Set([...prev, ...classLangs])).sort()
            );
          }
        }
      })
      .catch(() => {
        setClassesWithLists([]);
      });
  }, []);

  /** Appliquer le filtre langue depuis l'URL (?lang=eng) au chargement (ex. après création d'une liste). */
  const langFromUrl = searchParams.get("lang")?.trim().toLowerCase() || null;
  const langToApply = langFromUrl === "en" ? "eng" : langFromUrl;
  useEffect(() => {
    if (!prefsLoaded) return;
    if (langToApply && KNOWN_LANGS.has(langToApply)) {
      setActiveLanguage(langToApply);
      return;
    }
    if (preferredLanguages.length === 0) return;
    setActiveLanguage((current) => {
      if (current && preferredLanguages.includes(current)) return current;
      return preferredLanguages[0] ?? null;
    });
  }, [prefsLoaded, preferredLanguages, langToApply]);

  /** Persiste le filtre langue pour Mots sauvages (contexte Bibliothèque). */
  useEffect(() => {
    if (!activeLanguage) return;
    try {
      sessionStorage.setItem(BIBLIOTHEQUE_LANG_STORAGE_KEY, activeLanguage);
    } catch {
      /* ignore */
    }
  }, [activeLanguage]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (searchParams.get("ajouter") !== "liste") return;
    if (!prefsLoaded) return;
    if (leaveForAbonnement()) return;
    const lang = langToApply || preferredLanguages[0] || null;
    router.replace(nouvelleListePath(lang));
  }, [searchParams, prefsLoaded, leaveForAbonnement, langToApply, preferredLanguages, router]);

  useEffect(() => {
    const close = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [menuOpenId]);

  const acceptedClassesOnly = classesWithLists.filter((c) => c.status !== "pending");

  const visibleStudentClasses = acceptedClassesOnly.filter((cls) => {
    if (!activeLanguage || !cls.language) return true;
    return cls.language.toLowerCase().trim() === activeLanguage.toLowerCase().trim();
  });

  /** Paramètre URL à conserver pour le retour bibliothèque depuis une liste. */
  const listDetailQuery = activeLanguage ? `?lang=${encodeURIComponent(activeLanguage)}` : "";

  async function handleRenameList(list: BibliothequeList) {
    setMenuOpenId(null);
    setRenameModalList(list);
    setRenameInput(list.name);
  }

  async function handleSubmitRename() {
    if (!renameModalList || !renameInput.trim()) return;
    const newName = renameInput.trim();
    if (newName === renameModalList.name) {
      setRenameModalList(null);
      return;
    }
    setRenamingListId(renameModalList.id);
    try {
      const res = await fetch(`/api/listes/${renameModalList.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setRenameModalList(null);
        fetchLists();
      }
    } finally {
      setRenamingListId(null);
    }
  }

  async function handleDeleteList(list: BibliothequeList) {
    setMenuOpenId(null);
    const ok = window.confirm(
      `Supprimer la liste « ${list.name} » ? Cette action est irréversible.`
    );
    if (!ok) return;
    setDeletingFamilyId(list.id);
    try {
      const res = await fetch(`/api/listes/${list.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchLists();
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(
          typeof data.error === "string"
            ? data.error
            : "Impossible de supprimer cette liste."
        );
      }
    } finally {
      setDeletingFamilyId(null);
    }
  }

  async function handleSavePreferredLanguage(code: string) {
    if (!code) return;
    setPreferredLangError(null);
    setSavingPreferredLang(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguages: [code] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPreferredLanguages(Array.isArray(data.preferredLanguages) ? data.preferredLanguages : [code]);
        setActiveLanguage(code);
        if (lists.length === 0) {
          router.push(nouvelleListePath(code));
        }
      } else {
        const errMsg = (data.error as string) || "Impossible d'enregistrer la langue.";
        setPreferredLangError(
          data.details ? `${errMsg} (${data.details})` : errMsg
        );
      }
    } finally {
      setSavingPreferredLang(false);
    }
  }

  function goToNewList() {
    if (leaveForAbonnement()) return;
    router.push(nouvelleListePath(activeLanguage || preferredLanguages[0] || null));
  }

  async function handleAddSecondLanguage(code: string) {
    setSavingSecondLang(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguages: [...preferredLanguages, code] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.preferredLanguages)) {
        setPreferredLanguages(data.preferredLanguages);
        setLangModalOpen(false);
      }
    } finally {
      setSavingSecondLang(false);
    }
  }

  async function handleRemoveLanguage(code: string) {
    setRemovingLang(true);
    try {
      const res = await fetch(`/api/user/preferences/language/${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.preferredLanguages)) {
        setPreferredLanguages(data.preferredLanguages);
        setLangToRemove(null);
        setLangModalOpen(false);
        if (activeLanguage === code) {
          setActiveLanguage(data.preferredLanguages[0] ?? null);
        }
        fetchLists();
      }
    } finally {
      setRemovingLang(false);
    }
  }

  const [statusFilter, setStatusFilter] = useState<"all" | "urgent" | "mastered">("all");

  const showOnboardingBubble = prefsLoaded && preferredLanguages.length === 0;
  const showDashboard = (lists.length > 0 || prefsLoaded) && !showOnboardingBubble;

  const totalLists = lists.length;
  const totalWords = lists.reduce((s, l) => s + l.wordCount, 0);
  const languageCount = new Set([
    ...preferredLanguages,
    ...lists.map((l) => l.language).filter((code): code is string => !!code),
  ]).size;
  const avgMastery =
    lists.length > 0
      ? Math.round(lists.reduce((s, l) => s + l.progressPercent, 0) / lists.length)
      : 0;

  const listDueMap = new Map(lists.map((l) => [l.id, listDueCount(l)]));
  const totalDue = Array.from(listDueMap.values()).reduce((s, n) => s + n, 0);
  const expressUrgentLabel = Math.min(10, totalDue);

  const filteredByStatus = lists.filter((l) => {
    if (statusFilter === "urgent") return (listDueMap.get(l.id) ?? 0) > 0;
    if (statusFilter === "mastered") return l.progressPercent >= 80;
    return true;
  });

  function renderListMenu(list: BibliothequeList) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpenId(menuOpenId === list.id ? null : list.id);
          }}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted hover:bg-[var(--hover-bg)]"
          aria-label="Menu de la liste"
        >
          <MoreVertical size={20} aria-hidden />
        </button>
        {menuOpenId === list.id && (
          <div
            className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-line bg-surface py-1 shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full px-3 py-2.5 text-left text-sm text-muted hover:bg-[var(--hover-bg)]"
              onClick={() => {
                if (leaveForAbonnement()) return;
                setMenuOpenId(null);
                setDuplicateModalList(list);
                const from = list.language || "eng";
                setDuplicateToLang(
                  PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value !== from)?.value ??
                    PREFERRED_LANGUAGE_OPTIONS[0]?.value ??
                    ""
                );
              }}
            >
              Dupliquer dans une autre langue
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2.5 text-left text-sm text-muted hover:bg-[var(--hover-bg)]"
              onClick={() => handleRenameList(list)}
            >
              Renommer la liste
            </button>
            <button
              type="button"
              onClick={() => handleDeleteList(list)}
              disabled={deletingFamilyId === list.id}
              className="block w-full px-3 py-2.5 text-left text-sm text-false-text hover:bg-false-bg disabled:opacity-50"
            >
              Supprimer la liste
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {!prefsLoaded && lists.length === 0 && (
        <p className="text-sm text-[var(--foreground-muted)]">Chargement…</p>
      )}

      {/* Première visite : choix de la langue, puis enchaînement vers la création de liste */}
      {showOnboardingBubble && (
        <LanguageOnboardingCard
          saving={savingPreferredLang}
          error={preferredLangError}
          onSubmit={handleSavePreferredLanguage}
        />
      )}

      {/* Tableau de bord : affiché dès que les listes sont chargées (ou préférences prêtes), sauf si onboarding */}
      <section className={showDashboard ? "contents" : "hidden"}>
        <div className="space-y-6">
      {searchParams.get("saved") === "1" && !savedBannerDismissed && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3"
          role="status"
        >
          <p className="text-sm font-medium text-ink">
            Liste sauvegardée avec succès.
          </p>
          <button
            type="button"
            onClick={() => {
              setSavedBannerDismissed(true);
              const p = new URLSearchParams(searchParams.toString());
              p.delete("saved");
              const q = p.toString();
              router.replace(q ? `${pathname}?${q}` : pathname);
            }}
            className="rounded p-1.5 text-ink hover:bg-surface"
            aria-label="Fermer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-[32px] leading-tight md:text-[38px]" style={headingStyle}>
          Ma bibliothèque
        </h1>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Link
            href={
              activeLanguage
                ? `/app/familles/mots-sauvages?lang=${encodeURIComponent(activeLanguage)}`
                : "/app/familles/mots-sauvages"
            }
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink no-underline sm:flex-initial"
          >
            <PawPrint size={18} strokeWidth={2} aria-hidden />
            Mots sauvages
          </Link>
          <button
            type="button"
            onClick={() => goToNewList()}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-surface sm:flex-initial"
          >
            <ListPlus size={18} strokeWidth={2} aria-hidden />
            Importer une liste
          </button>
        </div>
      </div>

      {/* Maîtrise globale + révision express */}
      {showDashboard && preferredLanguages.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-[20px] border border-line bg-surface p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">Maîtrise globale</span>
              <span className="text-sm font-medium text-ink">{avgMastery} %</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full border-[1.5px] border-ink bg-page"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={avgMastery}
              aria-label="Maîtrise globale"
            >
              <div
                className="h-full rounded-full bg-mark transition-[width] duration-300"
                style={{ width: `${avgMastery}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted">
              {totalLists} liste{totalLists !== 1 ? "s" : ""} · {languageCount} langue
              {languageCount !== 1 ? "s" : ""} · {totalWords} mot{totalWords !== 1 ? "s" : ""}
            </p>
          </section>

          <section className="flex flex-col gap-4 rounded-[20px] border-[1.5px] border-ink bg-surface p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mark">
                <Zap size={20} strokeWidth={1.8} className="text-ink" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg" style={{ ...headingStyle, fontSize: 20, lineHeight: 1.15 }}>
                  Révision express
                </p>
                <p className="mt-1 text-sm text-ink">
                  <span className="marker">
                    {expressUrgentLabel}{" "}
                    {expressUrgentLabel !== 1 ? "mots urgents" : "mot urgent"}
                  </span>
                  {totalDue > expressUrgentLabel ? (
                    <span className="text-muted">
                      {" "}
                      · {totalDue} au total à revoir
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <Link
              href="/app/revision/express"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface no-underline hover:bg-ink-hover"
            >
              Commencer
              <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
            </Link>
          </section>
        </div>
      )}

      {/* Pastilles de langue */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" style={{ scrollbarWidth: "none" }}>
        <button
          type="button"
          onClick={() => setActiveLanguage(null)}
          className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium ${
            activeLanguage === null
              ? "bg-ink text-surface"
              : "border border-line bg-surface text-muted"
          }`}
        >
          Toutes les langues
        </button>
        {preferredLanguages.map((code) => {
          const active = activeLanguage === code;
          const label = languageLabel(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => setActiveLanguage(code)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium ${
                active ? "bg-ink text-surface" : "border border-line bg-surface text-muted"
              }`}
            >
              {active ? (
                <span className="inline-flex h-7 items-center rounded-lg border-[1.5px] border-surface px-2 text-[11px] font-medium tracking-wide text-surface">
                  {isoCode(code)}
                </span>
              ) : (
                <LanguagePill code={isoCode(code)} />
              )}
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setLangModalOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-dashed border-line px-4 text-sm text-muted"
        >
          <Plus size={16} aria-hidden />
          Ajouter une langue
        </button>
      </div>

      {/* Recherche, tri, statut, vue */}
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
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
            placeholder="Rechercher une liste ou un mot…"
            className="min-h-11 w-full rounded-full border border-line bg-surface py-2 pl-10 pr-4 text-sm text-ink"
          />
        </div>
        <div className="relative">
          <label htmlFor="bib-sort" className="sr-only">
            Trier les listes
          </label>
          <ArrowUpDown
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <select
            id="bib-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="min-h-11 appearance-none rounded-full border border-line bg-surface py-2 pl-9 pr-8 text-sm text-ink"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {([["all", "Toutes"], ["urgent", "Urgentes"], ["mastered", "Maîtrisées"]] as const).map(
            ([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${
                  statusFilter === val
                    ? "bg-ink text-surface"
                    : "border border-line bg-surface text-muted"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
        <div className="flex overflow-hidden rounded-xl border border-line">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center ${
              viewMode === "grid" ? "bg-ink text-surface" : "bg-surface text-muted"
            }`}
            title="Vue mosaïque"
            aria-label="Vue mosaïque"
          >
            <LayoutGrid size={18} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center border-l border-line ${
              viewMode === "list" ? "bg-ink text-surface" : "bg-surface text-muted"
            }`}
            title="Vue liste"
            aria-label="Vue liste"
          >
            <List size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {/* Contenu */}
      {loading && lists.length === 0 ? (
        <p className="text-[var(--foreground-muted)]">Chargement…</p>
      ) : (
        <>
          {acceptedClassesOnly.length > 0 && (
            <section className="mb-6 rounded-[20px] border border-line bg-surface p-4">
              <h2 className="mb-3 text-lg" style={headingStyle}>
                Mes classes
              </h2>
              {visibleStudentClasses.length === 0 ? (
                <p className="text-sm text-muted">
                  Aucune classe pour cette langue. Choisissez « Toutes les langues » pour les
                  afficher.
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleStudentClasses.map((cls) => {
                    const isExpanded = expandedClassId === cls.id;
                    return (
                      <li
                        key={cls.id}
                        className="rounded-xl border border-line bg-page"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedClassId((id) => (id === cls.id ? null : cls.id))
                          }
                          className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-bg)]"
                          aria-expanded={isExpanded}
                        >
                          {cls.language && (
                            <LanguagePill code={isoCode(cls.language)} />
                          )}
                          <span
                            className="min-w-0 flex-1 truncate font-medium text-ink"
                            title={cls.title}
                          >
                            {cls.title}
                          </span>
                          <span className="text-sm text-muted" aria-hidden>
                            {cls.lists.length} liste{cls.lists.length !== 1 ? "s" : ""}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`shrink-0 text-muted transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            aria-hidden
                          />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-line px-3 py-2">
                            {cls.lists.length === 0 ? (
                              <p className="py-2 text-sm text-muted">
                                Aucune liste partagée par le professeur pour l&apos;instant.
                              </p>
                            ) : (
                              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {cls.lists.map((list) => (
                                  <li key={list.id}>
                                    <Link
                                      href={`/app/familles/${list.familyId}/listes/${list.id}${listDetailQuery}`}
                                      className="home-dash-card block p-3 no-underline"
                                      style={{ borderRadius: 16 }}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                                          {list.name}
                                        </h3>
                                        {list.language && (
                                          <LanguagePill code={isoCode(list.language)} />
                                        )}
                                      </div>
                                      <p className="mt-1 text-xs text-muted">
                                        {list.wordCount} mot
                                        {list.wordCount !== 1 ? "s" : ""}
                                      </p>
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-page">
                                          <div
                                            className="h-full rounded-full bg-ink transition-all duration-200"
                                            style={{ width: `${list.progressPercent}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-medium text-muted">
                                          {list.progressPercent} %
                                        </span>
                                      </div>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {lists.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-line bg-page px-6 py-12 text-center">
              <EmptyMark icon={Library} className="mx-auto mb-4" />
              <p className="text-muted">
                Bienvenue dans votre bibliothèque. Importez une liste ou créez vos premières fiches
                pour commencer.
              </p>
              <button
                type="button"
                onClick={() => goToNewList()}
                className="mx-auto mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface"
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden />
                Créer ma première liste
              </button>
            </div>
          ) : viewMode === "grid" ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredByStatus.map((list) => {
            const dueWords = listDueMap.get(list.id) ?? 0;
            const pct = list.progressPercent;
            return (
            <li key={list.id} className="relative">
              <Link
                href={`/app/familles/${list.familyId}/listes/${list.id}${listDetailQuery}`}
                className="home-dash-card block p-4 no-underline"
                style={{ borderRadius: 20 }}
              >
                <div className="flex items-start justify-between gap-2">
                  {list.language ? (
                    <LanguagePill code={isoCode(list.language)} />
                  ) : (
                    <span />
                  )}
                </div>
                <h2 className="mt-3 truncate text-base font-medium text-ink">{list.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {list.wordCount} mot{list.wordCount !== 1 ? "s" : ""}
                </p>
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-page">
                    <div
                      className="h-full rounded-full bg-ink transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">{pct} % maîtrisé</p>
                </div>
                {dueWords > 0 && (
                  <p className="marker mt-2 inline-block text-sm font-medium text-ink">
                    {dueWords} mot{dueWords !== 1 ? "s" : ""} à revoir
                  </p>
                )}
              </Link>
              <div className="absolute right-3 top-3">{renderListMenu(list)}</div>
            </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => goToNewList()}
              className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-line bg-transparent transition-colors hover:bg-[var(--hover-bg)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-page text-xl font-semibold text-ink">
                +
              </span>
              <span className="text-sm font-medium text-muted">Nouvelle liste</span>
            </button>
          </li>
        </ul>
          ) : (
        <ul className="divide-y divide-line rounded-[20px] border border-line bg-surface">
          {filteredByStatus.map((list) => {
            const dueWords = listDueMap.get(list.id) ?? 0;
            const pct = list.progressPercent;
            return (
            <li key={list.id} className="relative flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
              <Link
                href={`/app/familles/${list.familyId}/listes/${list.id}${listDetailQuery}`}
                className="flex min-w-0 flex-1 items-center gap-3 no-underline"
              >
                {list.language && <LanguagePill code={isoCode(list.language)} />}
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{list.name}</span>
                  <span className="text-sm text-muted">
                    {list.wordCount} mot{list.wordCount !== 1 ? "s" : ""}
                    {dueWords > 0 ? (
                      <>
                        {" · "}
                        <span className="marker font-medium text-ink">
                          {dueWords} à revoir
                        </span>
                      </>
                    ) : null}
                  </span>
                  <div className="mt-2 flex max-w-xs items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-page">
                      <div
                        className="h-full rounded-full bg-ink"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{pct} %</span>
                  </div>
                </div>
              </Link>
              <div className="relative ml-auto shrink-0">{renderListMenu(list)}</div>
            </li>
            );
          })}
        </ul>
          )}
        </>
      )}

      {/* Modale Renommer la liste */}
      {renameModalList && (
        <AppModal
          open={!!renameModalList}
          onClose={() => !renamingListId && setRenameModalList(null)}
          closeOnOverlay={!renamingListId}
          title="Renommer la liste"
          titleId="rename-modal-title"
        >
            <label htmlFor="bib-rename-list-title" className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
              Nom de la liste
            </label>
            <ListNameInput
              id="bib-rename-list-title"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="ex. Mots extraits du PDF"
              className="mb-6 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              disabled={!!renamingListId}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !renamingListId && setRenameModalList(null)}
                disabled={!!renamingListId}
                className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-muted)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitRename}
                disabled={renamingListId !== null || !renameInput.trim()}
                className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-dark disabled:opacity-50"
              >
                {renamingListId === renameModalList?.id ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
        </AppModal>
      )}

      {/* Modale Dupliquer dans une autre langue */}
      {duplicateModalList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDuplicateModalList(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-modal-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-[var(--background-card)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="duplicate-modal-title" className="mb-4 text-lg font-semibold text-[var(--foreground)]">
              Dupliquer « {duplicateModalList.name} »
            </h2>
            <p className="mb-2 text-sm font-medium text-[var(--foreground-muted)]">
              De (langue de la liste)
            </p>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-page px-3 py-2">
              <LanguagePill code={isoCode(duplicateModalList.language || "eng")} />
              <span className="text-sm font-medium text-ink">
                {languageLabel(duplicateModalList.language || "eng")}
              </span>
            </div>
            <p className="mb-2 text-sm font-medium text-[var(--foreground-muted)]">
              Vers (langue de la nouvelle liste)
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {PREFERRED_LANGUAGE_OPTIONS.filter((o) => o.value !== (duplicateModalList.language || "eng")).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuplicateToLang(opt.value)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    duplicateToLang === opt.value
                      ? "border-ink bg-page text-ink"
                      : "border-line bg-surface text-ink hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  <LanguagePill code={isoCode(opt.value)} />
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDuplicateModalList(null)}
                className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const from = duplicateModalList.language || "eng";
                  if (duplicateToLang && duplicateToLang !== from) {
                    router.push(
                      `/app/familles/dupliquer?listId=${duplicateModalList.id}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(duplicateToLang)}`
                    );
                    setDuplicateModalList(null);
                  }
                }}
                disabled={!duplicateToLang || duplicateToLang === (duplicateModalList.language || "eng")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary/90 disabled:opacity-50"
              >
                Voir l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal langues à enrichir (drapeau → +) */}
      {langModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLangModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-modal-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-[var(--background-card)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="lang-modal-title" className="mb-4 text-lg font-semibold text-[var(--foreground)]">
              Langues à enrichir
            </h2>

            <p className="mb-2 text-sm font-medium text-muted">
              Vos langues
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {preferredLanguages.length === 0 ? (
                <span className="text-sm text-muted">Aucune langue choisie.</span>
              ) : (
                preferredLanguages.map((code) => (
                  <span
                    key={code}
                    className="relative inline-flex items-center gap-2 rounded-lg border border-line bg-page pl-3 pr-8 py-2"
                  >
                    <LanguagePill code={isoCode(code)} />
                    <span className="text-sm font-medium text-ink">
                      {languageLabel(code)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLangToRemove(code)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded text-false-text hover:bg-false-bg"
                      title="Supprimer cette langue"
                      aria-label={`Supprimer ${PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))
              )}
            </div>

            <p className="mb-2 text-sm font-medium text-[var(--foreground-muted)]">
              Ajouter une langue
            </p>
            <div className="flex flex-wrap gap-2">
              {PREFERRED_LANGUAGE_OPTIONS.filter((o) => !preferredLanguages.includes(o.value)).length === 0 ? (
                <span className="text-sm text-muted">
                  Vous avez déjà ajouté toutes les langues disponibles.
                </span>
              ) : (
                PREFERRED_LANGUAGE_OPTIONS.filter((o) => !preferredLanguages.includes(o.value)).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAddSecondLanguage(opt.value)}
                    disabled={savingSecondLang}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-ink disabled:opacity-50"
                  >
                    <LanguagePill code={isoCode(opt.value)} />
                    {opt.label}
                  </button>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLangModalOpen(false)}
                className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-muted)]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale confirmation suppression langue */}
      {langToRemove && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !removingLang && setLangToRemove(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-lang-title"
        >
          <div
            className="w-full max-w-sm rounded-xl bg-[var(--background-card)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-remove-lang-title" className="mb-3 text-lg font-semibold text-ink">
              Êtes-vous sûr de vouloir supprimer cette langue ?
            </h2>
            <p className="mb-6 text-sm text-false-text">
              Tous les mots de vocabulaire enregistrés seront supprimés définitivement.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLangToRemove(null)}
                disabled={removingLang}
                className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-muted)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleRemoveLanguage(langToRemove)}
                disabled={removingLang}
                className="btn-relief rounded-lg bg-false-sign px-4 py-2 text-sm font-medium text-surface hover:bg-false-text disabled:opacity-50"
              >
                {removingLang ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
        </div></section></div>
  );
}
