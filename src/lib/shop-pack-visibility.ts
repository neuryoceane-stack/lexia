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

const LANGUAGE_RANK = new Map<string, number>(
  SHOP_LANGUAGE_ORDER.map((code, index) => [code, index]),
);

const GENERIC_PATCH_FAILURE = "Le statut du pack n'a pas pu être modifié.";

const KNOWN_PATCH_ERRORS: Record<string, string> = {
  Unauthorized: "Accès réservé au créateur.",
};

export function packsInLanguageScope<T extends { language: string }>(
  packs: readonly T[],
  language: string | null | undefined,
): T[] {
  const code = typeof language === "string" ? language.trim() : "";
  if (!code) return [...packs];
  return packs.filter((pack) => pack.language === code);
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
