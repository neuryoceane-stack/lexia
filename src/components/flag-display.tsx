"use client";

import { getFlagEmoji, getFlagImagePath } from "@/lib/language";

/**
 * Affiche le drapeau d’une langue : image depuis public/flags si disponible, sinon emoji.
 */
export function FlagDisplay({
  langCode,
  className = "inline-block h-6 w-6",
  size = 24,
}: {
  langCode: string;
  className?: string;
  size?: number;
}) {
  if (!langCode) return null;
  const path = getFlagImagePath(langCode);
  const emoji = getFlagEmoji(langCode);

  if (!path) {
    return (
      <span className={className} style={{ fontSize: size }} aria-hidden>
        {emoji}
      </span>
    );
  }

  return (
    <span
      className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={path}
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <span
        className="absolute inset-0 hidden items-center justify-center text-lg"
        style={{ fontSize: size }}
        aria-hidden
      >
        {emoji}
      </span>
    </span>
  );
}
