/** Utilitaires client : enregistrement de mots dans une liste existante. */

export type SaveWordItem = {
  term: string;
  definition: string;
};

export type VocabListOption = {
  id: string;
  familyId: string;
  name: string;
  language: string | null;
};

export async function fetchExistingLists(): Promise<VocabListOption[]> {
  const res = await fetch("/api/bibliotheque?sort=alpha");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !Array.isArray(data.lists)) return [];
  return data.lists.map(
    (l: {
      id: string;
      familyId: string;
      name: string;
      language?: string | null;
    }) => ({
      id: l.id,
      familyId: l.familyId,
      name: l.name,
      language: l.language ?? null,
    })
  );
}

/** Insère des mots dans une liste existante (doublons ignorés côté serveur). */
export async function saveWordsToExistingList(
  listId: string,
  words: SaveWordItem[]
): Promise<number> {
  const normalizedWords = words
    .map((w) => ({
      term: w.term.trim(),
      definition: w.definition.trim(),
    }))
    .filter((w) => w.term.length > 0);

  const res = await fetch(`/api/listes/${listId}/mots/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words: normalizedWords }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Erreur lors de l'enregistrement"
    );
  }
  return typeof data.count === "number" ? data.count : normalizedWords.length;
}
