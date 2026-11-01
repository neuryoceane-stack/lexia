import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page font-sans text-ink">
      <div className="mx-auto max-w-[720px] px-6 py-12 sm:px-8 sm:py-16">
        <Link
          href="/"
          className="mb-10 inline-flex items-center text-sm font-medium text-ink transition hover:text-ink"
        >
          ← Retour à l&apos;accueil
        </Link>

        <article className="legal-prose text-[15px] text-ink/80 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ink [&_h1]:mb-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-ink [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink/80 [&_li]:mb-1.5 [&_mark]:opacity-100 [&_mark]:text-ink [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p]:leading-relaxed [&_section]:mb-8 [&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-line [&_th]:bg-[var(--background-subtle)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink/90 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </article>
      </div>
    </div>
  );
}
