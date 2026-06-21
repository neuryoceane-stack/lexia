import { franc } from "franc";

/** Union Jack (GB) pour la langue anglaise — aligné sur public/flags/gb.png. */
const FLAG_GB_EMOJI = "\u{1F1EC}\u{1F1E7}";

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
  { value: "zho", label: "Mandarin" },
  { value: "ell", label: "Grec" },
];

/** Codes des langues qui ont un drapeau dans public/flags (évite d’afficher un mauvais drapeau pour des codes comme sco → SC). */
export const KNOWN_LANGUAGE_CODES = new Set(
  PREFERRED_LANGUAGE_OPTIONS.map((o) => o.value)
);

/**
 * Mapping ISO 639-3 (app) → ISO 639-1 (API MyMemory / translate).
 */
export const LANG_6393_TO_6391: Record<string, string> = {
  eng: "en",
  fra: "fr",
  spa: "es",
  deu: "de",
  ita: "it",
  por: "pt",
  nld: "nl",
  pol: "pl",
  rus: "ru",
  jpn: "ja",
  zho: "zh",
  ell: "el",
  ara: "ar",
  hin: "hi",
  kor: "ko",
  tur: "tr",
  swe: "sv",
  dan: "da",
  nor: "no",
  fin: "fi",
  ces: "cs",
  ron: "ro",
  hun: "hu",
  ukr: "uk",
  heb: "he",
  tha: "th",
  vie: "vi",
  ind: "id",
  msa: "ms",
};

export function toIso6391(code: string): string {
  const c = (code ?? "").trim().toLowerCase();
  if (c.length === 2) return c;
  return LANG_6393_TO_6391[c] ?? c.slice(0, 2);
}

/**
 * Retourne le code pays 2 lettres (ISO 3166-1 alpha-2) pour un code langue (ISO 639-3).
 * Utilisé pour les images drapeaux dans public/flags (ex. fra → fr, eng → gb).
 */
export function getFlagCountryCode(langOrCountry: string): string {
  const raw = (langOrCountry ?? "").trim();
  if (raw.length === 2) return raw.toUpperCase();
  const norm = raw.toLowerCase();
  return (LANG_TO_COUNTRY[norm] ?? norm.slice(0, 2).toUpperCase()).toUpperCase();
}

/**
 * Chemin vers l’image drapeau (public/flags/xx.png).
 * Les fichiers doivent faire 32×32 px (ou 48×48 px), format PNG.
 */
export function getFlagImagePath(langOrCountry: string): string {
  if (!langOrCountry) return "";
  const norm = langOrCountry.toLowerCase().trim();
  if (norm === "eng" || norm === "en") return "/flags/gb.png";
  const code = getFlagCountryCode(langOrCountry).toLowerCase();
  if (code.length < 2) return "";
  return `/flags/${code}.png`;
}

/**
 * Retourne l’emoji drapeau pour un code langue (ISO 639-3) ou un code pays (2 lettres).
 * Les regional indicators vont de U+1F1E6 (A) à U+1F1FF (Z).
 */
export function getFlagEmoji(langOrCountry: string): string {
  const norm = (langOrCountry ?? "").toLowerCase().trim();
  if (!norm) return "";
  if (norm === "eng" || norm === "en") return FLAG_GB_EMOJI;
  const code =
    norm.length === 3
      ? (LANG_TO_COUNTRY[norm] ?? norm.slice(0, 2).toUpperCase())
      : norm.slice(0, 2).toUpperCase();
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

/**
 * Pour les écrans où seules les langues « préférées » sont proposées (ex. Mots sauvages) :
 * détecte la langue du texte et retourne le code ISO 639-3 si elle est dans la liste, sinon `fallback`.
 */
export function resolvePreferredSourceLangFromText(
  text: string,
  fallback: string = "eng"
): string {
  const detected = detectLanguage(text);
  if (detected && KNOWN_LANGUAGE_CODES.has(detected)) return detected;
  return fallback;
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
