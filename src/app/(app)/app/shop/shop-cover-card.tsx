"use client";

import { Check } from "lucide-react";
import {
  getShopCoverTheme,
  shopCoverTitleShort,
  type ShopCoverVariantId,
} from "@/lib/shop-cover-theme";
import { shopPackPreviewTerms } from "@/lib/shop-pack-preview";
import { formatShopPriceCents } from "@/lib/shop-price";
import { ShopCoverArt } from "./shop-cover-art";
import type { ShopPackClient } from "./shop-types";

type Props = {
  pack: ShopPackClient;
  coverVariant: ShopCoverVariantId;
  focused: boolean;
  selected: boolean;
  priceCents: number;
  onSelect: () => void;
  onToggle: () => void;
  onRevise: () => void;
};

export function ShopCoverCard({
  pack,
  coverVariant,
  focused,
  selected,
  priceCents,
  onSelect,
  onToggle,
  onRevise,
}: Props) {
  const theme = getShopCoverTheme(pack.id, coverVariant);
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
          pack.owned || selected ? "border-ink" : "border-line"
        } ${focused ? "ring-[3px] ring-mark ring-offset-2 ring-offset-page" : ""}`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-h-[168px] flex-1 flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
        >
          <div
            className="relative mx-2.5 mt-2.5 flex min-h-[148px] flex-1 flex-col overflow-hidden rounded-xl p-3.5"
            style={{
              background: `color-mix(in srgb, var(--line) ${theme.bgLineMixPercent}%, var(--page))`,
            }}
          >
            <ShopCoverArt theme={theme} />
            {pack.owned ? (
              <span className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-mark px-2 py-1 text-[10px] font-medium text-ink">
                Possédée
              </span>
            ) : selected ? (
              <span className="absolute left-2.5 top-2.5 z-[2] inline-flex items-center gap-1 rounded-full bg-mark px-2 py-1 text-[10px] font-medium text-ink">
                <Check size={12} aria-hidden />
                Choisie
              </span>
            ) : null}
            <p className="relative z-[2] font-heading text-[22px] font-bold leading-[1.05] text-ink">{shortTitle}</p>
            <div className="relative z-[2] mt-auto flex flex-col items-end gap-1 pt-3">
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
              <span className="font-heading text-lg font-bold text-ink">{formatShopPriceCents(priceCents)}</span>
              <button
                type="button"
                aria-pressed={selected}
                onClick={onToggle}
                className={`min-h-11 rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
                  selected
                    ? "border-[1.5px] border-ink bg-surface text-ink"
                    : "bg-ink text-surface"
                }`}
              >
                {selected ? "Retirer" : "Choisir"}
              </button>
            </div>
          )}
        </footer>
      </div>
    </article>
  );
}