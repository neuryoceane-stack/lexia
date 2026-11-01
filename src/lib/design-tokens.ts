/**
 * Charte Lexiva — mêmes valeurs que les variables CSS de `src/app/globals.css`.
 * Les e-mails et le manifeste PWA ne peuvent pas lire ces variables :
 * ils importent ce module, ou recopient l'hex en restant alignés ici.
 * Ne pas introduire un autre hex pour ces rôles.
 */
export const designTokens = {
  page: "#F7F9F6",
  surface: "#FFFFFF",
  ink: "#12332B",
  /** Encre assombrie, uniquement pour le survol des boutons déjà en encre. */
  inkHover: "#0F2B25",
  textSecondary: "#4F615B",
  borderCard: "#BFCBE3",
  highlighter: "#F3E96B",
  justBg: "#E3F3EA",
  justText: "#17603B",
  justSign: "#1F7A4D",
  falseBg: "#FBE9E7",
  falseText: "#9C1F18",
  falseSign: "#B3261E",
} as const;
