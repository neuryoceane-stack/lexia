"use client";

import { getShopCoverTheme, shopCoverTitleShort } from "@/lib/shop-cover-theme";
import { shopPackPreviewTerms } from "@/lib/shop-pack-preview";
import { formatShopPriceCents } from "@/lib/shop-price";
import type { ShopPackClient } from "./shop-types";

type Props = {
  pack: ShopPackClient;
  focused: boolean;
  onSelect: () => void;
  onBuy: () => void;
  onRevise: () => void;
  buying: boolean;
};

export function ShopCoverCard({ pack, focused, onSelect, onBuy, onRevise, buying }: Props) {
  const theme = getShopCoverTheme(pack.id);
  const terms = shopPackPreviewTerms(pack.wordsJson, 3);
  const shortTitle = shopCoverTitleShort(pack.title);

  return (
    <article
      className={`flex w-[min(100%,220px)] shrink-0 snap-start flex-col scroll-ml-4 sm:w-[220px] ${
        focused ? "relative z-[1]" : ""
      }`}
    >
      <div
        className={`flex h-full flex-col overflow-hidden rounded-2xl border-[1.5px] bg-surface shadow-[var(--shadow-card)] ${
          pack.owned ? "border-ink" : "border-line"
        } ${focused ? "ring-[3px] ring-mark ring-offset-2 ring-offset-page" : ""}`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-h-[168px] flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
        >
          <div
            className="relative mx-2.5 mt-2.5 flex min-h-[148px] flex-1 flex-col overflow-hidden rounded-xl bg-[color-mix(in_srgb,var(--line)_var(--bg-mix)_var(--page))] p-3.5"
            style={{ ["--bg-mix" as string]: `${theme.bgLineMixPercent}%` }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-[-25%] h-[28%] w-[140%] bg-mark opacity-90"
              style={{
                top: `${theme.bandTopPercent}%`,
                transform: `rotate(${theme.bandRotateDeg}deg)`,
              }}
            />
            {theme.accentShape === 0 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 top-3 h-9 w-9 rounded-full border-[1.5px] border-ink opacity-35"
              />
            ) : null}
            {theme.accentShape === 1 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-10 left-3 h-12 w-[3px] rounded-full bg-ink opacity-20"
              />
            ) : null}
            {theme.accentShape === 2 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-8 right-4 h-10 w-10 rounded-lg border-[1.5px] border-ink opacity-25"
                style={{ transform: `rotate(${theme.bandRotateDeg / 3}deg)` }}
              />
            ) : null}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[8%] h-[2px] w-[55%] bg-ink opacity-[0.08]"
              style={{ top: `${theme.subtleLinePercent}%` }}
            />
            {pack.owned ? (
              <span className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-mark px-2 py-1 text-[10px] font-medium text-ink">
                Possédée
              </span>
            ) : null}
            <p className="relative z-[1] font-heading text-[22px] font-bold leading-[1.05] text-ink">{shortTitle}</p>
            <div className="relative z-[1] mt-auto flex flex-col items-end gap-1 pt-3">
              {terms.map((term) => (
                <em
                  key={term}
                  className="inline-block rotate-[2deg] rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium not-italic text-ink shadow-[0_1px_0_color-mix(in_srgb,var(--ink)_12%,transparent)]"
                >
                  {term}
                </em>
              ))}
            </div>
          </div>
        </button>

        <footer className="px-3 pb-3.5 pt-0">
          <button type="button" onClick={onSelect} className="w-full text-left outline-none focus-visible:underline">
            <h3 className="text-sm font-medium text-ink">{pack.title}</h3>
            <p className="mt-1 text-[11px] text-muted">
              {pack.level || "—"}
              {pack.wordCount > 0 ? ` · ${pack.wordCount} mots` : ""}
            </p>
          </button>
          {pack.owned ? (
            <button
              type="button"
              onClick={onRevise}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-surface outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              Réviser
            </button>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-heading text-lg font-bold text-ink">{formatShopPriceCents(pack.price)}</span>
              <button
                type="button"
                disabled={buying}
                onClick={onBuy}
                className="min-h-11 rounded-full bg-ink px-4 text-sm font-medium text-surface outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-70"
              >
                {buying ? "…" : "Acheter"}
              </button>
            </div>
          )}
        </footer>
      </div>
    </article>
  );
}