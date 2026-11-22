"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { FlagDisplay } from "@/components/flag-display";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import {
  filterShopPackEntries,
  foldShopPackSearch,
  parseShopPackDetail,
  splitShopPackEntries,
  type ShopPackDetail,
  type ShopPackEntry,
} from "@/lib/shop-pack-contents";
import { formatShopPriceCents } from "@/lib/shop-price";
import { ErrorNote, fieldClass, primaryButtonClass } from "./creator-ui";

export type ShopPackInspect = {
  id: string;
  title: string;
  emoji: string;
  language: string;
  level: string;
  price: number;
  wordCount: number;
  expressionCount: number;
};

function languageLabel(code: string): string {
  const normalized = code.trim().toLowerCase();
  return PREFERRED_LANGUAGE_OPTIONS.find((option) => option.value === normalized)?.label ?? code.trim().toUpperCase();
}

function priceLabel(cents: number): string {
  if (Number.isFinite(cents) && cents >= 0) return formatShopPriceCents(cents);
  return "Prix indisponible";
}

function frCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function errorText(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const message = (body as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function CreatorShopPackPanel({
  pack,
  onClose,
}: {
  pack: ShopPackInspect;
  onClose: () => void;
}) {
  const titleId = useId();
  const searchId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = useState<ShopPackDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setQuery("");
  }, [pack.id]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetail(null);
    void (async () => {
      try {
        const response = await fetch(`/api/creator/shop/${encodeURIComponent(pack.id)}`, {
          signal: controller.signal,
        });
        const body: unknown = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setError(errorText(body, "Le contenu de ce pack n'a pas pu être chargé."));
          return;
        }
        const parsed = parseShopPackDetail(body);
        if (!parsed || parsed.id !== pack.id) {
          setError("Le contenu de ce pack n'a pas pu être chargé.");
          return;
        }
        setDetail(parsed);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Le contenu de ce pack n'a pas pu être chargé.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [pack.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>("button, input, [href], [tabindex]")].filter(
        (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const source = detail ?? pack;
  const emoji = source.emoji.trim() || "📦";
  const level = source.level.trim();
  const filtering = foldShopPackSearch(query) !== "";
  const grouped = useMemo(() => {
    if (!detail) return null;
    const all = splitShopPackEntries(detail.entries);
    const shown = splitShopPackEntries(filterShopPackEntries(detail.entries, query));
    return { all, shown };
  }, [detail, query]);

  const wordTotal = grouped ? grouped.all.words.length : pack.wordCount;
  const expressionTotal = grouped ? grouped.all.expressions.length : pack.expressionCount;
  const shownWords = grouped?.shown.words.length ?? 0;
  const shownExpressions = grouped?.shown.expressions.length ?? 0;
  const nothingMatches = Boolean(grouped) && filtering && shownWords === 0 && shownExpressions === 0;
  const packEmpty = Boolean(grouped) && grouped?.all.words.length === 0 && grouped?.all.expressions.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-ink/40"
        aria-label="Fermer le pack"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="creator-shop-pack-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={loading}
        className="relative flex h-full w-full flex-col bg-surface shadow-[var(--shadow-elevated)] md:w-[min(560px,100%)] md:border-l md:border-line"
      >
        <header className="shrink-0 border-b border-line px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-line bg-page text-[28px] leading-none" aria-hidden>
                {emoji}
              </span>
              <div className="min-w-0 pt-0.5">
                <h2 id={titleId} className="m-0 break-words font-sans text-[22px] font-medium leading-tight text-ink">
                  {source.title}
                </h2>
                <p className="m-0 mt-1 text-sm text-muted">Consultation du contenu</p>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className={`${primaryButtonClass} shrink-0`}
            >
              <X size={16} aria-hidden />
              Fermer
            </button>
          </div>

          <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
            <li className="inline-flex min-h-8 items-center gap-2 rounded-[12px] border border-line bg-page px-2.5 text-sm text-ink">
              <FlagDisplay langCode={source.language} size={16} className="h-4 w-4" />
              <span>{source.language.trim() ? languageLabel(source.language) : "Langue non renseignée"}</span>
            </li>
            <li className="inline-flex min-h-8 items-center rounded-[12px] border border-line bg-page px-2.5 text-sm text-ink">
              {level || <span className="text-muted">Niveau non renseigné</span>}
            </li>
            <li className="inline-flex min-h-8 items-center rounded-[12px] border border-line bg-page px-2.5 text-sm font-medium tabular-nums text-ink">
              {priceLabel(source.price)}
            </li>
            <li className="inline-flex min-h-8 items-center rounded-[12px] border border-line bg-page px-2.5 text-sm tabular-nums text-ink">
              {frCount(wordTotal, "mot", "mots")}
            </li>
            <li className="inline-flex min-h-8 items-center rounded-[12px] border border-line bg-page px-2.5 text-sm tabular-nums text-ink">
              {frCount(expressionTotal, "expression", "expressions")}
            </li>
          </ul>
          {detail && (wordTotal !== pack.wordCount || expressionTotal !== pack.expressionCount) ? (
            <p className="m-0 mt-3 text-sm text-muted">
              La fiche indique {frCount(pack.wordCount, "mot", "mots")} et{" "}
              {frCount(pack.expressionCount, "expression", "expressions")}. Le fichier en contient{" "}
              {frCount(wordTotal, "mot", "mots")} et {frCount(expressionTotal, "expression", "expressions")}.
            </p>
          ) : null}

          <label htmlFor={searchId} className="mt-4 block text-sm font-medium text-ink">
            Rechercher
            <span className="relative mt-1.5 block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id={searchId}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={!detail}
                placeholder="Terme ou définition"
                autoComplete="off"
                spellCheck={false}
                className={`${fieldClass} pl-10 pr-12 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <X size={16} aria-hidden />
                </button>
              ) : null}
            </span>
          </label>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5">
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          {loading ? <p className="m-0 text-sm text-muted">Chargement des mots…</p> : null}
          {packEmpty ? (
            <p className="m-0 text-sm text-muted">Ce pack ne contient ni mot ni expression.</p>
          ) : null}
          {nothingMatches ? (
            <p className="m-0 text-sm text-muted" role="status">
              Aucun résultat pour « {query.trim()} ».
            </p>
          ) : null}
          {grouped && !packEmpty && !nothingMatches ? (
            <div>
              <p className="sr-only" aria-live="polite">
                {filtering
                  ? `${frCount(shownWords, "mot", "mots")}, ${frCount(shownExpressions, "expression", "expressions")}`
                  : `${frCount(wordTotal, "mot", "mots")}, ${frCount(expressionTotal, "expression", "expressions")}`}
              </p>
              <EntrySection
                title="Mots"
                total={wordTotal}
                entries={grouped.shown.words}
                filtering={filtering}
                emptyLabel={
                  wordTotal === 0
                    ? "Aucun mot dans ce pack."
                    : "Aucun mot ne correspond à votre recherche."
                }
              />
              <EntrySection
                title="Expressions"
                total={expressionTotal}
                entries={grouped.shown.expressions}
                filtering={filtering}
                emptyLabel={
                  expressionTotal === 0
                    ? "Aucune expression dans ce pack."
                    : "Aucune expression ne correspond à votre recherche."
                }
                separated
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EntrySection({
  title,
  total,
  entries,
  filtering,
  emptyLabel,
  separated = false,
}: {
  title: string;
  total: number;
  entries: readonly ShopPackEntry[];
  filtering: boolean;
  emptyLabel: string;
  separated?: boolean;
}) {
  return (
    <section aria-label={title} className={separated ? "mt-6 border-t border-line pt-6" : undefined}>
      <h3 className="m-0 flex items-center gap-2 font-sans text-base font-medium text-ink">
        {title}
        <span className="inline-flex min-h-7 items-center rounded-full bg-mark px-2.5 text-sm font-medium tabular-nums text-ink">
          {filtering ? `${entries.length} sur ${total}` : total}
        </span>
      </h3>
      {entries.length === 0 ? (
        <p className="m-0 mt-3 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {entries.map((entry, index) => (
            <li key={`${index}-${entry.term}`} className="rounded-[14px] border border-line bg-page px-3 py-2.5">
              <p className="m-0 break-words text-sm font-medium text-ink">{entry.term}</p>
              <p className="m-0 mt-0.5 break-words text-sm text-muted">{entry.definition}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
