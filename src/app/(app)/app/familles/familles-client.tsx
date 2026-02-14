"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FamillesClient() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/familles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        setLoading(false);
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-relief rounded-lg bg-accent px-4 py-2 text-sm font-medium text-vocab-gray hover:bg-accent/90"
      >
        Créer une famille
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Nouvelle famille
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="family-name"
                  className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Nom (ex. Corps, Adverbes)
                </label>
                <input
                  id="family-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Corps"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-relief flex-1 rounded-lg border border-slate-300 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-relief flex-1 rounded-lg bg-primary py-2 text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {loading ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
