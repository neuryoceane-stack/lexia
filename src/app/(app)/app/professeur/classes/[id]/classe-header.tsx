"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClasseHeader({
  classId,
  initialTitle,
  language,
}: {
  classId: string;
  initialTitle: string;
  language: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState<"rename" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const next = title.trim();
    if (next.length < 2) {
      setError("Le nom doit faire au moins 2 caractères.");
      return;
    }
    setError("");
    setLoading("rename");
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la modification de la classe.");
        return;
      }
      setEditing(false);
      setTitle(data.title ?? next);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Supprimer cette classe et toutes les données associées (élèves, listes assignées) ? Cette action est irréversible."
      )
    ) {
      return;
    }
    setLoading("delete");
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la suppression de la classe.");
        setLoading(null);
        return;
      }
      router.push("/app/professeur/classes");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {editing ? (
          <form onSubmit={handleRename} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg font-semibold text-vocab-gray dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading === "rename"}
                className="btn-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {loading === "rename" ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setTitle(initialTitle);
                  setError("");
                }}
                className="btn-relief rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-vocab-gray dark:text-slate-100">
              {title}
            </h1>
            {language && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Langue : {language}
              </p>
            )}
          </>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-relief rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Modifier la classe
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading === "delete"}
          className="btn-relief rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          {loading === "delete" ? "Suppression…" : "Supprimer la classe"}
        </button>
      </div>
    </div>
  );
}

