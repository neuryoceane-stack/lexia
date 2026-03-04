import Link from "next/link";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default async function MesClassesPage() {
  const user = await getUser();
  if (!user?.id) return null;

  const teacherClasses = await db
    .select()
    .from(classes)
    .where(eq(classes.teacherId, user.id))
    .orderBy(desc(classes.createdAt));

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link
        href="/app/professeur"
        className="btn-relief mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Retour à l&apos;accueil
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-vocab-gray dark:text-slate-100">
            Mes classes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Créez des classes, partagez l&apos;identifiant avec vos élèves et gérez les listes de vocabulaire.
          </p>
        </div>
        <Link
          href="/app/professeur/classes/nouvelle"
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <IconPlus className="h-5 w-5" />
          Créer une classe
        </Link>
      </div>

      {teacherClasses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/30">
          <IconClass className="mx-auto h-14 w-14 text-slate-400 dark:text-slate-500" />
          <h2 className="mt-4 text-lg font-semibold text-vocab-gray dark:text-slate-200">
            Aucune classe
          </h2>
          <p className="mt-2 max-w-sm mx-auto text-sm text-slate-500 dark:text-slate-400">
            Créez votre première classe pour commencer. Vous obtiendrez un identifiant unique à partager avec vos élèves.
          </p>
          <Link
            href="/app/professeur/classes/nouvelle"
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            <IconPlus className="h-5 w-5" />
            Créer une classe
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teacherClasses.map((cls) => (
            <li key={cls.id}>
              <Link
                href={`/app/professeur/classes/${cls.id}`}
                className="group flex flex-col rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-slate-700/80 dark:bg-slate-800/80 dark:hover:border-slate-600"
              >
                <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30">
                  <IconClass className="h-6 w-6" />
                </span>
                <h2 className="text-lg font-semibold text-vocab-gray dark:text-slate-100">
                  {cls.title}
                </h2>
                {cls.language && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Langue : {cls.language}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {cls.identifier}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Identifiant classe
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
