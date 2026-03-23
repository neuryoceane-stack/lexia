/**
 * Normalise la réponse Claude traduction + exemple (JSON, parfois dans un bloc markdown).
 * Utilisé par /api/translate, l’UI Mots sauvages (défense en profondeur) et les scripts de nettoyage BDD.
 */

function stripMarkdownFences(s: string): string {
  let t = s.replace(/^\uFEFF/, "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "");
  t = t.replace(/\s*```\s*$/i, "").trim();
  return t;
}

function tryParseTranslationObject(
  jsonStr: string
): { translation: string; example: string } | null {
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      "translation" in parsed
    ) {
      const o = parsed as { translation?: unknown; example?: unknown };
      const translation =
        typeof o.translation === "string" ? o.translation.trim() : "";
      const example =
        typeof o.example === "string" ? o.example.trim() : "";
      if (translation.length > 0) {
        return { translation, example };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Extrait `translation` et `example` depuis la sortie texte de Claude.
 * Si ce n’est pas du JSON exploitable, retourne le texte brut comme `translation` et `example` vide.
 */
export function parseClaudeTranslationResponse(raw: string): {
  translation: string;
  example: string;
} {
  const input = (raw ?? "").trim();
  if (!input) {
    return { translation: "", example: "" };
  }

  const stripped = stripMarkdownFences(input);
  const direct = tryParseTranslationObject(stripped);
  if (direct) return direct;

  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const slice = stripped.slice(start, end + 1);
    const nested = tryParseTranslationObject(slice);
    if (nested) return nested;
  }

  return { translation: input, example: "" };
}

/**
 * Si la définition suit « mot_source : traduction » et que la partie gauche
 * correspond au terme (insensible à la casse), retourne uniquement la traduction.
 * Sinon `null` (définition légitime avec « : » au milieu, autre mot à gauche, etc.).
 */
export function stripLeadingTermColonTranslation(
  term: string,
  definition: string
): string | null {
  const t = term.trim();
  const d = definition.trim();
  if (!t || !d) return null;
  const m = d.match(/^(.+?)\s*:\s*([\s\S]+)$/);
  if (!m) return null;
  const left = m[1].trim();
  const right = m[2].trim();
  if (!right) return null;
  if (left.toLowerCase() !== t.toLowerCase()) return null;
  return right;
}
