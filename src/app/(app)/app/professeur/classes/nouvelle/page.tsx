import Link from "next/link";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import { CreerClasseForm } from "./creer-classe-form";

function BackIcon({ className }: { className?: string }) {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function NouvelleClassePage() {
  return (
    <div className="mx-auto max-w-[560px]">
      <Link
        href="/app/professeur/classes"
        className="btn-relief mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-vocab-gray hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <BackIcon className="h-4 w-4" />
        Retour
      </Link>

      <h1 className="text-2xl font-bold text-vocab-gray dark:text-slate-100">
        Créer une classe
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Donnez un titre et une langue à votre classe. Vous pourrez ensuite déposer des listes de vocabulaire et partager l&apos;identifiant avec vos élèves.
      </p>

      <CreerClasseForm
        langues={PREFERRED_LANGUAGE_OPTIONS}
        className="mt-8"
      />
    </div>
  );
}
