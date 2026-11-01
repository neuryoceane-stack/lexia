import { BRAND_MARK, BRAND_SHORT } from "@/lib/brand";

type LogoSize = "header" | "auth" | "hero";

type LogoProps = {
  /** header : en-tête et pied de page. auth : connexion et inscription. hero : accueil public. */
  size?: LogoSize;
  className?: string;
};

const SIZE_CLASS: Record<LogoSize, string> = {
  header: "logo-header",
  auth: "logo-auth",
  hero: "logo-hero",
};

export function Logo({ size = "header", className }: LogoProps) {
  return (
    <span className={["logo", SIZE_CLASS[size], className].filter(Boolean).join(" ")}>
      <span className="font-heading">{BRAND_SHORT}</span>
      <span className="marker font-heading">{BRAND_MARK}</span>
    </span>
  );
}
