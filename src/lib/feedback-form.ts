export const FEEDBACK_DESCRIPTION_MAX = 1000;

export const FEEDBACK_TYPES = ["bug", "idee", "question"] as const;
export type FeedbackFormType = (typeof FEEDBACK_TYPES)[number];

export type FeedbackFormInput = {
  type: unknown;
  description: unknown;
};

export type FeedbackFormValidation =
  | { ok: true; type: FeedbackFormType; description: string }
  | { ok: false; error: string };

export function parseFeedbackType(value: unknown): FeedbackFormType | null {
  if (typeof value !== "string") return null;
  return FEEDBACK_TYPES.includes(value as FeedbackFormType)
    ? (value as FeedbackFormType)
    : null;
}

export function validateFeedbackForm(input: FeedbackFormInput): FeedbackFormValidation {
  const type = parseFeedbackType(input.type);
  if (!type) {
    return { ok: false, error: "Le type est requis." };
  }

  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  if (!description) {
    return { ok: false, error: "La description est requise." };
  }
  if (description.length > FEEDBACK_DESCRIPTION_MAX) {
    return {
      ok: false,
      error: `La description ne peut pas dépasser ${FEEDBACK_DESCRIPTION_MAX} caractères.`,
    };
  }

  return { ok: true, type, description };
}

export function isFeedbackFormValid(input: FeedbackFormInput): boolean {
  return validateFeedbackForm(input).ok;
}
