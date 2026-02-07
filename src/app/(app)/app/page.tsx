import Link from "next/link";

function IconLibrary({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

function IconEvaluation({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconSynthese({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

const cardBase =
  "group relative flex flex-col rounded-xl border border-slate-200/90 bg-white p-8 shadow-sm transition-all duration-[200ms] ease-out hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-slate-600";

export default async function AppDashboardPage() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
        {/* Carte 1 — Bibliothèque */}
        <Link
          href="/app/familles"
          className={`${cardBase} hover:border-p2-primary/40 dark:hover:border-p2-primary/50`}
        >
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-p2-primary/10 text-p2-primary transition-colors duration-200 group-hover:bg-p2-primary/20 dark:bg-p2-primary/20 dark:group-hover:bg-p2-primary/30">
            <IconLibrary className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
            Bibliothèque
          </h2>
          <p className="mt-1.5 text-sm font-normal text-slate-500 dark:text-slate-400">
            Tes familles et listes de mots. Organise et importe (PDF, photo).
          </p>
          <span className="mt-4 inline-flex w-fit rounded-full bg-p2-primary/10 px-2.5 py-1 text-xs font-medium text-p2-primary dark:bg-p2-primary/20 dark:text-p2-primary">
            Importer PDF / photo
          </span>
        </Link>

        {/* Carte 2 — Évaluation (mise en avant) */}
        <Link
          href="/app/revision"
          className={`${cardBase} border-primary/30 shadow-md hover:border-primary/50 hover:shadow-lg dark:border-primary/40 dark:bg-slate-800 dark:hover:border-primary/60`}
        >
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary/25 dark:bg-primary/25 dark:text-primary-light dark:group-hover:bg-primary/35">
            <IconEvaluation className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
            Évaluation
          </h2>
          <p className="mt-1.5 text-sm font-normal text-slate-500 dark:text-slate-400">
            S’entraîner aux mots : flashcards ou écrit. Focus et régularité.
          </p>
        </Link>

        {/* Carte 3 — Synthèse (Palette 3 – turquoise) */}
        <Link
          href="/app/jardin"
          className={`${cardBase} hover:border-p3-turquoise/40 dark:hover:border-p3-turquoise/50`}
        >
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-p3-turquoise/10 text-p3-turquoise transition-colors duration-200 group-hover:bg-p3-turquoise/20 dark:bg-p3-turquoise/20 dark:group-hover:bg-p3-turquoise/30">
            <IconSynthese className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
            Synthèse
          </h2>
          <p className="mt-1.5 text-sm font-normal text-slate-500 dark:text-slate-400">
            Vue d’ensemble de ta progression.
          </p>
        </Link>
      </div>
    </div>
  );
}
