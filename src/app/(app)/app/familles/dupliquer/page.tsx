"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function DupliquerPage() {
  const searchParams = useSearchParams();
  const listId = searchParams.get("listId");

  return (
    <div className="space-y-6">
      <Link
        href="/app/familles"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
      >
        <span aria-hidden>←</span>
        Retour à la bibliothèque
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Dupliquer dans une autre langue
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Aperçu de la liste traduite, modification des traductions, puis validation pour enregistrer.
        </p>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {listId ? `Liste : ${listId}` : "Aucune liste sélectionnée."} Cette fonctionnalité (traduction automatique + aperçu) sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
