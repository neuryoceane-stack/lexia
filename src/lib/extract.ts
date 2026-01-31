export type ExtractedItem = { term: string; definition: string };

const SEPARATORS = [
  /\t/,
  /\s+[–—]\s+/,  // tiret long avec espaces (ex. "la tête — head")
  / [–—] /,
  / - /,
  / : /,
  / :/,
  /:/,
];

/** Enlève puces, tirets de liste et numéros en début de ligne */
function stripListPrefix(line: string): string {
  return line
    .replace(/^\s*[•·*]\s*/, "")           // puce • · *
    .replace(/^\s*[\-–—]\s*/, "")          // tiret - – —
    .replace(/^\d+[.)]\s*/, "")            // "1. " ou "1) "
    .trim();
}

function splitOne(block: string): { term: string; definition: string } | null {
  let line = stripListPrefix(block.trim());
  if (!line) return null;
  let bestIdx = -1;
  let bestLen = 0;
  for (const sep of SEPARATORS) {
    const idx = line.search(sep);
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
      const m = line.slice(idx).match(sep);
      bestIdx = idx;
      bestLen = m ? m[0].length : 1;
    }
  }
  if (bestIdx === -1) return null;
  const term = line.slice(0, bestIdx).trim();
  const definition = line.slice(bestIdx + bestLen).trim();
  return term ? { term, definition } : null;
}

/**
 * Découpe le texte en paires mot / traduction.
 * - D’abord par lignes, puis par blocs séparés par 2+ espaces (PDF sans retours à la ligne).
 * - Chaque bloc est coupé au premier séparateur (tab, " - ", " : ", " – ", ":", etc.).
 * - Si peu d’items trouvés, tente un découpage global par " - " ou " : " puis paires consécutives.
 */
export function parseLinesToItems(rawText: string): ExtractedItem[] {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  const items: ExtractedItem[] = [];

  // 1) Découper en blocs : nouvelle ligne, 2+ espaces, ou " • " (puce entre paires sur une ligne)
  const rawBlocks = normalized.split(/\n|\s{2,}|\s+[•·*]\s+/);
  const blocks = rawBlocks.map((b) => stripListPrefix(b)).filter(Boolean);

  for (const block of blocks) {
    const pair = splitOne(block);
    if (pair) items.push(pair);
  }

  // 2) Si on a très peu d’items pour un texte long, essayer un découpage global par séparateur
  const hasEnoughContent = normalized.length > 80 && /[\s-–—:]/.test(normalized);
  if (hasEnoughContent && items.length <= 1) {
    const byDash = normalized.split(/\s+[–—]\s+/);
    const byColon = normalized.split(/\s+:\s+|\s+:\s*/);
    const parts = byDash.length >= byColon.length ? byDash : byColon;
    if (parts.length >= 2) {
      const paired: ExtractedItem[] = [];
      for (let i = 0; i < parts.length - 1; i += 2) {
        const term = parts[i].trim();
        const definition = parts[i + 1].trim();
        if (term && term.length < 200) paired.push({ term, definition });
      }
      if (paired.length > items.length) return paired;
    }
  }

  // 3) Format alterné : ligne 1 = mot, ligne 2 = traduction, etc.
  if (items.length <= 1 && normalized.includes("\n")) {
    const lines = normalized
      .split(/\n/)
      .map((s) => stripListPrefix(s.trim()))
      .filter(Boolean);
    if (lines.length >= 2) {
      const paired: ExtractedItem[] = [];
      for (let i = 0; i < lines.length - 1; i += 2) {
        const term = lines[i];
        const definition = lines[i + 1];
        if (term && term.length < 200) paired.push({ term, definition });
      }
      if (paired.length > items.length) return paired;
    }
  }

  return items;
}
