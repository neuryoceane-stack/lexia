"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CircleCheck, Eye, EyeOff, Euro, Package, Plus, ShoppingBag, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { FlagDisplay } from "@/components/flag-display";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { formatShopPriceCents } from "@/lib/shop-price";
import {
  applyPackVisibilitySequentially,
  confirmPackVisibilityMessage,
  creatorShopLanguageSections,
  formatPackVisibilitySummary,
  formatShopScopeLabel,
  formatVisibleCount,
  groupPacksByVisibility,
  packsInLanguageScope,
  reasonFromShopPatchBody,
  selectionState,
  summarizeCreatorShopLanguages,
  toggleCreatorShopLanguage,
  toggleScopeSelection,
  type CreatorShopLanguageSummary,
  type ShopPackRef,
  type ShopPackVisibilityReport,
} from "@/lib/shop-pack-visibility";
import {
  ErrorNote,
  KpiCard,
  LoadingNote,
  cardClass,
  fieldClass,
  formatEuro,
  isRecord,
  num,
  outlineButtonClass,
  primaryButtonClass,
} from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";

type ShopPack = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  wordCount: number;
  expressionCount: number;
  price: number;
  language: string;
  isActive: boolean;
  sales: number;
  revenue: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
};

type PackWord = { term: string; definition: string; isExpression?: boolean };

type BatchReport = ShopPackVisibilityReport & { isActive: boolean };

type BatchProgress = {
  isActive: boolean;
  index: number;
  total: number;
  title: string;
};

const SHOP_LANGUAGES = ["fra", "eng", "deu", "spa", "ita"] as const;

function languageLabel(code: string): string {
  const normalized = code.trim().toLowerCase();
  return PREFERRED_LANGUAGE_OPTIONS.find((option) => option.value === normalized)?.label ?? code.trim().toUpperCase();
}

function languageCode(code: string): string {
  const normalized = code.trim().toLowerCase();
  const known = PREFERRED_LANGUAGE_OPTIONS.find((option) => option.value === normalized)?.value ?? normalized;
  return known ? known.toUpperCase() : "";
}

function frCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function asFlag(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return null;
}

function parsePacks(data: unknown): ShopPack[] | null {
  if (!Array.isArray(data)) return null;
  const packs: ShopPack[] = [];
  for (const row of data) {
    if (!isRecord(row) || typeof row.id !== "string" || typeof row.title !== "string") return null;
    const price = num(row.price);
    const wordCount = num(row.wordCount);
    const expressionCount = num(row.expressionCount);
    const sales = num(row.sales);
    const revenue = num(row.revenue);
    const isActive = asFlag(row.isActive);
    if (
      price === null ||
      wordCount === null ||
      expressionCount === null ||
      sales === null ||
      revenue === null ||
      isActive === null
    ) {
      return null;
    }
    packs.push({
      id: row.id,
      title: row.title,
      description: typeof row.description === "string" ? row.description : "",
      emoji: typeof row.emoji === "string" && row.emoji.trim() ? row.emoji : "📦",
      wordCount,
      expressionCount,
      price,
      language: typeof row.language === "string" ? row.language : "",
      isActive,
      sales,
      revenue,
      stripeProductId: typeof row.stripeProductId === "string" ? row.stripeProductId : null,
      stripePriceId: typeof row.stripePriceId === "string" ? row.stripePriceId : null,
    });
  }
  return packs;
}

export function CreatorShopTab() {
  const { data: packs, loading, error, setError, setData, reload } = useCreatorResource(
    "/api/creator/shop",
    parsePacks,
    "Impossible de charger la boutique.",
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    language: "fra",
    price: 400,
  });
  const [words, setWords] = useState<PackWord[]>([]);
  const [importError, setImportError] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState<boolean | null>(null);
  const [batching, setBatching] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [report, setReport] = useState<BatchReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const batchLock = useRef(false);

  const listed = packs ? packsInLanguageScope(packs, languageFilter) : [];
  const listedIds = listed.map((pack) => pack.id);
  const listedState = selectionState(listedIds, selectedIds);
  const selectedListed = listed.filter((pack) => selectedIds.has(pack.id));
  const summary = packs ? summarizeCreatorShopLanguages(packs) : [];

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = listedState === "partial";
    }
  }, [listedState]);

  useEffect(() => {
    if (!packs) return;
    const allowed = new Set(packsInLanguageScope(packs, languageFilter).map((pack) => pack.id));
    setSelectedIds((current) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of current) {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : current;
    });
  }, [packs, languageFilter]);

  useEffect(() => {
    if (!languageFilter || !packs) return;
    const known = new Set(summarizeCreatorShopLanguages(packs).map((row) => row.language));
    if (!known.has(languageFilter)) setLanguageFilter(null);
  }, [packs, languageFilter]);

  useEffect(() => {
    if (selectedListed.length === 0) setPending(null);
  }, [selectedListed.length]);

  useEffect(() => {
    if (!report) return;
    reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [report]);

  function clearReport() {
    setReport(null);
  }

  async function patchVisibility(pack: ShopPackRef, isActive: boolean) {
    const res = await fetch("/api/creator/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pack.id, isActive }),
    });
    if (!res.ok) {
      const body: unknown = await res.json().catch(() => null);
      return { ok: false as const, reason: reasonFromShopPatchBody(body, res.status) };
    }
    setData((current) => {
      if (!current) return current;
      return current.map((item) => (item.id === pack.id ? { ...item, isActive } : item));
    });
    return { ok: true as const };
  }

  async function runBatch(isActive: boolean) {
    if (batchLock.current) return;
    const targets = listed.filter((pack) => selectedIds.has(pack.id));
    if (targets.length === 0) return;
    batchLock.current = true;
    setBatching(true);
    setPending(null);
    setReport(null);
    setError(null);
    try {
      const result = await applyPackVisibilitySequentially(targets, isActive, patchVisibility, {
        onPackStart(pack, index, total) {
          setProgress({ isActive, index, total, title: pack.title });
        },
      });
      setReport({ isActive, succeeded: result.succeeded, failed: result.failed });
      setSelectedIds(new Set(result.failed.map((item) => item.id)));
      setProgress(null);
      await reload();
    } finally {
      batchLock.current = false;
      setBatching(false);
      setProgress(null);
    }
  }

  async function toggleActive(pack: ShopPack) {
    if (batchLock.current) return;
    clearReport();
    setError(null);
    const res = await fetch("/api/creator/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pack.id, isActive: !pack.isActive }),
    });
    if (!res.ok) {
      setError("Le statut du pack n'a pas pu être modifié.");
      return;
    }
    await reload();
  }

  async function deletePack(id: string) {
    if (batchLock.current) return;
    if (!confirm("Voulez-vous supprimer ce pack définitivement ?")) return;
    clearReport();
    setError(null);
    const res = await fetch("/api/creator/shop", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setError("Le pack n'a pas pu être supprimé.");
      return;
    }
    setSelectedIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    await reload();
  }

  function toggleOne(id: string) {
    if (batchLock.current) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (batchLock.current) return;
    setSelectedIds((current) => toggleScopeSelection(listedIds, current));
  }

  function selectLanguage(language: string) {
    if (batchLock.current) return;
    setLanguageFilter((current) => toggleCreatorShopLanguage(current, language));
    requestAnimationFrame(() => {
      document.getElementById("creator-shop-panel")?.scrollIntoView({ block: "nearest" });
    });
  }

  function showAllLanguages() {
    if (batchLock.current) return;
    setLanguageFilter(null);
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    setImportError("");
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        const parsed: PackWord[] = rows
          .map((row) => ({
            term: row["terme"] ?? row["term"] ?? row["mot"] ?? "",
            definition: row["definition"] ?? row["traduction"] ?? row["translation"] ?? "",
            isExpression: String(row["type"] ?? "").toLowerCase() === "expression",
          }))
          .filter((word) => word.term && word.definition);
        if (parsed.length === 0) {
          setImportError("Aucun mot trouvé. Colonnes attendues : terme, definition, type (optionnel).");
          return;
        }
        setWords(parsed);
      } catch {
        setImportError("Erreur de lecture du fichier Excel.");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function handleSubmit() {
    if (batchLock.current) return;
    if (!form.title || !form.description || words.length === 0) return;
    setSaving(true);
    clearReport();
    setError(null);
    const wordCount = words.filter((word) => !word.isExpression).length;
    const expressionCount = words.filter((word) => word.isExpression).length;
    try {
      const res = await fetch("/api/creator/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          language: form.language,
          price: form.price,
          wordCount,
          expressionCount,
          wordsJson: JSON.stringify(words),
        }),
      });
      if (!res.ok) {
        setError("Le pack n'a pas pu être créé.");
        return;
      }
      setForm({ title: "", description: "", language: "fra", price: 400 });
      setWords([]);
      setShowForm(false);
      await reload();
    } catch {
      setError("Le pack n'a pas pu être créé.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !packs) return <LoadingNote>Chargement…</LoadingNote>;
  if (!packs) return <ErrorNote>{error ?? "Impossible de charger la boutique."}</ErrorNote>;

  const activeCount = packs.filter((pack) => pack.isActive).length;
  const totalSales = packs.reduce((sum, pack) => sum + pack.sales, 0);
  const totalRevenue = packs.reduce((sum, pack) => sum + pack.revenue, 0);
  const importedWords = words.filter((word) => !word.isExpression).length;
  const importedExpressions = words.filter((word) => word.isExpression).length;
  const canSubmit = !saving && !batching && Boolean(form.title) && Boolean(form.description) && words.length > 0;
  const sections = creatorShopLanguageSections(packs);
  const scopeLabel = formatShopScopeLabel(
    languageFilter ? languageLabel(languageFilter) : null,
    listed.length,
  );

  return (
    <div className="space-y-6">
      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <header>
        <h2 className="text-[28px] leading-tight text-ink">Boutique</h2>
        <p className="mt-1 text-sm text-muted">Packs de vocabulaire proposés dans l&apos;application.</p>
      </header>

      <ShopLanguageSummary
        rows={summary}
        active={languageFilter}
        disabled={batching}
        onSelect={selectLanguage}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={Package} label="Packs actifs" value={String(activeCount)} />
        <KpiCard icon={ShoppingBag} label="Ventes totales" value={String(totalSales)} />
        <KpiCard icon={Euro} label="Revenus totaux" value={formatEuro(totalRevenue / 100)} />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          disabled={batching}
          className={primaryButtonClass}
        >
          <Plus size={16} aria-hidden />
          Nouveau pack
        </button>
      </div>

      {showForm ? (
        <form
          className={`${cardClass} p-5`}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <h3 className="text-lg text-ink">Créer un nouveau pack</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block text-sm text-muted">
              Titre
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Voyages et transports"
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="block text-sm text-muted">
              Langue
              <select
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
                className={`${fieldClass} mt-1`}
              >
                {SHOP_LANGUAGES.map((code) => (
                  <option key={code} value={code}>
                    {languageLabel(code)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-muted md:col-span-2">
              Description
              <input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Vocabulaire pour voyager."
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="block text-sm text-muted">
              Prix (centimes)
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                className={`${fieldClass} mt-1`}
              />
              <span className="mt-1 block text-xs text-muted">400 = 4 €</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 flex w-full flex-col items-center rounded-[14px] border border-dashed border-line bg-surface px-4 py-5 text-center outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <Upload size={20} aria-hidden />
            {words.length > 0 ? (
              <span className="mt-2 text-sm font-medium text-ink">
                {frCount(importedWords, "mot", "mots")} et {frCount(importedExpressions, "expression", "expressions")} importés
              </span>
            ) : (
              <span className="mt-2 text-sm text-muted">
                Importer un fichier Excel (.xlsx)
                <span className="mt-1 block text-xs">Colonnes : terme, definition, type (mot ou expression)</span>
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="sr-only" />
          {importError ? (
            <div className="mt-3">
              <ErrorNote>{importError}</ErrorNote>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className={outlineButtonClass}>
              Annuler
            </button>
            <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
              {saving ? "Création…" : "Créer le pack"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {report ? (
          <div ref={reportRef} className="scroll-mt-36">
            <ShopBatchReport report={report} />
          </div>
        ) : null}

        <section
          id="creator-shop-panel"
          aria-labelledby="creator-shop-scope"
          className="scroll-mt-36 space-y-3"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p id="creator-shop-scope" className="m-0 text-sm text-muted">
              {scopeLabel}
            </p>
            {languageFilter ? (
              <button
                type="button"
                onClick={showAllLanguages}
                disabled={batching}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Toutes les langues
              </button>
            ) : null}
          </div>

          {listed.length === 0 ? (
            <div className={`${cardClass} px-6 py-14 text-center`}>
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
                <ShoppingBag size={22} strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mt-4 text-sm text-muted">
                {languageFilter
                  ? `Aucun pack en ${languageLabel(languageFilter).toLowerCase()}.`
                  : "Aucun pack pour l'instant."}
              </p>
            </div>
          ) : (
            <>
              <label
                className={`inline-flex min-h-11 items-center gap-3 ${batching ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={listedState === "all"}
                  disabled={batching}
                  onChange={toggleAll}
                  aria-label={
                    languageFilter
                      ? `Tout sélectionner — ${languageLabel(languageFilter)}`
                      : "Tout sélectionner"
                  }
                  className="h-5 w-5 accent-ink"
                />
                <span className="text-sm font-medium text-ink">Tout sélectionner</span>
                {languageFilter ? <span className="text-sm text-muted">{languageLabel(languageFilter)}</span> : null}
              </label>

              {selectedListed.length > 0 ? (
                <div className="sticky top-[128px] z-30 bg-page py-1 md:top-[88px]">
                  <ShopBatchBar
                    count={selectedListed.length}
                    pending={pending}
                    progress={progress}
                    busy={batching}
                    onAsk={setPending}
                    onConfirm={() => {
                      if (pending !== null) void runBatch(pending);
                    }}
                    onCancel={() => setPending(null)}
                  />
                </div>
              ) : null}

              {languageFilter ? (
                <ShopPackGroups
                  packs={listed}
                  selectedIds={selectedIds}
                  disabled={batching}
                  onToggleSelected={toggleOne}
                  onToggleActive={(pack) => void toggleActive(pack)}
                  onDelete={(id) => void deletePack(id)}
                />
              ) : (
                <div className="space-y-6">
                  {sections.map((section) => (
                    <ShopLanguageSection
                      key={section.language || "unlabeled"}
                      language={section.language}
                      packs={section.packs}
                      selectedIds={selectedIds}
                      disabled={batching}
                      onToggleSelected={toggleOne}
                      onToggleActive={(pack) => void toggleActive(pack)}
                      onDelete={(id) => void deletePack(id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/** Violet déjà utilisé pour une carte choisie (révision, nouvelle liste). */
const ACTIVE_LANGUAGE_BORDER = "#6C3FC8";
const ACTIVE_LANGUAGE_BG = "color-mix(in srgb, #6C3FC8 12%, white)";

const languagePillClass =
  "inline-flex h-7 items-center rounded-lg border-[1.5px] border-ink bg-surface px-2 text-[11px] font-medium tracking-wide text-ink";

function ShopLanguageSummary({
  rows,
  active,
  disabled,
  onSelect,
}: {
  rows: readonly CreatorShopLanguageSummary[];
  active: string | null;
  disabled: boolean;
  onSelect: (language: string) => void;
}) {
  return (
    <section aria-label="Résumé par langue">
      <h3 className="text-lg text-ink">Par langue</h3>
      <p className="mt-1 text-sm text-muted">Packs en base, visibles dans la boutique, et masqués.</p>
      <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-3 p-0 xl:grid-cols-4">
        {rows.map((row) => {
          const selected = active === row.language;
          const empty = row.total === 0;
          return (
            <li key={row.language} className="min-w-0">
              <button
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onSelect(row.language)}
                className={`flex h-full w-full flex-col rounded-[14px] border-[1.5px] bg-surface px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected ? "border-solid" : empty ? "border-dashed border-line" : "border-line"
                }`}
                style={
                  selected
                    ? { borderColor: ACTIVE_LANGUAGE_BORDER, backgroundColor: ACTIVE_LANGUAGE_BG }
                    : undefined
                }
              >
                <span className="flex items-center gap-2">
                  <FlagDisplay langCode={row.language} size={18} className="h-5 w-5" />
                  <span className={languagePillClass}>{languageCode(row.language)}</span>
                </span>
                <span className="mt-2 text-sm font-medium text-ink">{languageLabel(row.language)}</span>
                <span className="mt-3 grid grid-cols-3 gap-1">
                  <ShopSummaryFigure value={row.total} label={row.total === 1 ? "Pack" : "Packs"} />
                  <ShopSummaryFigure value={row.visible} label={row.visible === 1 ? "Visible" : "Visibles"} />
                  <ShopSummaryFigure value={row.hidden} label={row.hidden === 1 ? "Masqué" : "Masqués"} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ShopSummaryFigure({ value, label }: { value: number; label: string }) {
  return (
    <span className="min-w-0">
      <span className="block font-heading text-[22px] leading-none tabular-nums text-ink">{value}</span>
      <span className="mt-1 block text-[11px] leading-tight text-muted">{label}</span>
    </span>
  );
}

function ShopBatchBar({
  count,
  pending,
  progress,
  busy,
  onAsk,
  onConfirm,
  onCancel,
}: {
  count: number;
  pending: boolean | null;
  progress: BatchProgress | null;
  busy: boolean;
  onAsk: (isActive: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirming = pending !== null && !progress && !busy;
  let body: React.ReactNode;
  if (progress) {
    const ratio =
      progress.total > 0 ? Math.min(100, Math.round(((progress.index + 1) / progress.total) * 100)) : 0;
    body = (
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-medium text-ink" aria-live="polite">
          {progress.isActive ? "Rendre visible" : "Masquer"}… {progress.index + 1} sur {progress.total}
        </p>
        <p className="m-0 mt-1 truncate text-sm text-muted">{progress.title}</p>
        <p className="m-0 mt-1 text-xs text-muted">
          {progress.isActive
            ? "Chaque pack est synchronisé avec Stripe, l'un après l'autre."
            : "Les packs sont traités l'un après l'autre."}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-page" aria-hidden>
          <div className="h-full rounded-full bg-mark" style={{ width: `${ratio}%` }} />
        </div>
      </div>
    );
  } else if (busy) {
    body = (
      <p className="m-0 text-sm text-muted" aria-live="polite">
        Mise à jour de la liste…
      </p>
    );
  } else if (pending !== null) {
    body = (
      <>
        <p className="m-0 min-w-0 flex-1 text-sm font-medium leading-relaxed text-ink">
          {confirmPackVisibilityMessage(count, pending)}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onConfirm} className={`${primaryButtonClass} w-full sm:w-auto`}>
            Confirmer
          </button>
          <button type="button" onClick={onCancel} className={`${outlineButtonClass} w-full sm:w-auto`}>
            Annuler
          </button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <p className="m-0 text-sm font-medium text-ink">
          {frCount(count, "pack sélectionné", "packs sélectionnés")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => onAsk(true)} className={`${primaryButtonClass} w-full sm:w-auto`}>
            Rendre visible ({count})
          </button>
          <button type="button" onClick={() => onAsk(false)} className={`${outlineButtonClass} w-full sm:w-auto`}>
            Masquer ({count})
          </button>
        </div>
      </>
    );
  }

  return (
    <div
      role="region"
      aria-label="Actions sur la sélection"
      className={`flex flex-col gap-3 rounded-[14px] border-[1.5px] bg-surface p-4 sm:flex-row sm:items-center sm:justify-between ${
        confirming ? "border-ink" : "border-line"
      }`}
    >
      {body}
    </div>
  );
}

function ShopBatchReport({ report }: { report: BatchReport }) {
  const failed = report.failed.length > 0;
  const summary = formatPackVisibilitySummary(report.succeeded.length, report.failed.length, report.isActive);
  return (
    <div
      role="status"
      className={`rounded-[14px] border px-4 py-3 ${
        failed ? "border-false-sign bg-false-bg" : "border-just-sign bg-just-bg"
      }`}
    >
      <p className={`m-0 flex items-start gap-2 text-sm font-medium ${failed ? "text-false-text" : "text-just-text"}`}>
        {failed ? (
          <AlertTriangle size={16} className="mt-0.5 shrink-0" stroke="var(--false-sign)" aria-hidden />
        ) : (
          <CircleCheck size={16} className="mt-0.5 shrink-0" stroke="var(--just-sign)" aria-hidden />
        )}
        <span>{summary}</span>
      </p>
      {failed ? (
        <ul className="mb-0 mt-3 flex list-none flex-col gap-2 p-0">
          {report.failed.map((item) => (
            <li key={item.id} className="text-sm text-false-text">
              <span className="font-medium">{item.title}</span>
              <span className="mt-0.5 block">{item.reason}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type PackListActions = {
  selectedIds: ReadonlySet<string>;
  disabled: boolean;
  onToggleSelected: (id: string) => void;
  onToggleActive: (pack: ShopPack) => void;
  onDelete: (id: string) => void;
};

function ShopLanguageSection({
  language,
  packs,
  ...actions
}: PackListActions & { language: string; packs: readonly ShopPack[] }) {
  const name = language ? languageLabel(language) : "Langue non renseignée";
  const visible = packs.filter((pack) => pack.isActive).length;
  return (
    <section className="space-y-3" aria-label={name}>
      <div className="flex flex-wrap items-center gap-2">
        {language ? <FlagDisplay langCode={language} size={18} className="h-5 w-5" /> : null}
        {language ? <span className={languagePillClass}>{languageCode(language)}</span> : null}
        <h3 className="m-0 text-base text-ink">{name}</h3>
        <span className="text-sm tabular-nums text-muted">{formatVisibleCount(visible, packs.length)}</span>
      </div>
      <ShopPackGroups packs={packs} {...actions} />
    </section>
  );
}

function ShopPackGroups({ packs, ...actions }: PackListActions & { packs: readonly ShopPack[] }) {
  const groups = groupPacksByVisibility(packs);
  return (
    <div className="space-y-4">
      <ShopPackGroup label="Visibles" packs={groups.visible} {...actions} />
      <ShopPackGroup label="Masqués" packs={groups.hidden} {...actions} />
    </div>
  );
}

function ShopPackGroup({
  label,
  packs,
  selectedIds,
  disabled,
  onToggleSelected,
  onToggleActive,
  onDelete,
}: PackListActions & { label: string; packs: readonly ShopPack[] }) {
  if (packs.length === 0) return null;
  return (
    <section className="space-y-2">
      <h4 className="m-0 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
        <span className="ml-2 tabular-nums">{packs.length}</span>
      </h4>
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label={label} aria-busy={disabled}>
        {packs.map((pack) => (
          <ShopPackRow
            key={pack.id}
            pack={pack}
            selected={selectedIds.has(pack.id)}
            disabled={disabled}
            onToggleSelected={() => onToggleSelected(pack.id)}
            onToggleActive={() => onToggleActive(pack)}
            onDelete={() => onDelete(pack.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function ShopPackRow({
  pack,
  selected,
  disabled,
  onToggleSelected,
  onToggleActive,
  onDelete,
}: {
  pack: ShopPack;
  selected: boolean;
  disabled: boolean;
  onToggleSelected: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const synced = pack.isActive && Boolean(pack.stripeProductId) && Boolean(pack.stripePriceId);
  return (
    <li className={`rounded-[14px] border bg-surface px-2 py-2 sm:px-3 ${selected ? "border-ink" : "border-line"}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <label
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center ${
              disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              disabled={disabled}
              onChange={onToggleSelected}
              aria-label={`Sélectionner ${pack.title}`}
              className="h-5 w-5 accent-ink"
            />
          </label>
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[26px] leading-none" aria-hidden>
            {pack.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="m-0 text-[15px] font-medium text-ink">{pack.title}</p>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  pack.isActive ? "bg-just-bg text-just-text" : "bg-page text-muted"
                }`}
              >
                {pack.isActive ? (
                  <Eye size={12} stroke="var(--just-sign)" aria-hidden />
                ) : (
                  <EyeOff size={12} aria-hidden />
                )}
                {pack.isActive ? "Visible" : "Masqué"}
              </span>
            </div>
            <p className="m-0 mt-0.5 text-sm text-muted">
              {frCount(pack.wordCount, "mot", "mots")}
              {" · "}
              {frCount(pack.expressionCount, "expression", "expressions")}
              {" · "}
              {formatShopPriceCents(pack.price)}
              {pack.sales > 0
                ? ` · ${frCount(pack.sales, "vente", "ventes")} · ${formatEuro(pack.revenue / 100)}`
                : ""}
              {" · Stripe "}
              {synced ? "synchronisé" : "non synchronisé"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end pl-12 sm:pl-0">
          <button
            type="button"
            onClick={onToggleActive}
            disabled={disabled}
            aria-label={pack.isActive ? `Masquer ${pack.title}` : `Rendre visible ${pack.title}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pack.isActive ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            aria-label={`Supprimer ${pack.title}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-false-sign bg-false-bg text-false-sign outline-none focus-visible:ring-2 focus-visible:ring-false-sign disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
