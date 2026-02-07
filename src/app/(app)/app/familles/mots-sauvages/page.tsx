"use client";

import Link from "next/link";

export default function MotsSauvagesPage() {
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
          Mots sauvages
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Scanne un texte (livre, presse, magazine, PDF). Chaque mot détecté sera cliquable pour afficher sa traduction contextuelle et l’ajouter à une liste.
        </p>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Cette fonctionnalité sera disponible prochainement (OCR + traduction IA).
        </p>
      </div>
    </div>
  );
}
