import Link from "next/link";
import { auth } from "@/lib/auth";

function IconClass({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconLibrary({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

const cardBase =
  "group relative flex flex-col rounded-xl border border-slate-200/90 bg-white p-8 shadow-sm transition-all duration-[200ms] ease-out hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-slate-600";

export default async function ProfesseurAccueilPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-vocab-gray dark:text-slate-100">
          Bienvenue
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Gérez vos classes et votre bibliothèque de listes de vocabulaire.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/app/professeur/classes"
          className={`${cardBase} hover:border-primary/40 dark:hover:border-primary/50`}
        >
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30">
            <IconClass className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
            Mes classes
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Créez des classes, partagez l&apos;identifiant avec vos élèves et assignez des listes de vocabulaire.
          </p>
        </Link>

        <Link
          href="/app/familles"
          className={`${cardBase} hover:border-primary/40 dark:hover:border-primary/50`}
        >
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30">
            <IconLibrary className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
            Ma bibliothèque
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Vos familles et listes de mots. Importez depuis un PDF ou une photo, puis assignez les listes à vos classes.
          </p>
        </Link>
      </div>
    </div>
  );
}
