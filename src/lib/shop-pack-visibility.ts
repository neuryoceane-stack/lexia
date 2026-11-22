/**
 * Visibilité en lot des packs boutique.
 *
 * Le PATCH `/api/creator/shop` reste le seul endroit qui active un pack,
 * synchronise Stripe et annule en cas d'échec. Ici on l'appelle tel quel,
 * un pack après l'autre : un échec n'interrompt pas les suivants, et Stripe
 * n'est pas sollicité en parallèle.
 */

export type ShopPackRef = {
  id: string;
  title: string;
};

export type ShopPatchOutcome = { ok: true } | { ok: false; reason: string };

export type ShopPackVisibilityFailure = ShopPackRef & {
  reason: string;
};

export type ShopPackVisibilityReport = {
  succeeded: ShopPackRef[];
  failed: ShopPackVisibilityFailure[];
};

export type ShopSelectionState = "none" | "partial" | "all";

const SHOP_LANGUAGE_ORDER = ["fra", "eng", "deu", "spa", "ita"] as const;

/**
 * Cartes « Par langue », dans l'ordre affiché.
 * Les codes sont ceux de `PREFERRED_LANGUAGE_OPTIONS` (`src/lib/language.ts`).
 * Le libellé et le drapeau ne sont pas recopiés ici.
 */
export const CREATOR_SHOP_SUMMARY_LANGUAGES = ["eng", "deu", "spa", "ita"] as const;

export type CreatorShopLanguageSummary = {
  language: string;
  total: number;
  visible: number;
  hidden: number;
};

export type CreatorShopLanguageSection<T> = {
  language: string;
  packs: T[];
};

const LANGUAGE_RANK = new Map<string, number>(
  SHOP_LANGUAGE_ORDER.map((code, index) => [code, index]),
);

const SUMMARY_LANGUAGE_SET = new Set<string>(CREATOR_SHOP_SUMMARY_LANGUAGES);

const GENERIC_PATCH_FAILURE = "Le statut du pack n'a pas pu être modifié.";

const KNOWN_PATCH_ERRORS: Record<string, string> = {
  Unauthorized: "Accès réservé au créateur.",
};

function normalizeLanguage(language: string): string {
  return language.trim().toLowerCase();
}

export function packsInLanguageScope<T extends { language: string }>(
  packs: readonly T[],
  language: string | null | undefined,
): T[] {
  const code = typeof language === "string" ? normalizeLanguage(language) : "";
  if (!code) return [...packs];
  return packs.filter((pack) => normalizeLanguage(pack.language) === code);
}

/**
 * Un second appui sur la langue déjà affichée revient à toutes les langues.
 * Une langue vide revient aussi à toutes les langues.
 */
export function toggleCreatorShopLanguage(
  current: string | null,
  language: string,
): string | null {
  const next = normalizeLanguage(language);
  if (!next) return null;
  if (current && normalizeLanguage(current) === next) return null;
  return next;
}

function finiteCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function countLabel(count: number, singular: string, plural: string): string {
  const n = finiteCount(count);
  return `${n} ${n === 1 ? singular : plural}`;
}

function languageRank(code: string): number {
  const rank = LANGUAGE_RANK.get(code);
  return rank === undefined ? Number.MAX_SAFE_INTEGER : rank;
}

/**
 * Résumé par langue. Anglais, allemand, espagnol et italien sont toujours
 * présents, même à zéro, pour montrer ce qui manque. Les autres langues
 * qui ont des packs suivent. Une langue vide n'est pas comptée.
 */
export function summarizeCreatorShopLanguages<T extends { language: string; isActive: boolean }>(
  packs: readonly T[],
): CreatorShopLanguageSummary[] {
  const counts = new Map<string, { total: number; visible: number }>();
  for (const pack of packs) {
    const code = normalizeLanguage(pack.language);
    if (!code) continue;
    const row = counts.get(code) ?? { total: 0, visible: 0 };
    row.total += 1;
    if (pack.isActive) row.visible += 1;
    counts.set(code, row);
  }

  const extras = [...counts.keys()]
    .filter((code) => !SUMMARY_LANGUAGE_SET.has(code))
    .sort((a, b) => {
      const rankA = languageRank(a);
      const rankB = languageRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b, "fr");
    });

  return [...CREATOR_SHOP_SUMMARY_LANGUAGES, ...extras].map((language) => {
    const row = counts.get(language) ?? { total: 0, visible: 0 };
    return {
      language,
      total: row.total,
      visible: row.visible,
      hidden: row.total - row.visible,
    };
  });
}

/** Sections quand toutes les langues sont affichées : langues qui ont des packs, puis langue absente. */
export function creatorShopLanguageSections<T extends { language: string; isActive: boolean }>(
  packs: readonly T[],
): CreatorShopLanguageSection<T>[] {
  const order = summarizeCreatorShopLanguages(packs)
    .filter((row) => row.total > 0)
    .map((row) => row.language);

  const sections: CreatorShopLanguageSection<T>[] = order.map((language) => ({
    language,
    packs: packs.filter((pack) => normalizeLanguage(pack.language) === language),
  }));
  const unlabeled = packs.filter((pack) => !normalizeLanguage(pack.language));
  if (unlabeled.length > 0) {
    sections.push({ language: "", packs: unlabeled });
  }
  return sections;
}

/** Visibles d'abord, masqués ensuite. L'ordre d'origine est conservé dans chaque groupe. */
export function groupPacksByVisibility<T extends { isActive: boolean }>(
  packs: readonly T[],
): { visible: T[]; hidden: T[] } {
  const visible: T[] = [];
  const hidden: T[] = [];
  for (const pack of packs) {
    if (pack.isActive) visible.push(pack);
    else hidden.push(pack);
  }
  return { visible, hidden };
}

/** Compte à côté d'une langue : « 12 / 16 visibles ». */
export function formatVisibleCount(visible: number, total: number): string {
  return `${finiteCount(visible)} / ${finiteCount(total)} visibles`;
}

/** Au-dessus de la liste : « Toutes les langues · 64 packs » ou « Anglais · 16 packs ». */
export function formatShopScopeLabel(
  languageName: string | null | undefined,
  packCount: number,
): string {
  const name =
    typeof languageName === "string" && languageName.trim()
      ? languageName.trim()
      : "Toutes les langues";
  return `${name} · ${countLabel(packCount, "pack", "packs")}`;
}

/** « 16 packs · 12 visibles · 4 masqués ». */
export function formatLanguagePackSummary(total: number, visible: number, hidden: number): string {
  return `${countLabel(total, "pack", "packs")} · ${countLabel(visible, "visible", "visibles")} · ${countLabel(hidden, "masqué", "masqués")}`;
}

export function orderedShopLanguages(languages: readonly string[]): string[] {
  const present = new Set<string>();
  for (const language of languages) {
    const code = language.trim();
    if (code) present.add(code);
  }
  return [...present].sort((a, b) => {
    const rankA = LANGUAGE_RANK.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rankB = LANGUAGE_RANK.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return a.localeCompare(b, "fr");
  });
}

export function selectionState(
  scopeIds: readonly string[],
  selectedIds: ReadonlySet<string>,
): ShopSelectionState {
  if (scopeIds.length === 0) return "none";
  let selected = 0;
  for (const id of scopeIds) {
    if (selectedIds.has(id)) selected += 1;
  }
  if (selected === 0) return "none";
  if (selected === scopeIds.length) return "all";
  return "partial";
}

/** Coche ou décoche uniquement les packs du filtre courant. */
export function toggleScopeSelection(
  scopeIds: readonly string[],
  selectedIds: ReadonlySet<string>,
): Set<string> {
  const next = new Set(selectedIds);
  if (scopeIds.length === 0) return next;
  if (selectionState(scopeIds, selectedIds) === "all") {
    for (const id of scopeIds) next.delete(id);
    return next;
  }
  for (const id of scopeIds) next.add(id);
  return next;
}

export function confirmPackVisibilityMessage(count: number, isActive: boolean): string {
  const n = Math.max(0, Math.trunc(count));
  if (isActive) {
    if (n <= 1) return "Rendre visible 1 pack ? Il sera créé dans Stripe.";
    return `Rendre visibles ${n} packs ? Chacun sera créé dans Stripe.`;
  }
  if (n <= 1) return "Masquer 1 pack ? Il ne sera plus proposé dans la boutique.";
  return `Masquer ${n} packs ? Ils ne seront plus proposés dans la boutique.`;
}

function packClause(count: number, singular: string, plural: string): string {
  const n = Math.max(0, Math.trunc(count));
  return `${n} ${n > 1 ? "packs" : "pack"} ${n > 1 ? plural : singular}`;
}

export function formatPackVisibilitySummary(
  succeeded: number,
  failed: number,
  isActive: boolean,
): string {
  const success = isActive
    ? packClause(succeeded, "rendu visible", "rendus visibles")
    : packClause(succeeded, "masqué", "masqués");
  const failures = Math.max(0, Math.trunc(failed));
  if (failures === 0) return `${success}.`;
  return `${success}, ${failures} en échec.`;
}

export function reasonFromShopPatchBody(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error: unknown }).error;
    if (typeof error === "string" && error.trim()) {
      const message = error.trim();
      return KNOWN_PATCH_ERRORS[message] ?? message;
    }
  }
  return `Le statut du pack n'a pas pu être modifié (code ${status}).`;
}

export function reasonFromThrown(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (
      message === "Failed to fetch" ||
      message === "NetworkError when attempting to fetch resource."
    ) {
      return "La requête n'a pas abouti. Vérifiez la connexion et réessayez.";
    }
    if (message) return message;
  }
  return GENERIC_PATCH_FAILURE;
}

function cleanReason(reason: string): string {
  const trimmed = reason.trim();
  return trimmed || GENERIC_PATCH_FAILURE;
}

export async function applyPackVisibilitySequentially(
  packs: readonly ShopPackRef[],
  isActive: boolean,
  patchPack: (pack: ShopPackRef, isActive: boolean) => Promise<ShopPatchOutcome>,
  hooks?: {
    onPackStart?: (pack: ShopPackRef, index: number, total: number) => void;
  },
): Promise<ShopPackVisibilityReport> {
  const succeeded: ShopPackRef[] = [];
  const failed: ShopPackVisibilityFailure[] = [];
  const total = packs.length;

  for (let index = 0; index < total; index += 1) {
    const pack = packs[index];
    hooks?.onPackStart?.(pack, index, total);
    try {
      const outcome = await patchPack(pack, isActive);
      if (outcome.ok) {
        succeeded.push({ id: pack.id, title: pack.title });
      } else {
        failed.push({ id: pack.id, title: pack.title, reason: cleanReason(outcome.reason) });
      }
    } catch (error) {
      failed.push({ id: pack.id, title: pack.title, reason: reasonFromThrown(error) });
    }
  }

  return { succeeded, failed };
}
