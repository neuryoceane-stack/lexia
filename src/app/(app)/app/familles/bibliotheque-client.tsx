"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { FlagDisplay } from "@/components/flag-display";
import { BackLink } from "@/components/back-link";
import { PawPrint, FileText, X, Plus } from "lucide-react";

type BibliothequeList = {
  id: string;
  familyId: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
  progressPercent: number;
  createdAt: string;
};

/** Classe avec ses listes visibles (professeur), pour « Mes classes ». */
type ClassWithLists = {
  id: string;
  title: string;
  language: string | null;
  lists: BibliothequeList[];
};

const SORT_OPTIONS = [
  { value: "alpha", label: "Alphabétique" },
  { value: "created", label: "Date de création" },
  { value: "updated", label: "Date d'ajout" },
] as const;

const KNOWN_LANGS = new Set(PREFERRED_LANGUAGE_OPTIONS.map((o) => o.value));

export function BibliothequeClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lists, setLists] = useState<BibliothequeList[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sort, setSort] = useState<"alpha" | "created" | "updated">("alpha");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<"list" | "sauvages" | null>(null);
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);
  /** Langue choisie dans la modale « Liste de mots » pour la liste à créer. */
  const [newListLanguage, setNewListLanguage] = useState<string>("");
  /** Nom de la liste saisi dans la modale (prérempli en bas sur « Réviser les mots extraits »). */
  const [newListName, setNewListName] = useState("");
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [deletingFamilyId, setDeletingFamilyId] = useState<string | null>(null);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [onboardingLang, setOnboardingLang] = useState("");
  const [savingPreferredLang, setSavingPreferredLang] = useState(false);
  const [preferredLangError, setPreferredLangError] = useState<string | null>(null);
  const [flagMenuOpen, setFlagMenuOpen] = useState(false);
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

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (addModal === "list") {
      setNewListLanguage((prev) => prev || activeLanguage || preferredLanguages[0] || "");
      fetch("/api/familles")
        .then((r) => r.json())
        .then((arr) => setFamilies(Array.isArray(arr) ? arr : []))
        .catch(() => setFamilies([]));
    }
  }, [addModal, activeLanguage, preferredLanguages]);

  useEffect(() => {
    const close = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [menuOpenId]);

  useEffect(() => {
    const close = () => setFlagMenuOpen(false);
    if (flagMenuOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [flagMenuOpen]);

  const visibleStudentClasses = classesWithLists.filter((cls) => {
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

  async function handleDeleteFamily(familyId: string, familyName: string) {
    setMenuOpenId(null);
    const ok = window.confirm(
      `Supprimer la famille « ${familyName} » et toutes ses listes de mots ? Cette action est irréversible.`
    );
    if (!ok) return;
    setDeletingFamilyId(familyId);
    try {
      const res = await fetch(`/api/familles/${familyId}`, { method: "DELETE" });
      if (res.ok) {
        fetchLists();
      }
    } finally {
      setDeletingFamilyId(null);
    }
  }

  async function handleSavePreferredLanguage() {
    const code = (onboardingLang || PREFERRED_LANGUAGE_OPTIONS[0]?.value) ?? "";
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
  const uniqueLangs = new Set(lists.map((l) => l.language).filter(Boolean)).size;
  const avgMastery =
    lists.length > 0
      ? Math.round(lists.reduce((s, l) => s + l.progressPercent, 0) / lists.length)
      : 0;

  const listDueMap = new Map(
    lists.map((l) => [l.id, Math.round(l.wordCount * (1 - l.progressPercent / 100))]),
  );
  const totalDue = Array.from(listDueMap.values()).reduce((s, n) => s + n, 0);
  const mostUrgentList = [...lists].sort(
    (a, b) => (listDueMap.get(b.id) ?? 0) - (listDueMap.get(a.id) ?? 0),
  )[0];

  const filteredByStatus = lists.filter((l) => {
    if (statusFilter === "urgent") return (listDueMap.get(l.id) ?? 0) > 0;
    if (statusFilter === "mastered") return l.progressPercent >= 80;
    return true;
  });

  return (
    <div className="space-y-6 bg-[var(--background)]">
      <BackLink href="/app" ariaLabel="Retour au tableau de bord" />

      {!prefsLoaded && lists.length === 0 && (
        <p className="text-sm text-[var(--foreground-muted)]">Chargement…</p>
      )}

      {/* Bulle première visite : choix de la langue à enrichir */}
      {showOnboardingBubble && (
        <div
          className="rounded-xl border border-primary/30 bg-primary/5"
          role="dialog"
          aria-labelledby="onboarding-lang-title"
          aria-describedby="onboarding-lang-desc"
        >
          <h2 id="onboarding-lang-title" className="mb-2 text-base font-semibold text-[var(--foreground)]">
            Quelle langue vous souhaitez enrichir avec du nouveau vocabulaire ?
          </h2>
          <p id="onboarding-lang-desc" className="mb-3 text-sm text-[var(--foreground-muted)]">
            Choisissez une langue dans la liste ci-dessous.
          </p>
          {preferredLangError && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {preferredLangError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={(onboardingLang || PREFERRED_LANGUAGE_OPTIONS[0]?.value) ?? ""}
              onChange={(e) => setOnboardingLang(e.target.value)}
              className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)]"
              aria-label="Langue à enrichir"
            >
              {PREFERRED_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSavePreferredLanguage}
              disabled={savingPreferredLang}
              className="btn-relief rounded-lg bg-p2-primary px-4 py-2 text-sm font-medium text-white hover:bg-p2-primary/90 disabled:opacity-60"
            >
              {savingPreferredLang ? "Enregistrement…" : "Valider"}
            </button>
          </div>
        </div>
      )}

      {/* Tableau de bord : affiché dès que les listes sont chargées (ou préférences prêtes), sauf si onboarding */}
      <section className={showDashboard ? "contents" : "hidden"}>
        <div className="space-y-6">
      {searchParams.get("saved") === "1" && !savedBannerDismissed && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/30"
          role="status"
        >
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
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
            className="rounded p-1.5 text-green-700 hover:bg-green-200 dark:text-green-300 dark:hover:bg-green-800/50"
            aria-label="Fermer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Header : titre + sous-titre + boutons */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>Bibliothèque</h1>
          <p className="mt-1" style={{ fontSize: 12, color: "var(--foreground-muted)" }}>
            {totalLists} liste{totalLists !== 1 ? "s" : ""} · {uniqueLangs} langue{uniqueLangs !== 1 ? "s" : ""} · {totalWords} mot{totalWords !== 1 ? "s" : ""} · {totalDue} à revoir
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/familles/mots-sauvages"
            className="inline-flex items-center gap-1.5 no-underline transition hover:brightness-95"
            style={{ border: "2px solid #6C3FC8", color: "#6C3FC8", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 500 }}
          >
            <PawPrint size={16} />
            Mots sauvages
          </Link>
          <button
            type="button"
            onClick={() => setAddModal("list")}
            className="inline-flex items-center gap-1.5 transition hover:brightness-95"
            style={{ background: "#6C3FC8", color: "white", borderRadius: 20, padding: "9px 16px", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Barre de maîtrise globale */}
      {lists.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: "var(--foreground-muted)" }}>Maîtrise globale — toutes langues</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#6C3FC8" }}>{avgMastery}%</span>
          </div>
          <div style={{ height: 5, background: "var(--background-subtle)", borderRadius: 3, marginTop: 4 }}>
            <div className="transition-all duration-300" style={{ height: "100%", width: `${avgMastery}%`, background: "#6C3FC8", borderRadius: 3 }} />
          </div>
        </div>
      )}

      {/* Bannière SM-2 urgente */}
      {totalDue > 0 && mostUrgentList && (
        <div className="flex items-center gap-3" style={{ background: "#FEF8EC", border: "0.5px solid #F5D08A", borderRadius: 10, padding: "12px 14px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#F5A623" aria-hidden className="shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 13, fontWeight: 500, color: "#92640A" }}>{totalDue} mot{totalDue !== 1 ? "s" : ""} à revoir maintenant</p>
            <p className="truncate" style={{ fontSize: 11, color: "#C47D0A" }}>{mostUrgentList.name} · SM-2 recommande aujourd&apos;hui</p>
          </div>
          <Link href="/app/revision/express" className="shrink-0 no-underline transition hover:brightness-95" style={{ background: "#F5A623", color: "white", borderRadius: 16, padding: "6px 12px", fontSize: 12, fontWeight: 500 }}>Réviser</Link>
        </div>
      )}

      {/* Filtres langue (chips scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button type="button" onClick={() => setActiveLanguage(null)} className="shrink-0" style={{ background: activeLanguage === null ? "#6C3FC8" : "var(--background-card)", color: activeLanguage === null ? "white" : "var(--foreground-muted)", border: activeLanguage === null ? "1px solid #6C3FC8" : "0.5px solid var(--border)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: activeLanguage === null ? 500 : 400, cursor: "pointer" }}>Toutes les langues</button>
        {preferredLanguages.map((code) => {
          const active = activeLanguage === code;
          const label = PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code;
          return (
            <button key={code} type="button" onClick={() => setActiveLanguage(code)} className="inline-flex shrink-0 items-center gap-1.5" style={{ background: active ? "#6C3FC8" : "var(--background-card)", color: active ? "white" : "var(--foreground-muted)", border: active ? "1px solid #6C3FC8" : "0.5px solid var(--border)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: active ? 500 : 400, cursor: "pointer" }}>
              <FlagDisplay langCode={code} size={16} />
              {label}
            </button>
          );
        })}
        <button type="button" onClick={() => setLangModalOpen(true)} className="shrink-0 transition hover:text-[#6C3FC8]" style={{ background: "transparent", border: "0.5px dashed var(--border)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "var(--foreground-disabled)", cursor: "pointer" }}>+ Langue</button>
      </div>

      {/* Toolbar : recherche + filtres état + vue */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-disabled)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-[var(--input-bg)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)]"
            style={{ borderRadius: 20, border: "0.5px solid var(--border)" }}
          />
        </div>
        <div className="flex gap-1">
          {([["all", "Toutes"], ["urgent", "Urgentes"], ["mastered", "Maîtrisées"]] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              style={{
                background: statusFilter === val ? "#6C3FC8" : "var(--background-card)",
                color: statusFilter === val ? "white" : "var(--foreground-muted)",
                border: statusFilter === val ? "1px solid #6C3FC8" : "0.5px solid var(--border)",
                borderRadius: 20,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: statusFilter === val ? 500 : 400,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden" style={{ borderRadius: 8, border: "0.5px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className="px-2.5 py-2 transition"
            style={{ background: viewMode === "grid" ? "#6C3FC8" : "var(--background-card)", color: viewMode === "grid" ? "white" : "var(--foreground-disabled)" }}
            title="Vue mosaïque"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className="px-2.5 py-2 transition"
            style={{ background: viewMode === "list" ? "#6C3FC8" : "var(--background-card)", color: viewMode === "list" ? "white" : "var(--foreground-disabled)" }}
            title="Vue liste"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <p className="text-[var(--foreground-muted)]">Chargement…</p>
      ) : (
        <>
          {classesWithLists.length > 0 && (
            <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 shadow-[var(--shadow-card)]">
              <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                Mes classes
              </h2>
              {visibleStudentClasses.length === 0 ? (
                <p className="text-xs text-[var(--foreground-muted)]">
                  Aucune classe pour cette langue. Choisis « Toutes les langues » pour les voir.
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleStudentClasses.map((cls) => {
                    const isExpanded = expandedClassId === cls.id;
                    return (
                      <li
                        key={cls.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--background-subtle)]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedClassId((id) => (id === cls.id ? null : cls.id))
                          }
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[var(--hover-bg)]"
                          aria-expanded={isExpanded}
                        >
                          {cls.language && (
                            <FlagDisplay
                              langCode={cls.language}
                              size={18}
                              className="flex-shrink-0"
                            />
                          )}
                          <span
                            className="min-w-0 flex-1 truncate font-medium text-[var(--foreground)]"
                            title={cls.title}
                          >
                            {cls.title}
                          </span>
                          <span
                            className="text-[var(--foreground-disabled)]"
                            aria-hidden
                          >
                            {cls.lists.length} liste{cls.lists.length !== 1 ? "s" : ""}
                          </span>
                          <svg
                            className={`h-5 w-5 flex-shrink-0 text-[var(--foreground-muted)] transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-[var(--border)] px-3 py-2">
                            {cls.lists.length === 0 ? (
                              <p className="py-2 text-xs text-[var(--foreground-muted)]">
                                Aucune liste partagée par le professeur pour l'instant.
                              </p>
                            ) : (
                              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {cls.lists.map((list) => (
                                  <li key={list.id}>
                                    <Link
                                      href={`/app/familles/${list.familyId}/listes/${list.id}${listDetailQuery}`}
                                      className="block rounded-lg border border-[var(--border)] bg-[var(--background-card)] p-3 shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)]">
                                          {list.name}
                                        </h3>
                                        {activeLanguage && (
                                          <span
                                            className="flex-shrink-0 select-none"
                                            title="Langue de la liste (filtre Bibliothèque)"
                                            aria-hidden
                                          >
                                            <FlagDisplay langCode={activeLanguage} size={18} />
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                                        {list.familyName} · {list.wordCount} mot
                                        {list.wordCount !== 1 ? "s" : ""}
                                      </p>
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--background-subtle)]">
                                          <div
                                            className="h-full rounded-full bg-p2-primary transition-all duration-200"
                                            style={{ width: `${list.progressPercent}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-medium text-[var(--foreground-muted)]">
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
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-subtle)] p-8 text-center">
              <p className="text-[var(--foreground-muted)]">
                Aucune liste pour cette langue. Crée une liste de mots ou importe un PDF / une photo.
              </p>
            </div>
          ) : viewMode === "grid" ? (
        <ul className="grid gap-[10px] grid-cols-1 sm:grid-cols-2">
          {filteredByStatus.map((list) => {
            const dueWords = listDueMap.get(list.id) ?? 0;
            const borderColor = dueWords > 0 ? "border-[#F5D08A]" : list.progressPercent >= 80 ? "border-[#C3E6D6]" : "border-[var(--border)]";
            return (
            <li key={list.id} className="relative">
              <Link
                href={`/app/familles/${list.familyId}/listes/${list.id}${listDetailQuery}`}
                className={`block rounded-[12px] border ${borderColor} bg-[var(--background-card)] shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-150 hover:-translate-y-[2px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
                style={{ padding: "14px 12px" }}
              >
                <div className="flex items-center gap-2">
                  {list.language && <FlagDisplay langCode={list.language} size={20} className="shrink-0" />}
                </div>
                <h2 className="mt-2 truncate" style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                  {list.name}
                </h2>
                <p className="mt-0.5" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
                  {list.wordCount} mot{list.wordCount !== 1 ? "s" : ""} · {PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === list.language)?.label ?? list.language ?? "—"}
                </p>
                {(() => {
                  const pct = list.progressPercent;
                  const trackBg = pct < 30 ? "#FEF3DC" : pct < 80 ? "#EAF4EF" : "#F0EDF8";
                  const fillBg = pct < 30 ? "#F5A623" : pct < 80 ? "#1D9E75" : "#6C3FC8";
                  return (
                    <div className="mt-2">
                      <div style={{ height: 4, background: trackBg, borderRadius: 3 }}>
                        <div className="transition-all duration-300" style={{ height: "100%", width: `${pct}%`, background: fillBg, borderRadius: 3 }} />
                      </div>
                      <p className="mt-1" style={{ fontSize: 11, color: "var(--foreground-muted)" }}>{pct}% maîtrisé</p>
                    </div>
                  );
                })()}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {dueWords > 0 && (
                    <span style={{ background: "#FEF3DC", color: "#A06800", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 8 }}>{dueWords} mot{dueWords !== 1 ? "s" : ""} dus</span>
                  )}
                  {list.progressPercent >= 80 && (
                    <span style={{ background: "#EAF4EF", color: "#27500A", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 8 }}>Presque terminé ✓</span>
                  )}
                </div>
              </Link>
              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpenId(menuOpenId === list.id ? null : list.id);
                  }}
                  className="btn-relief rounded-lg p-1.5 text-[var(--foreground-disabled)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground-muted)]"
                  aria-label="Menu"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
                {menuOpenId === list.id && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-[var(--border)] bg-[var(--background-card)] py-1 shadow-[var(--shadow-elevated)]">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-[var(--foreground-muted)] hover:bg-[var(--hover-bg)]"
                      onClick={() => {
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
                      className="block w-full px-3 py-2 text-left text-sm text-[var(--foreground-muted)] hover:bg-[var(--hover-bg)]"
                      onClick={() => handleRenameList(list)}
                    >
                      Renommer la liste
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFamily(list.familyId, list.familyName)}
                      disabled={deletingFamilyId === list.familyId}
                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      Supprimer la famille
                    </button>
                  </div>
                )}
              </div>
            </li>
            );
          })}
          {/* Carte vide "+" */}
          <li>
            <button
              type="button"
              onClick={() => setAddModal("list")}
              className="flex h-full w-full flex-col items-center justify-center gap-2 transition hover:bg-[var(--hover-bg)]"
              style={{ border: "1.5px dashed var(--border)", borderRadius: 12, background: "transparent", padding: "32px 12px", cursor: "pointer" }}
            >
              <div className="flex h-7 w-7 items-center justify-center" style={{ background: "var(--background-subtle)", borderRadius: "50%", color: "#6C3FC8", fontSize: 16, fontWeight: 600 }}>+</div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground-muted)" }}>Nouvelle liste</span>
            </button>
          </li>
        </ul>
          ) : (
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--background-card)]">
          {filteredByStatus.map((list) => (
            <li key={list.id} className="relative flex items-center gap-4 px-4 py-3">
              <Link
                href={`/app/familles/${list.familyId}/listes/${list.id}${listDetailQuery}`}
                className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="block truncate font-semibold text-[var(--foreground)]">
                  {list.name}
                </span>
                <span className="text-sm text-[var(--foreground-muted)]">
                  {list.familyName} · {list.wordCount} mot{list.wordCount !== 1 ? "s" : ""} · {list.progressPercent} % retenu
                </span>
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpenId(menuOpenId === list.id ? null : list.id);
                  }}
                  className="btn-relief rounded p-1.5 text-[var(--foreground-disabled)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground-muted)]"
                  aria-label="Menu"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
                {menuOpenId === list.id && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-[var(--border)] bg-[var(--background-card)] py-1 shadow-[var(--shadow-elevated)]">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-[var(--foreground-muted)] hover:bg-[var(--hover-bg)]"
                      onClick={() => {
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
                      className="block w-full px-3 py-2 text-left text-sm text-[var(--foreground-muted)] hover:bg-[var(--hover-bg)]"
                      onClick={() => handleRenameList(list)}
                    >
                      Renommer la liste
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFamily(list.familyId, list.familyName)}
                      disabled={deletingFamilyId === list.familyId}
                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      Supprimer la famille
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
          )}
        </>
      )}

      {/* Modale Renommer la liste */}
      {renameModalList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !renamingListId && setRenameModalList(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-modal-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-[var(--background-card)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="rename-modal-title" className="mb-4 text-lg font-semibold text-[var(--foreground)]">
              Renommer la liste
            </h2>
            <label htmlFor="rename-list-input" className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
              Nom de la liste
            </label>
            <input
              id="rename-list-input"
              type="text"
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
                className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {renamingListId === renameModalList?.id ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
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
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-subtle)] px-3 py-2">
              <FlagDisplay langCode={duplicateModalList.language || "eng"} size={24} />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === (duplicateModalList.language || "eng"))?.label ?? duplicateModalList.language ?? "Anglais"}
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
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    duplicateToLang === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  <FlagDisplay langCode={opt.value} size={20} />
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
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
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

            <p className="mb-2 text-sm font-medium text-[var(--foreground-muted)]">
              Vos langues
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {preferredLanguages.length === 0 ? (
                <span className="text-sm text-[var(--foreground-muted)]">Aucune langue choisie.</span>
              ) : (
                preferredLanguages.map((code) => (
                  <span
                    key={code}
                    className="relative inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-subtle)] pl-3 pr-8 py-2"
                  >
                    <FlagDisplay langCode={code} size={24} />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLangToRemove(code)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
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
                <span className="text-sm text-[var(--foreground-muted)]">Vous avez déjà ajouté toutes les langues disponibles.</span>
              ) : (
                PREFERRED_LANGUAGE_OPTIONS.filter((o) => !preferredLanguages.includes(o.value)).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAddSecondLanguage(opt.value)}
                    disabled={savingSecondLang}
                    className="btn-relief inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                  >
                    <FlagDisplay langCode={opt.value} size={22} />
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
            <h2 id="confirm-remove-lang-title" className="mb-3 text-lg font-semibold text-[var(--foreground)]">
              Êtes-vous sûr de supprimer cette langue ?
            </h2>
            <p className="mb-6 text-sm text-red-600 dark:text-red-400">
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
                className="btn-relief rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removingLang ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Liste de mots : langue + nom, puis Créer ma liste ou Annuler */}
      {addModal === "list" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(80,60,120,0.18)" }}
          onClick={() => setAddModal(null)}
        >
          <div
            className="w-full overflow-hidden"
            style={{ maxWidth: 400, borderRadius: 20, background: "var(--background-card)", border: "0.5px solid rgba(108,63,200,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header violet */}
            <div className="flex items-center gap-3" style={{ background: "#6C3FC8", padding: "22px 24px 20px" }}>
              <div
                className="flex shrink-0 items-center justify-center"
                style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.2)" }}
              >
                <FileText size={20} stroke="white" />
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ color: "white", fontSize: 16, fontWeight: 500, marginBottom: 2 }}>Nouvelle liste de mots</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Elle apparaîtra dans ta bibliothèque</p>
              </div>
              <button
                type="button"
                onClick={() => setAddModal(null)}
                className="flex shrink-0 items-center justify-center transition hover:brightness-90"
                style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer" }}
                aria-label="Fermer"
              >
                <X size={12} stroke="white" />
              </button>
            </div>

            {/* Corps */}
            <div style={{ padding: "22px 24px" }}>
              <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--foreground-muted)", marginBottom: 8 }}>
                Langue
              </p>
              <div className="grid grid-cols-4 gap-[7px]" style={{ marginBottom: 4 }}>
                {PREFERRED_LANGUAGE_OPTIONS.map((opt) => {
                  const sel = newListLanguage === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewListLanguage(opt.value)}
                      className="flex flex-col items-center gap-1 transition-all"
                      style={{
                        borderRadius: 10,
                        padding: "8px 4px",
                        border: `1.5px solid ${sel ? "#6C3FC8" : "var(--border)"}`,
                        background: sel ? "var(--background-subtle)" : "var(--background-subtle)",
                        cursor: "pointer",
                        transition: "border-color 120ms, background 120ms",
                      }}
                      onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = "#6C3FC8"; e.currentTarget.style.background = "var(--background-subtle)"; } }}
                      onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--background-subtle)"; } }}
                    >
                      <FlagDisplay langCode={opt.value} size={18} />
                      <span style={{ fontSize: 10, fontWeight: 500, color: sel ? "#6C3FC8" : "var(--foreground-muted)" }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setLangModalOpen(true)}
                className="transition hover:opacity-70"
                style={{ fontSize: 11, color: "#6C3FC8", background: "none", border: "none", cursor: "pointer", fontWeight: 500, textDecoration: "underline", marginTop: 4, marginBottom: 16 }}
              >
                Autre langue →
              </button>

              <p style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--foreground-muted)", marginBottom: 8 }}>
                Nom de la liste
              </p>
              <input
                id="modal-list-name"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="ex. Chapitre 3 — La Révolution"
                className="w-full transition-colors"
                style={{
                  fontSize: 13,
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1.5px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--foreground)",
                  outline: "none",
                  width: "100%",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#6C3FC8"; e.currentTarget.style.background = "var(--input-bg)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; e.currentTarget.style.background = "var(--input-bg)"; }}
              />
              <p style={{ fontSize: 11, color: "var(--foreground-disabled)", marginTop: 5 }}>Un nom précis t&apos;aidera à retrouver ta liste.</p>
            </div>

            {/* Footer */}
            <div className="flex gap-[10px]" style={{ padding: "0 24px 22px" }}>
              <button
                type="button"
                onClick={() => setAddModal(null)}
                className="flex-1 transition hover:bg-[var(--hover-bg)]"
                style={{ fontSize: 13, fontWeight: 500, padding: 11, borderRadius: 10, border: "1.5px solid var(--border)", background: "transparent", color: "var(--foreground-muted)", cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={creatingFamily || !newListName.trim() || !newListLanguage.trim()}
                onClick={async () => {
                  if (creatingFamily || !newListName.trim()) return;
                  setCreatingFamily(true);
                  const familyName = newListName.trim();
                  const res = await fetch("/api/familles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: familyName }),
                  });
                  const data = await res.json().catch(() => ({}));
                  setCreatingFamily(false);
                  if (res.ok && data.id) {
                    const params = new URLSearchParams();
                    if (newListLanguage?.trim()) params.set("lang", newListLanguage.trim());
                    params.set("name", newListName.trim());
                    const qs = params.toString() ? `?${params.toString()}` : "";
                    router.push(`/app/familles/${data.id}/nouvelle-liste${qs}`);
                    setAddModal(null);
                  }
                }}
                className="flex flex-[2] items-center justify-center gap-[7px] transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontSize: 13, fontWeight: 500, padding: 11, borderRadius: 10, border: "none", background: "#6C3FC8", color: "white", cursor: "pointer" }}
              >
                <Plus size={14} stroke="white" />
                {creatingFamily ? "Création…" : "Créer ma liste"}
              </button>
            </div>
          </div>
        </div>
      )}
        </div></section></div>
  );
}
