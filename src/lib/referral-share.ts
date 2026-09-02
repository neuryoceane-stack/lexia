/** Utilitaires parrainage sans accès base de données (safe côté client). */

export type UserReferralInfo = {
  referralCode: string;
  referralCount: number;
};

export function buildReferralShareUrl(code: string, baseUrl: string): string {
  const origin = baseUrl.replace(/\/$/, "");
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}
