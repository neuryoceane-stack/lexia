import {
  KNOWN_LANGUAGE_CODES,
  LANG_6393_TO_6391,
  PREFERRED_LANGUAGE_OPTIONS,
} from "@/lib/language";

export type TextSegmentBlock = {
  texte: string;
  langueDetectee: string;
};

const LABEL_TO_CODE = Object.fromEntries(
  PREFERRED_LANGUAGE_OPTIONS.map((o) => [o.label.toLowerCase(), o.value])
) as Record<string, string>;

const ISO6391_TO_6393 = Object.fromEntries(
  Object.entries(LANG_6393_TO_6391).map(([k, v]) => [v, k])
) as Record<string, string>;

function stripMarkdownFences(s: string): string {
  let t = s.replace(/^\uFEFF/, "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "");
  t = t.replace(/\s*```\s*$/i, "").trim();
  return t;
}

/** Normalise un code ou libellé langue vers ISO 639-3 (app). */
export function normalizeSegmentLangCode(code: string): string {
  const raw = (code ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (KNOWN_LANGUAGE_CODES.has(raw)) return raw;
  if (raw.length === 2 && ISO6391_TO_6393[raw]) return ISO6391_TO_6393[raw];
  const fromLabel = LABEL_TO_CODE[raw];
  if (fromLabel) return fromLabel;
  return raw;
}

export function segmentLangsMatch(detected: string, sourceLang: string): boolean {
  const a = normalizeSegmentLangCode(detected);
  const b = normalizeSegmentLangCode(sourceLang);
  if (!a || !b) return false;
  return a === b;
}

function readBlockFields(x: unknown): TextSegmentBlock | null {
  if (typeof x !== "object" || x === null) return null;
  const o = x as {
    texte?: unknown;
    text?: unknown;
    langueDetectee?: unknown;
    langue?: unknown;
    language?: unknown;
  };
  const texte = String(o.texte ?? o.text ?? "").trim();
  const langueDetectee = normalizeSegmentLangCode(
    String(o.langueDetectee ?? o.langue ?? o.language ?? "")
  );
  if (!texte) return null;
  return { texte, langueDetectee };
}

/**
 * Parse un tableau JSON de blocs `{ texte, langueDetectee }` renvoyé par Claude.
 */
export function parseClaudeSegmentJson(raw: string): TextSegmentBlock[] {
  const input = (raw ?? "").trim();
  if (!input) return [];

  const stripped = stripMarkdownFences(input);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    try {
      const start = stripped.indexOf("[");
      const end = stripped.lastIndexOf("]");
      if (start === -1 || end <= start) return [];
      parsed = JSON.parse(stripped.slice(start, end + 1));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const blocks: TextSegmentBlock[] = [];
  for (const item of parsed) {
    const block = readBlockFields(item);
    if (block) blocks.push(block);
  }
  return blocks;
}

export function segmentLangLabel(code: string): string {
  const norm = normalizeSegmentLangCode(code);
  return (
    PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === norm)?.label ??
    (code.trim() || "—")
  );
}

/**
 * true si tous les blocs sont étiquetés dans une seule langue = langue source.
 * false si langues mixtes, langue unique différente de la source, ou étiquette manquante.
 */
export function shouldSkipSegmentSelection(
  blocks: Array<{ langueDetectee: string }>,
  sourceLang: string
): boolean {
  if (blocks.length === 0) return false;

  const distinct = new Set<string>();
  for (const block of blocks) {
    const norm = normalizeSegmentLangCode(block.langueDetectee);
    if (!norm) return false;
    distinct.add(norm);
  }

  if (distinct.size !== 1) return false;

  const onlyLang = [...distinct][0];
  return segmentLangsMatch(onlyLang, sourceLang);
}
