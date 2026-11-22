export type ShopPackWord = {
  term: string;
  definition: string;
  isExpression?: boolean;
};

export function parseShopPackWords(wordsJson: string | null | undefined): ShopPackWord[] {
  if (!wordsJson) return [];
  try {
    const parsed = JSON.parse(wordsJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ShopPackWord =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as ShopPackWord).term === "string" &&
        typeof (row as ShopPackWord).definition === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Contenu complet d'un pack, tel qu'il est stocké (term, definition, isExpression).
 * Une forme invalide est une erreur : on n'écrit pas une liste à moitié.
 */
export function requireShopPackWords(wordsJson: string | null | undefined): ShopPackWord[] {
  if (wordsJson == null || wordsJson.trim() === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(wordsJson);
  } catch {
    throw new Error("words_json illisible");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("words_json doit être un tableau");
  }
  return parsed.map((row, index) => {
    if (typeof row !== "object" || row === null) {
      throw new Error(`words_json[${index}] est invalide`);
    }
    const record = row as { term?: unknown; definition?: unknown; isExpression?: unknown };
    if (typeof record.term !== "string" || record.term.trim() === "") {
      throw new Error(`words_json[${index}] n'a pas de terme`);
    }
    if (typeof record.definition !== "string") {
      throw new Error(`words_json[${index}] n'a pas de définition`);
    }
    if (record.isExpression != null && typeof record.isExpression !== "boolean") {
      throw new Error(`words_json[${index}] a un type d'expression invalide`);
    }
    return {
      term: record.term,
      definition: record.definition,
      isExpression: record.isExpression ?? false,
    };
  });
}

export function countShopPackContents(wordsJson: string | null | undefined): {
  wordCount: number;
  expressionCount: number;
} {
  const words = parseShopPackWords(wordsJson);
  return {
    wordCount: words.filter((w) => !w.isExpression).length,
    expressionCount: words.filter((w) => w.isExpression).length,
  };
}

export function shopPackPreviewTerms(wordsJson: string | null | undefined, limit = 4): string[] {
  return parseShopPackWords(wordsJson)
    .filter((w) => !w.isExpression)
    .slice(0, limit)
    .map((w) => w.term);
}

export function shopPackPreviewVocabulary(
  wordsJson: string | null | undefined,
  wordLimit = 6,
  expressionLimit = 3
) {
  const words = parseShopPackWords(wordsJson).filter((w) => !w.isExpression);
  const expressions = parseShopPackWords(wordsJson).filter((w) => w.isExpression);
  return {
    words: words.slice(0, wordLimit),
    expressions: expressions.slice(0, expressionLimit),
    previewWordCount: Math.min(words.length, wordLimit),
    previewExpressionCount: Math.min(expressions.length, expressionLimit),
  };
}

const PUBLIC_PREVIEW_WORDS = 6;
const PUBLIC_PREVIEW_EXPRESSIONS = 3;

/** Aperçu API : 6 mots + 3 expressions si non possédée ; contenu complet si possédée. */
export function shopPackWordsJsonForClient(
  wordsJson: string | null | undefined,
  owned: boolean
): string | null {
  if (!wordsJson) return null;
  if (owned) return wordsJson;
  const all = parseShopPackWords(wordsJson);
  const preview = [
    ...all.filter((w) => !w.isExpression).slice(0, PUBLIC_PREVIEW_WORDS),
    ...all.filter((w) => w.isExpression).slice(0, PUBLIC_PREVIEW_EXPRESSIONS),
  ];
  return preview.length > 0 ? JSON.stringify(preview) : null;
}