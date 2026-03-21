import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";

const FLAG_BY_LANG: Record<string, string> = {
  fra: "🇫🇷",
  eng: "🇬🇧",
  spa: "🇪🇸",
  deu: "🇩🇪",
  ita: "🇮🇹",
  por: "🇵🇹",
  nld: "🇳🇱",
  pol: "🇵🇱",
  rus: "🇷🇺",
  jpn: "🇯🇵",
  zho: "🇨🇳",
  ell: "🇬🇷",
};

/** Drapeau emoji + libellé pour une langue ISO 639-3. */
export function getLanguageDisplay(code: string | null | undefined): {
  flag: string;
  label: string;
} | null {
  if (!code?.trim()) return null;
  const c = code.trim().toLowerCase();
  const opt = PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === c);
  return {
    flag: FLAG_BY_LANG[c] ?? "🌐",
    label: opt?.label ?? c.toUpperCase(),
  };
}
