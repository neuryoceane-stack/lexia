"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CircleCheck, Eye, EyeOff, Euro, Package, Plus, ShoppingBag, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { formatShopPriceCents } from "@/lib/shop-price";
import {
  applyPackVisibilitySequentially,
  confirmPackVisibilityMessage,
  formatPackVisibilitySummary,
  orderedShopLanguages,
  packsInLanguageScope,
  reasonFromShopPatchBody,
  selectionState,
  toggleScopeSelection,
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
  return PREFERRED_LANGUAGE_OPTIONS.find((option) => option.value === code)?.label ?? code.toUpperCase();
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
  const languages = packs ? orderedShopLanguages(packs.map((pack) => pack.language)) : [];

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
    if (!packs.some((pack) => pack.language === languageFilter)) setLanguageFilter(null);
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

  return (
    <div className="space-y-6">
      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <header>
        <h2 className="text-[28px] leading-tight text-ink">Boutique</h2>
        <p className="mt-1 text-sm text-muted">Packs de vocabulaire proposés dans l&apos;application.</p>
      </header>

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

      {packs.length === 0 ? (
        <div className={`${cardClass} px-6 py-14 text-center`}>
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
            <ShoppingBag size={22} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-sm text-muted">Aucun pack pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {report ? (
            <div ref={reportRef} className="scroll-mt-36">
              <ShopBatchReport report={report} />
            </div>
          ) : null}

          {languages.length > 1 ? (
            <ShopLanguageFilter
              languages={languages}
              value={languageFilter}
              disabled={batching}
              onChange={setLanguageFilter}
            />
          ) : null}

          {listed.length === 0 ? (
            <p className="m-0 text-sm text-muted">Aucun pack pour cette langue.</p>
          ) : (
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
          )}

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

          {listed.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-busy={batching}>
              {listed.map((pack) => (
                <ShopPackRow
                  key={pack.id}
                  pack={pack}
                  selected={selectedIds.has(pack.id)}
                  disabled={batching}
                  onToggleSelected={() => toggleOne(pack.id)}
                  onToggleActive={() => void toggleActive(pack)}
                  onDelete={() => void deletePack(pack.id)}
                />
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ShopLanguageFilter({
  languages,
  value,
  disabled,
  onChange,
}: {
  languages: readonly string[];
  value: string | null;
  disabled: boolean;
  onChange: (language: string | null) => void;
}) {
  const options = [null, ...languages];
  return (
    <div role="group" aria-label="Filtrer par langue" className="flex flex-wrap gap-2">
      {options.map((code) => {
        const selected = value === code;
        return (
          <button
            key={code ?? "all"}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(code)}
            className={`inline-flex min-h-11 items-center rounded-lg border-[1.5px] px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
              selected ? "border-ink bg-mark text-ink" : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            {code ? languageLabel(code) : "Toutes les langues"}
          </button>
        );
      })}
    </div>
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
  const synced = pack.isActive && pack.stripeProductId && pack.stripePriceId;
  return (
    <li className={`flex gap-3 rounded-[14px] border bg-surface p-4 ${selected ? "border-ink" : "border-line"}`}>
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
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink">
          <Package size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[15px] font-medium text-ink">{pack.title}</p>
          {pack.description ? <p className="m-0 mt-1 text-sm text-muted">{pack.description}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="inline-flex h-7 items-center rounded-lg border-[1.5px] border-ink bg-surface px-2 text-[11px] font-medium tracking-wide text-ink">
              {languageLabel(pack.language)}
            </span>
            <span>
              {frCount(pack.wordCount, "mot", "mots")} · {frCount(pack.expressionCount, "expression", "expressions")} ·{" "}
              {formatShopPriceCents(pack.price)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                synced ? "bg-just-bg text-just-text" : "bg-page text-muted"
              }`}
            >
              Stripe : {synced ? "synchronisé" : "non synchronisé"}
            </span>
          </div>
          <p className="m-0 mt-2 text-sm font-medium text-ink">
            {frCount(pack.sales, "vente", "ventes")} · {formatEuro(pack.revenue / 100)} générés
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
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
            {pack.isActive ? "Actif" : "Inactif"}
          </span>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={disabled}
            aria-label={pack.isActive ? `Désactiver ${pack.title}` : `Activer ${pack.title}`}
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
