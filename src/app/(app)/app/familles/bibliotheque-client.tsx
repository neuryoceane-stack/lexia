"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFlagEmoji, getFlagImagePath, PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { FlagDisplay } from "@/components/flag-display";

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

const SORT_OPTIONS = [
  { value: "alpha", label: "Alphabétique" },
  { value: "created", label: "Date de création" },
  { value: "updated", label: "Date d’ajout" },
] as const;

export function BibliothequeClient() {
  const router = useRouter();
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
  const [newFamilyName, setNewFamilyName] = useState("");
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

  const fetchLists = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeLanguage) params.set("lang", activeLanguage);
    if (searchDebounced) params.set("search", searchDebounced);
    params.set("sort", sort);
    const res = await fetch(`/api/bibliotheque?${params}`);
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

  useEffect(() => {
    if (!prefsLoaded || preferredLanguages.length === 0) return;
    setActiveLanguage((current) => {
      if (current && preferredLanguages.includes(current)) return current;
      return preferredLanguages[0] ?? null;
    });
  }, [prefsLoaded, preferredLanguages]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (addModal === "list") {
      fetch("/api/familles")
        .then((r) => r.json())
        .then((arr) => setFamilies(Array.isArray(arr) ? arr : []))
        .catch(() => setFamilies([]));
    }
  }, [addModal]);

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
        const errMsg = (data.error as string) || "Impossible d’enregistrer la langue.";
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

  const showOnboardingBubble = prefsLoaded && preferredLanguages.length === 0;

  return (
    <div className="space-y-6">
      {/* Retour */}
      <div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
          aria-label="Retour au tableau de bord"
        >
          <span aria-hidden>←</span>
          Retour
        </Link>
      </div>

      {!prefsLoaded && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
      )}

      {/* Bulle première visite : choix de la langue à enrichir */}
      {showOnboardingBubble && (
        <div
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 dark:border-primary/40 dark:bg-primary/10"
          role="dialog"
          aria-labelledby="onboarding-lang-title"
          aria-describedby="onboarding-lang-desc"
        >
          <h2 id="onboarding-lang-title" className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            Quelle langue vous souhaitez enrichir avec du nouveau vocabulaire ?
          </h2>
          <p id="onboarding-lang-desc" className="mb-3 text-sm text-slate-600 dark:text-slate-400">
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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

      {/* Tableau de bord : affiché seulement après choix de la langue (ou si déjà choisie) */}
      {prefsLoaded && !showOnboardingBubble && (
      <>
      {/* Barre supérieure: titre + langue + boutons d’ajout */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Bibliothèque
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          {false && (
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {}}
              className={`btn-relief rounded-l-md px-2.5 py-2 text-xl transition ${
                false
                  ? "bg-primary/10 ring-1 ring-primary/30 dark:bg-primary/20"
                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              title="Toutes langues"
            >
              🌐
            </button>
            {languages.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {}}
                className={`btn-relief flex items-center justify-center px-2.5 py-2 text-xl transition ${
                  false
                    ? "bg-primary/10 ring-1 ring-primary/30 dark:bg-primary/20"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                title={l}
              >
                <span className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
                  {getFlagImagePath(l) ? (
                    <>
                      <img
                        src={getFlagImagePath(l)}
                        alt=""
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <span className="absolute inset-0 hidden items-center justify-center text-lg" aria-hidden>
                        {getFlagEmoji(l)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg" aria-hidden>{getFlagEmoji(l)}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
          )}

          {/* Boutons d’ajout */}
          <div className="flex items-center gap-2">
            {preferredLanguages.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlagMenuOpen((o) => !o);
                  }}
                  className="btn-relief inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-vocab-gray hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  title={activeLanguage ? (PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === activeLanguage)?.label ?? activeLanguage) : "Langues à enrichir"}
                  aria-expanded={flagMenuOpen}
                  aria-haspopup="true"
                >
                  <FlagDisplay langCode={activeLanguage ?? preferredLanguages[0]} size={24} />
                </button>
                {flagMenuOpen && (
                  <div
                    className="absolute left-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      {preferredLanguages.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setActiveLanguage(code);
                            setFlagMenuOpen(false);
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded border transition ${
                            activeLanguage === code
                              ? "border-primary ring-2 ring-primary/30 dark:border-primary-light dark:ring-primary-light/30"
                              : "border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500"
                          }`}
                          title={PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code}
                          aria-label={`Choisir ${PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? code}`}
                          aria-pressed={activeLanguage === code}
                        >
                          <FlagDisplay langCode={code} size={20} />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLangModalOpen(true);
                        setFlagMenuOpen(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-slate-300 text-slate-500 hover:border-primary hover:text-primary dark:border-slate-500 dark:hover:border-primary-light dark:hover:text-primary-light"
                      title="Ajouter une langue à apprendre"
                      aria-label="Ajouter une langue"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setAddModal("list")}
              className="btn-relief inline-flex h-10 items-center gap-2 rounded-lg bg-p2-primary px-4 py-2 text-sm font-medium text-white hover:bg-p2-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Liste de mots
            </button>
            <Link
              href="/app/familles/mots-sauvages"
              className="btn-relief inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-vocab-gray hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Mots sauvages
            </Link>
          </div>
        </div>
      </div>

      {/* Recherche + tri + vue */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nom de liste ou un mot…"
          className="max-w-xs flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-vocab-gray placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-vocab-gray dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-600">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`btn-relief rounded-l-lg px-3 py-2 transition ${
              viewMode === "grid"
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                : "hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Vue mosaïque"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`btn-relief rounded-r-lg px-3 py-2 transition ${
              viewMode === "list"
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                : "hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title="Vue liste"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Chargement…</p>
      ) : lists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-400">
            Aucune liste pour cette langue. Crée une liste de mots ou importe un PDF / une photo.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <li key={list.id} className="relative">
              <Link
                href={`/app/familles/${list.familyId}/listes/${list.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {list.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {list.familyName} · {list.wordCount} mot{list.wordCount !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                        <div
                          className="h-full rounded-full bg-p2-primary transition-all duration-200"
                          style={{ width: `${list.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {list.progressPercent} %
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpenId(menuOpenId === list.id ? null : list.id);
                  }}
                  className="btn-relief rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  aria-label="Menu"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
                {menuOpenId === list.id && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <Link
                      href={`/app/familles/dupliquer?listId=${list.id}`}
                      className="block px-3 py-2 text-sm text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => setMenuOpenId(null)}
                    >
                      Dupliquer dans une autre langue
                    </Link>
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
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
          {lists.map((list) => (
            <li key={list.id} className="relative flex items-center gap-4 px-4 py-3">
              <Link
                href={`/app/familles/${list.familyId}/listes/${list.id}`}
                className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="block truncate font-semibold text-slate-800 dark:text-slate-100">
                  {list.name}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
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
                  className="btn-relief rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  aria-label="Menu"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
                {menuOpenId === list.id && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <Link
                      href={`/app/familles/dupliquer?listId=${list.id}`}
                      className="block px-3 py-2 text-sm text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => setMenuOpenId(null)}
                    >
                      Dupliquer dans une autre langue
                    </Link>
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
            className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="lang-modal-title" className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Langues à enrichir
            </h2>

            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              Vos langues
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {preferredLanguages.length === 0 ? (
                <span className="text-sm text-slate-500 dark:text-slate-400">Aucune langue choisie.</span>
              ) : (
                preferredLanguages.map((code) => (
                  <span
                    key={code}
                    className="relative inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-8 py-2 dark:border-slate-600 dark:bg-slate-700/50"
                  >
                    <FlagDisplay langCode={code} size={24} />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
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

            <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              Ajouter une langue
            </p>
            <div className="flex flex-wrap gap-2">
              {PREFERRED_LANGUAGE_OPTIONS.filter((o) => !preferredLanguages.includes(o.value)).length === 0 ? (
                <span className="text-sm text-slate-500 dark:text-slate-400">Vous avez déjà ajouté toutes les langues disponibles.</span>
              ) : (
                PREFERRED_LANGUAGE_OPTIONS.filter((o) => !preferredLanguages.includes(o.value)).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAddSecondLanguage(opt.value)}
                    disabled={savingSecondLang}
                    className="btn-relief inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:bg-primary/5 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-primary-light dark:hover:bg-primary/10 disabled:opacity-50"
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
                className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300"
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
            className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-remove-lang-title" className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
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
                className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300 disabled:opacity-50"
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

      {/* Modal Liste de mots : choisir une famille */}
      {addModal === "list" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Liste de mots
            </h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Choisis une famille, puis crée une liste (manuel, PDF ou photo).
            </p>
            {families.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune famille. Crée une famille pour y ajouter des listes.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const name = newFamilyName.trim();
                    if (!name || creatingFamily) return;
                    setCreatingFamily(true);
                    const res = await fetch("/api/familles", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name }),
                    });
                    const data = await res.json().catch(() => ({}));
                    setCreatingFamily(false);
                    if (res.ok && data.id) {
                      setNewFamilyName("");
                      setFamilies((prev) => [...prev, { id: data.id, name: data.name }]);
                      router.push(`/app/familles/${data.id}/nouvelle-liste`);
                      setAddModal(null);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    placeholder="Nom de la famille"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={creatingFamily || !newFamilyName.trim()}
                    className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {creatingFamily ? "Création…" : "Créer"}
                  </button>
                </form>
              </div>
            ) : (
              <ul className="space-y-2">
                {families.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/app/familles/${f.id}/nouvelle-liste`}
                      className="btn-relief block rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-800 hover:border-primary hover:bg-primary/5 dark:border-slate-600 dark:text-slate-100 dark:hover:border-primary-light dark:hover:bg-primary/10"
                      onClick={() => setAddModal(null)}
                    >
                      {f.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAddModal(null)}
                className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
