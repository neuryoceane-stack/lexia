"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, Euro, Package, Plus, ShoppingBag, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
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
};

type PackWord = { term: string; definition: string; isExpression?: boolean };

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
    });
  }
  return packs;
}

export function CreatorShopTab() {
  const { data: packs, loading, error, setError, reload } = useCreatorResource(
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
  const fileRef = useRef<HTMLInputElement>(null);

  async function toggleActive(pack: ShopPack) {
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
    if (!confirm("Voulez-vous supprimer ce pack définitivement ?")) return;
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
    await reload();
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
    if (!form.title || !form.description || words.length === 0) return;
    setSaving(true);
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
  const canSubmit = !saving && Boolean(form.title) && Boolean(form.description) && words.length > 0;

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
        <button type="button" onClick={() => setShowForm((open) => !open)} className={primaryButtonClass}>
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
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {packs.map((pack) => (
            <li key={pack.id} className={`${cardClass} flex flex-col gap-3 p-4 sm:flex-row sm:items-center`}>
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
                    {frCount(pack.wordCount, "mot", "mots")} · {frCount(pack.expressionCount, "expression", "expressions")} · {formatEuro(pack.price / 100)}
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
                  onClick={() => void toggleActive(pack)}
                  aria-label={pack.isActive ? `Désactiver ${pack.title}` : `Activer ${pack.title}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink"
                >
                  {pack.isActive ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={() => void deletePack(pack.id)}
                  aria-label={`Supprimer ${pack.title}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-false-sign bg-false-bg text-false-sign outline-none focus-visible:ring-2 focus-visible:ring-false-sign"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
