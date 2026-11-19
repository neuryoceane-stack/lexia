"use client";

import { languageName } from "@/app/(app)/app/revision/revision-ui";
import { shopPackRemainingHint } from "@/lib/shop-cover-theme";
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
  const preview = shopPackPreviewVocabulary(pack.wordsJson, 6, 3);
  const stackTerms = shopPackPreviewTerms(pack.wordsJson, 3);
  const remainingHint = shopPackRemainingHint(
    pack.owned,
    pack.wordCount,
    pack.expressionCount,
    preview.previewWordCount,
    preview.previewExpressionCount
  );

  return (
    <article className="mt-6 overflow-hidden rounded-[20px] border-[1.5px] border-line bg-surface lg:mt-7">
      <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(240px,280px)_1fr]">
        <header className="bg-ink p-5 text-surface sm:p-6 lg:rounded-tl-[18px]">
          <h2 className="font-heading text-2xl font-bold leading-tight">{pack.title}</h2>
          <p className="mt-2 text-sm opacity-90">
            {pack.wordCount} mots · {pack.expressionCount} expressions
            {pack.level ? ` · ${pack.level}` : ""}
          </p>
          <span className="mt-3 inline-flex h-7 items-center rounded-lg border border-[color-mix(in_srgb,var(--surface)_45%,transparent)] bg-[color-mix(in_srgb,var(--surface)_12%,transparent)] px-2 text-[11px] font-medium">
            {languageName(pack.language)}
          </span>
          <div className="mt-4 flex flex-col gap-1.5">
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
          </div>

          {preview.expressions.length > 0 ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Expressions</p>
              <ul className="mt-2 space-y-2">
                {preview.expressions.map((w) => (
                  <li key={w.term} className="text-sm text-ink">
                    <span className="font-medium">{w.term}</span>
                    <span className="text-muted"> — {w.definition}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {remainingHint ? (
            <p className="mt-4 text-center text-sm text-muted">{remainingHint}</p>
          ) : null}

          <footer className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            {pack.owned ? (
              <>
                <p className="text-sm text-muted">Cette liste est dans votre bibliothèque.</p>
                <button
                  type="button"
                  onClick={onRevise}
                  className="min-h-11 w-full rounded-full bg-ink px-5 text-sm font-medium text-surface sm:w-auto"
                >
                  Réviser cette liste
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="font-heading text-[28px] font-bold text-ink">{formatShopPriceCents(pack.price)}</p>
                  <p className="text-xs text-muted">Paiement sécurisé · ajout permanent à votre bibliothèque</p>
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