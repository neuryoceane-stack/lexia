/**
 * Contenu d'un pack, pour la consultation créateur.
 * La liste de la boutique n'emporte pas words_json : un seul pack est lu à l'ouverture.
 */

import { requireShopPackWords, type ShopPackWord } from "@/lib/shop-pack-preview";

export type ShopPackEntry = {
  term: string;
  definition: string;
  isExpression: boolean;
};

export type ShopPackDetail = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  language: string;
  level: string;
  price: number;
  wordCount: number;
  expressionCount: number;
  entries: ShopPackEntry[];
};

export type ShopPackContentRow = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  language: string;
  level: string;
  price: number;
  wordCount: number;
  expressionCount: number;
  wordsJson: string | null;
};

/** Replie casse, accents et ligatures françaises (œ, æ). Une chaîne vide ne filtre rien. */
export function foldShopPackSearch(value: string): string {
  return value
    .trim()
    .replaceAll("Œ", "oe")
    .replaceAll("œ", "oe")
    .replaceAll("Æ", "ae")
    .replaceAll("æ", "ae")
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function splitShopPackEntries(entries: readonly ShopPackEntry[]): {
  words: ShopPackEntry[];
  expressions: ShopPackEntry[];
} {
  const words: ShopPackEntry[] = [];
  const expressions: ShopPackEntry[] = [];
  for (const entry of entries) {
    if (entry.isExpression) expressions.push(entry);
    else words.push(entry);
  }
  return { words, expressions };
}

export function filterShopPackEntries(
  entries: readonly ShopPackEntry[],
  query: string,
): ShopPackEntry[] {
  const folded = foldShopPackSearch(query);
  if (!folded) return [...entries];
  return entries.filter((entry) => {
    const term = foldShopPackSearch(entry.term);
    const definition = foldShopPackSearch(entry.definition);
    return term.includes(folded) || definition.includes(folded);
  });
}

function toEntry(word: ShopPackWord): ShopPackEntry {
  return {
    term: word.term,
    definition: word.definition,
    isExpression: word.isExpression === true,
  };
}

/** Message français pour une erreur de words_json. Le numéro d'entrée commence à 1. */
export function shopPackContentErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const message = error.message;
  if (message === "words_json illisible") return "Le contenu de ce pack est illisible.";
  if (message === "words_json doit être un tableau") return "Le contenu de ce pack n'est pas une liste.";
  const indexed = message.match(
    /^words_json\[(\d+)\] (est invalide|n'a pas de terme|n'a pas de définition|a un type d'expression invalide)$/,
  );
  if (!indexed) return null;
  const position = Number(indexed[1]) + 1;
  switch (indexed[2]) {
    case "est invalide":
      return `L'entrée ${position} du pack est invalide.`;
    case "n'a pas de terme":
      return `L'entrée ${position} du pack n'a pas de terme.`;
    case "n'a pas de définition":
      return `L'entrée ${position} du pack n'a pas de définition.`;
    default:
      return `L'entrée ${position} du pack a un type d'expression invalide.`;
  }
}

/** Une forme invalide est une erreur : on n'affiche pas une liste à moitié. */
export function shopPackDetailFromRow(row: ShopPackContentRow): ShopPackDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    language: row.language,
    level: row.level,
    price: row.price,
    wordCount: row.wordCount,
    expressionCount: row.expressionCount,
    entries: requireShopPackWords(row.wordsJson).map(toEntry),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Réponse de GET /api/creator/shop/[id]. Une forme inattendue est refusée. */
export function parseShopPackDetail(data: unknown): ShopPackDetail | null {
  if (!isRecord(data)) return null;
  if (typeof data.id !== "string" || data.id.trim() === "") return null;
  if (typeof data.title !== "string") return null;
  if (typeof data.description !== "string") return null;
  if (typeof data.emoji !== "string") return null;
  if (typeof data.language !== "string") return null;
  if (typeof data.level !== "string") return null;
  const price = finiteNumber(data.price);
  const wordCount = finiteNumber(data.wordCount);
  const expressionCount = finiteNumber(data.expressionCount);
  if (price === null || wordCount === null || expressionCount === null) return null;
  if (!Array.isArray(data.entries)) return null;

  const entries: ShopPackEntry[] = [];
  for (const row of data.entries) {
    if (!isRecord(row)) return null;
    if (typeof row.term !== "string" || typeof row.definition !== "string") return null;
    if (typeof row.isExpression !== "boolean") return null;
    entries.push({
      term: row.term,
      definition: row.definition,
      isExpression: row.isExpression,
    });
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    emoji: data.emoji,
    language: data.language,
    level: data.level,
    price,
    wordCount,
    expressionCount,
    entries,
  };
}
