/**
 * Visibilité en lot : aucun appel réseau, Stripe ou base.
 * Le PATCH réel est remplacé par une fonction injectée.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PREFERRED_LANGUAGE_OPTIONS } from "./language";
import {
  applyPackVisibilitySequentially,
  confirmPackVisibilityMessage,
  CREATOR_SHOP_SUMMARY_LANGUAGES,
  creatorShopLanguageSections,
  formatLanguagePackSummary,
  formatPackVisibilitySummary,
  formatShopScopeLabel,
  formatVisibleCount,
  groupPacksByVisibility,
  orderedShopLanguages,
  packsInLanguageScope,
  reasonFromShopPatchBody,
  reasonFromThrown,
  selectionState,
  summarizeCreatorShopLanguages,
  toggleCreatorShopLanguage,
  toggleScopeSelection,
  type ShopPackRef,
} from "./shop-pack-visibility";

const PACKS = [
  { id: "eng-1", title: "Environnement", language: "eng" },
  { id: "eng-2", title: "Voyage", language: "eng" },
  { id: "fra-1", title: "Société", language: "fra" },
] as const;

describe("packsInLanguageScope", () => {
  it("garde toute la liste quand aucun filtre n'est choisi", () => {
    assert.deepEqual(
      packsInLanguageScope(PACKS, null).map((pack) => pack.id),
      ["eng-1", "eng-2", "fra-1"],
    );
    assert.deepEqual(
      packsInLanguageScope(PACKS, "  ").map((pack) => pack.id),
      ["eng-1", "eng-2", "fra-1"],
    );
    assert.deepEqual(
      packsInLanguageScope(PACKS, undefined).map((pack) => pack.id),
      ["eng-1", "eng-2", "fra-1"],
    );
  });

  it("limite la sélection à la langue filtrée", () => {
    assert.deepEqual(
      packsInLanguageScope(PACKS, "eng").map((pack) => pack.id),
      ["eng-1", "eng-2"],
    );
    assert.deepEqual(
      packsInLanguageScope(PACKS, " fra ").map((pack) => pack.id),
      ["fra-1"],
    );
  });
});

describe("boutique créateur par langue", () => {
  it("reprend les codes de language.ts, sans en inventer", () => {
    const known = new Set(PREFERRED_LANGUAGE_OPTIONS.map((option) => option.value));
    assert.deepEqual([...CREATOR_SHOP_SUMMARY_LANGUAGES], ["eng", "deu", "spa", "ita"]);
    for (const code of CREATOR_SHOP_SUMMARY_LANGUAGES) {
      assert.equal(known.has(code), true);
    }
  });

  it("affiche les quatre langues même vides, puis les autres qui ont des packs", () => {
    const rows = summarizeCreatorShopLanguages([
      { language: "eng", isActive: true },
      { language: "ENG", isActive: true },
      { language: "eng", isActive: false },
      { language: " spa ", isActive: true },
      { language: "fra", isActive: false },
      { language: "  ", isActive: true },
      { language: "ita", isActive: true },
      { language: "ita", isActive: true },
      { language: "zzz", isActive: false },
    ]);
    assert.deepEqual(
      rows.map((row) => row.language),
      ["eng", "deu", "spa", "ita", "fra", "zzz"],
    );
    assert.deepEqual(rows[0], { language: "eng", total: 3, visible: 2, hidden: 1 });
    assert.deepEqual(rows[1], { language: "deu", total: 0, visible: 0, hidden: 0 });
    assert.deepEqual(rows[2], { language: "spa", total: 1, visible: 1, hidden: 0 });
    assert.deepEqual(rows[3], { language: "ita", total: 2, visible: 2, hidden: 0 });
    assert.deepEqual(rows[4], { language: "fra", total: 1, visible: 0, hidden: 1 });
    assert.equal(formatLanguagePackSummary(16, 12, 4), "16 packs · 12 visibles · 4 masqués");
    assert.equal(formatLanguagePackSummary(1, 1, 0), "1 pack · 1 visible · 0 masqués");
    assert.equal(formatLanguagePackSummary(0, 0, 0), "0 packs · 0 visibles · 0 masqués");
    assert.equal(formatVisibleCount(12, 16), "12 / 16 visibles");
    assert.equal(formatVisibleCount(0, 0), "0 / 0 visibles");
    assert.equal(formatVisibleCount(1.8, -3), "1 / 0 visibles");
  });

  it("regroupe toutes les langues et met les visibles devant", () => {
    const packs = [
      { id: "h1", language: "eng", isActive: false },
      { id: "v1", language: "eng", isActive: true },
      { id: "d1", language: "deu", isActive: true },
      { id: "blank", language: " ", isActive: false },
      { id: "v2", language: "eng", isActive: true },
    ];
    assert.deepEqual(
      creatorShopLanguageSections(packs).map((section) => ({
        language: section.language,
        ids: section.packs.map((pack) => pack.id),
      })),
      [
        { language: "eng", ids: ["h1", "v1", "v2"] },
        { language: "deu", ids: ["d1"] },
        { language: "", ids: ["blank"] },
      ],
    );
    const english = groupPacksByVisibility(packs.filter((pack) => pack.language === "eng"));
    assert.deepEqual(
      english.visible.map((pack) => pack.id),
      ["v1", "v2"],
    );
    assert.deepEqual(
      english.hidden.map((pack) => pack.id),
      ["h1"],
    );
    assert.equal(english.visible.length + english.hidden.length, 3);
  });

  it("limite Tout sélectionner aux packs de la langue affichée", () => {
    const packs = [
      { id: "e1", language: "eng", isActive: true },
      { id: "e2", language: "eng", isActive: false },
      { id: "d1", language: "deu", isActive: true },
      { id: "s1", language: "spa", isActive: false },
    ];
    const englishIds = packsInLanguageScope(packs, "eng").map((pack) => pack.id);
    const selected = toggleScopeSelection(englishIds, new Set(["s1"]));
    assert.deepEqual([...selected].sort(), ["e1", "e2", "s1"]);
    assert.equal(selectionState(englishIds, selected), "all");
    assert.equal(packsInLanguageScope(packs, "deu").some((pack) => selected.has(pack.id)), false);

    const allIds = packsInLanguageScope(packs, null).map((pack) => pack.id);
    const allSelected = toggleScopeSelection(allIds, new Set());
    assert.deepEqual([...allSelected].sort(), ["d1", "e1", "e2", "s1"]);
  });
});

describe("filtre par carte de langue", () => {
  it("revient à toutes les langues au second appui", () => {
    assert.equal(toggleCreatorShopLanguage(null, "eng"), "eng");
    assert.equal(toggleCreatorShopLanguage("eng", "deu"), "deu");
    assert.equal(toggleCreatorShopLanguage("eng", " ENG "), null);
    assert.equal(toggleCreatorShopLanguage("eng", "eng"), null);
    assert.equal(toggleCreatorShopLanguage("deu", "  "), null);
    assert.equal(toggleCreatorShopLanguage(null, ""), null);
  });

  it("nomme le périmètre affiché au-dessus de la liste", () => {
    assert.equal(formatShopScopeLabel(null, 64), "Toutes les langues · 64 packs");
    assert.equal(formatShopScopeLabel(undefined, 64), "Toutes les langues · 64 packs");
    assert.equal(formatShopScopeLabel("  ", 64), "Toutes les langues · 64 packs");
    assert.equal(formatShopScopeLabel("Anglais", 16), "Anglais · 16 packs");
    assert.equal(formatShopScopeLabel(" Allemand ", 1), "Allemand · 1 pack");
    assert.equal(formatShopScopeLabel("Espagnol", 0), "Espagnol · 0 packs");
  });
});

describe("orderedShopLanguages", () => {
  it("ordonne les langues de la boutique et ignore les vides", () => {
    assert.deepEqual(orderedShopLanguages(["ita", "eng", "eng", "fra", "  ", "zzz"]), [
      "fra",
      "eng",
      "ita",
      "zzz",
    ]);
  });
});

describe("sélection", () => {
  const englishIds = ["eng-1", "eng-2"];

  it("ne coche et ne décoche que la langue filtrée", () => {
    let selected = new Set<string>(["fra-1"]);
    selected = toggleScopeSelection(englishIds, selected);
    assert.deepEqual([...selected].sort(), ["eng-1", "eng-2", "fra-1"]);
    assert.equal(selectionState(englishIds, selected), "all");

    selected = toggleScopeSelection(englishIds, selected);
    assert.deepEqual([...selected], ["fra-1"]);
    assert.equal(selectionState(englishIds, selected), "none");
  });

  it("signale une sélection partielle", () => {
    const selected = new Set(["eng-1"]);
    assert.equal(selectionState(englishIds, selected), "partial");
    const next = toggleScopeSelection(englishIds, selected);
    assert.equal(selectionState(englishIds, next), "all");
  });

  it("laisse la sélection intacte si le filtre est vide", () => {
    const selected = new Set(["fra-1"]);
    const next = toggleScopeSelection([], selected);
    assert.deepEqual([...next], ["fra-1"]);
    assert.equal(selectionState([], selected), "none");
  });
});

describe("messages", () => {
  it("demande confirmation avant de créer les produits Stripe", () => {
    assert.equal(
      confirmPackVisibilityMessage(3, true),
      "Rendre visibles 3 packs ? Chacun sera créé dans Stripe.",
    );
    assert.equal(
      confirmPackVisibilityMessage(1, true),
      "Rendre visible 1 pack ? Il sera créé dans Stripe.",
    );
  });

  it("confirme un masquage sans parler de création Stripe", () => {
    assert.equal(
      confirmPackVisibilityMessage(2, false),
      "Masquer 2 packs ? Ils ne seront plus proposés dans la boutique.",
    );
    assert.equal(
      confirmPackVisibilityMessage(1, false),
      "Masquer 1 pack ? Il ne sera plus proposé dans la boutique.",
    );
  });

  it("résume les réussites et les échecs", () => {
    assert.equal(formatPackVisibilitySummary(3, 1, true), "3 packs rendus visibles, 1 en échec.");
    assert.equal(formatPackVisibilitySummary(1, 0, true), "1 pack rendu visible.");
    assert.equal(formatPackVisibilitySummary(0, 2, true), "0 pack rendu visible, 2 en échec.");
    assert.equal(formatPackVisibilitySummary(2, 0, false), "2 packs masqués.");
    assert.equal(formatPackVisibilitySummary(1, 2, false), "1 pack masqué, 2 en échec.");
  });
});

describe("raisons d'échec", () => {
  it("reprend le message du PATCH, notamment Stripe", () => {
    assert.equal(
      reasonFromShopPatchBody(
        { error: "Synchronisation Stripe impossible. Vérifiez la clé de test et réessayez." },
        502,
      ),
      "Synchronisation Stripe impossible. Vérifiez la clé de test et réessayez.",
    );
  });

  it("traduit l'accès refusé et ne masque pas un code HTTP sans message", () => {
    assert.equal(reasonFromShopPatchBody({ error: "Unauthorized" }, 401), "Accès réservé au créateur.");
    assert.equal(
      reasonFromShopPatchBody(null, 500),
      "Le statut du pack n'a pas pu être modifié (code 500).",
    );
    assert.equal(
      reasonFromShopPatchBody({ error: "   " }, 400),
      "Le statut du pack n'a pas pu être modifié (code 400).",
    );
  });

  it("formule en français une coupure réseau", () => {
    assert.equal(
      reasonFromThrown(new TypeError("Failed to fetch")),
      "La requête n'a pas abouti. Vérifiez la connexion et réessayez.",
    );
    assert.equal(reasonFromThrown(new Error("connexion interrompue")), "connexion interrompue");
    assert.equal(reasonFromThrown("autre"), "Le statut du pack n'a pas pu être modifié.");
  });
});

describe("applyPackVisibilitySequentially", () => {
  const targets: ShopPackRef[] = [
    { id: "a", title: "Environnement" },
    { id: "b", title: "Voyage" },
    { id: "c", title: "Santé" },
  ];

  it("attend la fin d'un pack avant de lancer le suivant", async () => {
    let releaseFirst: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const calls: string[] = [];
    let overlapped = false;
    let active = false;

    const pending = applyPackVisibilitySequentially(targets.slice(0, 2), true, async (pack, isActive) => {
      if (active) overlapped = true;
      active = true;
      calls.push(`${pack.id}:${String(isActive)}`);
      if (pack.id === "a") await gate;
      active = false;
      return { ok: true };
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(calls, ["a:true"]);
    releaseFirst();
    const report = await pending;
    assert.equal(overlapped, false);
    assert.deepEqual(calls, ["a:true", "b:true"]);
    assert.deepEqual(
      report.succeeded.map((pack) => pack.id),
      ["a", "b"],
    );
    assert.deepEqual(report.failed, []);
  });

  it("continue après un échec Stripe et conserve le nom et la raison", async () => {
    const seen: string[] = [];
    const report = await applyPackVisibilitySequentially(targets, true, async (pack) => {
      seen.push(pack.id);
      if (pack.id === "b") {
        return {
          ok: false,
          reason: "Synchronisation Stripe impossible. Vérifiez la clé de test et réessayez.",
        };
      }
      return { ok: true };
    });

    assert.deepEqual(seen, ["a", "b", "c"]);
    assert.deepEqual(
      report.succeeded.map((pack) => pack.title),
      ["Environnement", "Santé"],
    );
    assert.deepEqual(report.failed, [
      {
        id: "b",
        title: "Voyage",
        reason: "Synchronisation Stripe impossible. Vérifiez la clé de test et réessayez.",
      },
    ]);
  });

  it("n'arrête pas la série si un appel lève une erreur", async () => {
    const report = await applyPackVisibilitySequentially(targets, false, async (pack) => {
      if (pack.id === "b") throw new Error("connexion interrompue");
      return { ok: true };
    });
    assert.deepEqual(
      report.succeeded.map((pack) => pack.id),
      ["a", "c"],
    );
    assert.equal(report.failed[0]?.reason, "connexion interrompue");
    assert.equal(
      formatPackVisibilitySummary(report.succeeded.length, report.failed.length, false),
      "2 packs masqués, 1 en échec.",
    );
  });

  it("remplace une raison vide et signale le pack en cours", async () => {
    const started: string[] = [];
    const report = await applyPackVisibilitySequentially(
      targets.slice(0, 1),
      true,
      async () => ({ ok: false, reason: "  " }),
      {
        onPackStart(pack, index, total) {
          started.push(`${pack.title}:${index}:${total}`);
        },
      },
    );
    assert.deepEqual(started, ["Environnement:0:1"]);
    assert.equal(report.failed[0]?.reason, "Le statut du pack n'a pas pu être modifié.");
  });
});
