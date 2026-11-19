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

export function shopPackPreviewVocabulary(wordsJson: string | null | undefined, wordLimit = 6) {
  const words = parseShopPackWords(wordsJson).filter((w) => !w.isExpression);
  const expressions = parseShopPackWords(wordsJson).filter((w) => w.isExpression);
  return {
    words: words.slice(0, wordLimit),
    wordsBlurred: words.length > wordLimit,
    firstExpression: expressions[0] ?? null,
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