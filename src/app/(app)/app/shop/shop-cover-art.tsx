"use client";

import type { ShopCoverTheme } from "@/lib/shop-cover-theme";

export function ShopCoverArt({ theme }: { theme: ShopCoverTheme }) {
  const twist = theme.twist;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {theme.variant === "diagonal" ? (
        <span
          className="absolute left-[-30%] z-[1] h-[32%] w-[150%] bg-mark opacity-90"
          style={{ top: `${28 + (twist % 10)}%`, transform: `rotate(${twist}deg)` }}
        />
      ) : null}

      {theme.variant === "vertical" ? (
        <span
          className="absolute bottom-0 left-[18%] top-[12%] z-[1] w-[24%] bg-mark opacity-85"
          style={{ transform: `skewY(${twist / 4}deg)` }}
        />
      ) : null}

      {theme.variant === "lowBand" ? (
        <span
          className="absolute bottom-[8%] left-[-10%] z-[1] h-[22%] w-[120%] bg-mark opacity-90"
          style={{ transform: `rotate(${twist / 5}deg)` }}
        />
      ) : null}

      {theme.variant === "rounded" ? (
        <span
          className="absolute right-[-6%] top-[6%] z-[1] h-[44%] w-[50%] rounded-[28px] bg-mark opacity-85"
          style={{ transform: `rotate(${twist}deg)` }}
        />
      ) : null}

      {theme.variant === "stripes" ? (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2.5 opacity-90">
          {[-1, 0, 1].map((offset) => (
            <span
              key={offset}
              className="h-[9px] w-[145%] bg-mark"
              style={{
                transform: `rotate(${twist + offset * 7}deg)`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}