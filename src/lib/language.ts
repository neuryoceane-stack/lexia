import { franc } from "franc";

/** Drapeau Angleterre (séquence Unicode subdivision gbeng). */
const FLAG_ENGLAND = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";

/** ISO 639-3 (franc) → code pays 2 lettres pour drapeau (ou drapeau spécial pour eng). */
const LANG_TO_COUNTRY: Record<string, string> = {
  fra: "FR",
  eng: "GB",
  spa: "ES",
  deu: "DE",
  ita: "IT",
  por: "PT",
  nld: "NL",
  pol: "PL",
  rus: "RU",
  jpn: "JP",
  zho: "CN",
  ara: "SA",
  hin: "IN",
  kor: "KR",
  tur: "TR",
  swe: "SE",
  dan: "DK",
  nor: "NO",
  fin: "FI",
  ell: "GR",
  ces: "CZ",
  ron: "RO",
  hun: "HU",
  ukr: "UA",
  heb: "IL",
  tha: "TH",
  vie: "VN",
  ind: "ID",
  msa: "MY",
};

/**
 * Langues proposées pour la préférence utilisateur et le sélecteur de liste (drapeaux dans public/flags).
 */
export const PREFERRED_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "fra", label: "Français" },
  { value: "eng", label: "Anglais" },
  { value: "spa", label: "Espagnol" },
  { value: "deu", label: "Allemand" },
  { value: "ita", label: "Italien" },
  { value: "por", label: "Portugais" },
  { value: "nld", label: "Néerlandais" },
  { value: "pol", label: "Polonais" },
  { value: "rus", label: "Russe" },
  { value: "jpn", label: "Japonais" },
  { value: "zho", label: "Chinois" },
  { value: "ell", label: "Grec" },
];

/**
 * Retourne le code pays 2 lettres (ISO 3166-1 alpha-2) pour un code langue (ISO 639-3).
 * Utilisé pour les images drapeaux dans public/flags (ex. fra → fr, eng → gb).
 */
export function getFlagCountryCode(langOrCountry: string): string {
  if (langOrCountry.length === 2) return langOrCountry.toUpperCase();
  return (LANG_TO_COUNTRY[langOrCountry] ?? langOrCountry.slice(0, 2).toUpperCase()).toUpperCase();
}

/**
 * Chemin vers l’image drapeau (public/flags/xx.png).
 * Les fichiers doivent faire 32×32 px (ou 48×48 px), format PNG.
 */
export function getFlagImagePath(langOrCountry: string): string {
  const code = getFlagCountryCode(langOrCountry).toLowerCase();
  if (code.length < 2) return "";
  return `/flags/${code}.png`;
}

/**
 * Retourne l’emoji drapeau pour un code langue (ISO 639-3) ou un code pays (2 lettres).
 * Les regional indicators vont de U+1F1E6 (A) à U+1F1FF (Z).
 */
export function getFlagEmoji(langOrCountry: string): string {
  if (langOrCountry === "eng") return FLAG_ENGLAND;
  const code = langOrCountry.length === 3
    ? (LANG_TO_COUNTRY[langOrCountry] ?? langOrCountry.slice(0, 2).toUpperCase())
    : langOrCountry.slice(0, 2).toUpperCase();
  if (code.length < 2) return "";
  return [...code]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

/**
 * Détecte la langue d’un texte (franc retourne ISO 639-3, ou "und" si indéterminé).
 */
const NORWEGIAN_CODES = new Set(["nob", "nno", "nor"]);
const NORWEGIAN_CHARS = /[æøåÆØÅ]/;
const DANISH_CODES = new Set(["dan"]);
const DANISH_CHARS = /[æøåÆØÅ]/;

export function detectLanguage(text: string): string {
  const t = (text ?? "").trim();
  if (!t) return "und";
  let lang = franc(t, { minLength: 5 });
  if (lang === "und") return "";
  if (NORWEGIAN_CODES.has(lang) && !NORWEGIAN_CHARS.test(t)) {
    lang = "eng";
  }
  if (DANISH_CODES.has(lang) && !DANISH_CHARS.test(t)) {
    lang = "eng";
  }
  return lang;
}

export type DetectedLanguages = {
  termLang: string;
  defLang: string;
  termFlag: string;
  defFlag: string;
};

/**
 * À partir de listes de termes et de définitions, détecte les langues et retourne les drapeaux.
 */
export function detectListLanguages(
  terms: string[],
  definitions: string[]
): DetectedLanguages {
  const termSample = terms.slice(0, 25).join(" ").trim();
  const defSample = definitions.slice(0, 25).join(" ").trim();
  const termLang = detectLanguage(termSample);
  const defLang = detectLanguage(defSample);
  return {
    termLang,
    defLang,
    termFlag: termLang ? getFlagEmoji(termLang) : "",
    defFlag: defLang ? getFlagEmoji(defLang) : "",
  };
}
