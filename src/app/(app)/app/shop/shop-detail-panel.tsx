"use client";

import { languageName } from "@/app/(app)/app/revision/revision-ui";
import { formatShopPriceCents } from "@/lib/shop-price";
import { shopPackPreviewTerms, shopPackPreviewVocabulary } from "@/lib/shop-pack-preview";
import type { ShopPackClient } from "./shop-types";

type Props = {
  pack: ShopPackClient;
  buying: boolean;
  onBuy: () => void;
  onRevise: () => void;
};

export function ShopDetailPanel({ pack, buying, onBuy, onRevise }: Props) {
  const preview = shopPackPreviewVocabulary(pack.wordsJson, 6);
  const stackTerms = shopPackPreviewTerms(pack.wordsJson, 3);

  return (
    <article className="mt-6 overflow-hidden rounded-[20px] border-[1.5px] border-line bg-surface lg:mt-7">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,280px)_1fr]">
        <header className="flex flex-col justify-between bg-ink p-5 text-surface sm:p-6">
          <div>
            <h2 className="font-heading text-2xl font-bold leading-tight">{pack.title}</h2>
            <p className="mt-2 text-sm opacity-90">
              {pack.wordCount} mots · {pack.expressionCount} expressions
              {pack.level ? ` · ${pack.level}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex h-7 items-center rounded-lg border border-[color-mix(in_srgb,var(--surface)_45%,transparent)] bg-[color-mix(in_srgb,var(--surface)_12%,transparent)] px-2 text-[11px] font-medium">
                {languageName(pack.language)}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider opacity-75">Aperçu sur la couverture</p>
            {stackTerms.length > 0 ? (
              stackTerms.map((term) => (
                <span
                  key={term}
                  className="w-fit rounded-md bg-[color-mix(in_srgb,var(--surface)_16%,transparent)] px-2 py-1 text-xs font-medium"
                >
                  {term}
                </span>
              ))
            ) : (
              <p className="text-sm opacity-80">{pack.description}</p>
            )}
          </div>
        </header>

        <div className="p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Aperçu du contenu</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {preview.words.map((w) => (
              <div key={w.term} className="rounded-[10px] bg-page px-3 py-2.5">
                <p className="text-sm font-medium text-ink">{w.term}</p>
                <p className="text-xs text-muted">{w.definition}</p>
              </div>
            ))}
            {preview.wordsBlurred ? (
              <>
                <div className="rounded-[10px] bg-page px-3 py-2.5 blur-[4px] select-none" aria-hidden>
                  <p className="text-sm font-medium">···</p>
                  <p className="text-xs">···</p>
                </div>
                <div className="rounded-[10px] bg-page px-3 py-2.5 blur-[4px] select-none" aria-hidden>
                  <p className="text-sm font-medium">···</p>
                  <p className="text-xs">···</p>
                </div>
              </>
            ) : null}
          </div>

          {preview.firstExpression ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Expression</p>
              <p className="mt-2 text-sm text-ink">
                <span className="font-medium">{preview.firstExpression.term}</span>
                <span className="text-muted"> — {preview.firstExpression.definition}</span>
              </p>
            </div>
          ) : null}

          <footer className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            {pack.owned ? (
              <>
                <p className="text-sm text-muted">Cette liste est dans ta bibliothèque.</p>
                <button type="button" onClick={onRevise} className="min-h-11 w-full rounded-full bg-ink px-5 text-sm font-medium text-surface sm:w-auto">
                  Réviser cette liste
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="font-heading text-[28px] font-bold text-ink">{formatShopPriceCents(pack.price)}</p>
                  <p className="text-xs text-muted">Paiement sécurisé · ajout permanent à ta bibliothèque</p>
                </div>
                <button
                  type="button"
                  disabled={buying}
                  onClick={onBuy}
                  className="min-h-11 w-full rounded-full bg-ink px-5 text-sm font-medium text-surface disabled:opacity-70 sm:min-w-[200px] sm:w-auto"
                >
                  {buying ? "Redirection…" : "Acheter cette liste"}
                </button>
              </>
            )}
          </footer>
        </div>
      </div>
    </article>
  );
}