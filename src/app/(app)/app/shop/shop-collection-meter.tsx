"use client";

import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";

type Props = {
  language: string;
  ownedCount: number;
  totalCount: number;
};

export function ShopCollectionMeter({ language, ownedCount, totalCount }: Props) {
  const label =
    PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? language.toUpperCase();
  const ratio = totalCount > 0 ? Math.min(100, (ownedCount / totalCount) * 100) : 0;

  return (
    <section className="rounded-2xl border-[1.5px] border-line bg-surface px-4 py-4 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="shrink-0">
          <p className="text-sm font-medium text-muted">Votre collection {label.toLowerCase()}</p>
          <p className="mt-1 font-heading text-[28px] font-bold leading-none text-ink sm:text-[32px]">
            {ownedCount}
            <span className="ml-1 font-sans text-base font-normal text-muted">sur {totalCount}</span>
          </p>
        </div>
        <div
          className="grid min-w-0 w-full max-w-full grid-cols-8 gap-1.5 sm:max-w-[min(100%,22.5rem)] lg:max-w-[min(100%,36rem)] lg:grid-cols-12 xl:grid-cols-16"
          aria-hidden
        >
          {Array.from({ length: totalCount }, (_, index) => (
            <span
              key={index}
              className={`flex aspect-[3/4] w-full max-w-9 items-center justify-center justify-self-start rounded-md border-[1.5px] ${
                index < ownedCount
                  ? "border-ink bg-[color-mix(in_srgb,var(--line)_38%,var(--page))]"
                  : "border-dashed border-line bg-transparent"
              }`}
            >
              {index < ownedCount ? (
                <span className="block h-1.5 w-[70%] rotate-[-6deg] bg-mark" />
              ) : null}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--line)_38%,var(--page))]">
        <div className="h-full rounded-full bg-mark transition-[width] duration-300" style={{ width: `${ratio}%` }} />
      </div>
    </section>
  );
}