"use client";

import type { ShopSelectionCopy } from "@/lib/shop-price";

type Props = {
  copy: ShopSelectionCopy | null;
  error: string | null;
  paying: boolean;
  onPay: () => void;
  onClear: () => void;
};

export function ShopSelectionBar({ copy, error, paying, onPay, onClear }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-[76px] z-40 border-t border-line bg-surface px-4 py-3 md:bottom-6 md:left-1/2 md:w-[min(720px,calc(100%-2rem))] md:-translate-x-1/2 md:rounded-[20px] md:border-[1.5px]"
      role="region"
      aria-label="Sélection à payer"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {error ? (
            <p className="text-sm text-ink">{error}</p>
          ) : copy ? (
            <>
              <p className="font-heading text-lg font-bold text-ink">
                {copy.countLabel}
                <span className="mx-2 font-sans text-base font-normal text-muted">·</span>
                {copy.listTotalLabel ? (
                  <s className="mr-2 font-sans text-base font-normal text-muted">{copy.listTotalLabel}</s>
                ) : null}
                {copy.totalLabel}
              </p>
              {copy.lotMessage ? (
                <p className="mt-1 text-sm text-ink">
                  <span className="marker">{copy.lotMessage}</span>
                </p>
              ) : null}
              {copy.hint ? <p className="mt-1 text-sm text-muted">{copy.hint}</p> : null}
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 rounded-full px-4 text-sm font-medium text-muted outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            Vider
          </button>
          {copy && !error ? (
            <button
              type="button"
              onClick={onPay}
              disabled={paying}
              className="min-h-11 flex-1 rounded-full bg-ink px-5 text-sm font-medium text-surface outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-70 sm:flex-none"
            >
              {paying ? "Redirection…" : `Payer ${copy.totalLabel}`}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
