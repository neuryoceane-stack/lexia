export const EMAIL_EVENT_TYPES = [
  "password_reset",
  "review_reminder",
  "streak_alert",
  "weekly_summary",
  "other",
] as const;

export type EmailEventTypeLabel = (typeof EMAIL_EVENT_TYPES)[number];

export const EMAIL_TYPE_LABELS: Record<EmailEventTypeLabel, string> = {
  password_reset: "Mot de passe oublié",
  review_reminder: "Rappel de révision",
  streak_alert: "Alerte de série",
  weekly_summary: "Bilan hebdomadaire",
  other: "Autre",
};
