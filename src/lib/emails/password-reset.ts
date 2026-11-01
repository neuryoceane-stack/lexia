import { BRAND_MARK, BRAND_NAME, BRAND_SHORT } from "@/lib/brand";
import { designTokens } from "@/lib/design-tokens";

const FROM_ADDRESS = "noreply@lexiva.app";

export function passwordResetEmail(resetUrl: string): {
  from: string;
  subject: string;
  html: string;
} {
  const { ink, surface, textSecondary, highlighter } = designTokens;

  return {
    from: `${BRAND_NAME} <${FROM_ADDRESS}>`,
    subject: `Réinitialisation de ton mot de passe ${BRAND_NAME}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: ${surface}; color: ${ink};">
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="margin: 0; font-family: 'Bricolage Grotesque', Georgia, serif; font-size: 32px; font-weight: 700; letter-spacing: -0.03em; line-height: 1;">
            <span style="color: ${ink};">${BRAND_SHORT}</span>
            <span style="display: inline-block; margin-left: 8px; padding: 0 8px; color: ${ink}; background: ${highlighter}; border-radius: 0.8em 0.3em; transform: rotate(-2deg);">${BRAND_MARK}</span>
          </p>
        </div>
        <h2 style="color: ${ink}; font-size: 20px; font-weight: 500; margin: 0 0 12px;">Réinitialisation de ton mot de passe</h2>
        <p style="color: ${textSecondary}; line-height: 1.6; margin: 0;">
          Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour en choisir un nouveau.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: ${ink}; color: ${surface}; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: ${textSecondary}; font-size: 13px; line-height: 1.5; margin: 0;">
          Ce lien est valable 1 heure. Si tu n'as pas fait cette demande, ignore cet e-mail.
        </p>
        <p style="color: ${textSecondary}; font-size: 12px; line-height: 1.5; margin: 28px 0 0; text-align: center;">
          ${BRAND_NAME}<br />
          Message envoyé par ${FROM_ADDRESS}
        </p>
      </div>
    `,
  };
}
