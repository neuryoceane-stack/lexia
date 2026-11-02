/**
 * Espace créateur (mission K1).
 *
 * La section active vient de l'URL (`/app/creator?section=…`) pour que le lien
 * soit partageable et que le bouton Retour du navigateur fonctionne.
 * `onglet` est réservé à Élèves, quand plusieurs onglets existeront.
 *
 * Correspondance avec les données déjà affichées :
 * - overview  → analytics (GET /api/creator/analytics)
 * - health    → feedbacks (GET et PATCH /api/creator/feedbacks)
 * - finance   → finance (GET /api/creator/finance), alertes comprises
 * - shop      → boutique déjà en place ( /api/creator/shop )
 * - students  → onglet Établissements : aucune liste n'est exposée aujourd'hui
 * - funnel, churn, promo, announcements → pas de données, état vide
 */

export const CREATOR_SECTIONS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "funnel", label: "Entonnoir et coûts" },
  { id: "students", label: "Élèves" },
  { id: "health", label: "Retours et santé" },
  { id: "finance", label: "Finance" },
  { id: "churn", label: "Désabonnements" },
  { id: "shop", label: "Boutique" },
  { id: "promo", label: "Codes promo" },
  { id: "announcements", label: "Annonces" },
] as const;

export type CreatorSectionId = (typeof CREATOR_SECTIONS)[number]["id"];

export const EMPTY_SECTION_IDS = ["funnel", "churn", "promo", "announcements"] as const;
export type EmptySectionId = (typeof EMPTY_SECTION_IDS)[number];

/** Ajouter un objet ici pour exposer un nouvel onglet dans Élèves. */
export const STUDENT_TABS = [{ id: "etablissements", label: "Établissements" }] as const;

export type StudentTabId = (typeof STUDENT_TABS)[number]["id"];

export function parseCreatorSection(value: string | undefined): CreatorSectionId {
  if (value && CREATOR_SECTIONS.some((section) => section.id === value)) {
    return value as CreatorSectionId;
  }
  return "overview";
}

export function parseStudentTab(value: string | undefined): StudentTabId {
  if (value && STUDENT_TABS.some((tab) => tab.id === value)) {
    return value as StudentTabId;
  }
  return STUDENT_TABS[0].id;
}

export function creatorHref(section: CreatorSectionId, onglet?: StudentTabId): string {
  const params = new URLSearchParams();
  if (section !== "overview") params.set("section", section);
  if (section === "students" && onglet && onglet !== STUDENT_TABS[0].id) {
    params.set("onglet", onglet);
  }
  const query = params.toString();
  return query ? `/app/creator?${query}` : "/app/creator";
}
