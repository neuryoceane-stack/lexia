import Link from "next/link";

const backArrow = (
  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--background-subtle)]" aria-hidden>
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  </span>
);

const backClassName =
  "mb-4 inline-flex items-center gap-2 text-base font-medium text-[var(--foreground-muted)] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md";

/**
 * Lien ou bouton « Retour » visible en haut à gauche sur les écrans secondaires.
 * À placer en premier dans le contenu de la page.
 * Si onClick est fourni, rend un bouton ; sinon un lien vers href.
 */
export function BackLink({
  href,
  children = "Retour",
  ariaLabel,
  onClick,
}: {
  href: string;
  children?: React.ReactNode;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  const label = ariaLabel ?? (typeof children === "string" ? children : "Retour");
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={backClassName}
      >
        {backArrow}
        {children}
      </button>
    );
  }
  return (
    <Link href={href} aria-label={label} className={backClassName}>
      {backArrow}
      {children}
    </Link>
  );
}
